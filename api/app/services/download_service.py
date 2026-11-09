import asyncio
import copy
import shutil
from pathlib import Path
from datetime import datetime, timedelta, timezone
from typing import Optional, Any
import yt_dlp
from yt_dlp.utils import DownloadCancelled
from bson import ObjectId

from app.models.download_job import DownloadJob, JobStatus
from beanie.operators import In
from app.core.logging import get_logger
from app.core.config import settings
from app.services.ytdlp_utils import build_ytdlp_options, YTDLPLogger, clean_ytdlp_error
from app.services.format_service import FormatService
from app.services.ytdlp_engine import (
    get_download_semaphore,
    get_extraction_semaphore,
    get_cached_info,
    set_cached_info,
    invalidate_cached_info,
    get_job_state,
    is_job_cancelled,
    unregister_job,
    update_job_progress,
    update_job_merging,
    update_job_status,
    update_job_metadata,
    update_job_done,
)

logger = get_logger(__name__)


def _to_utc(dt: Optional[datetime]) -> datetime:
    if dt is None:
        return datetime.now(timezone.utc)
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


async def fail_if_stale(job: DownloadJob) -> DownloadJob:
    if job.status not in (JobStatus.QUEUED, JobStatus.RUNNING, JobStatus.MERGING):
        return job

    now = datetime.now(timezone.utc)
    updated_at_utc = _to_utc(job.updated_at)

    heartbeat_stale = (now - updated_at_utc).total_seconds() > settings.JOB_STALE_SECONDS

    runtime_stale = False
    if job.status in (JobStatus.RUNNING, JobStatus.MERGING):
        ref_time = job.started_at if job.started_at is not None else job.created_at
        ref_time_utc = _to_utc(ref_time)
        runtime_stale = (now - ref_time_utc).total_seconds() > (settings.JOB_MAX_RUNTIME_MINUTES * 60)

    is_stale = heartbeat_stale or runtime_stale

    if is_stale:
        job.status = JobStatus.FAILED
        job.error_message = "La descarga se interrumpió. Vuelve a intentarlo."
        job.progress_text = "Error: interrumpida"
        job.updated_at = now
        await job.save()
        logger.warning(
            "Download job %s marcado como failed por inactividad o tiempo límite excedido",
            job.id
        )

    return job


def remove_job_temp_dir_sync(job_id_or_folder_name: str) -> bool:
    """Borra de forma segura y síncrona la subcarpeta de un job dentro de settings.TEMP_DIR."""
    try:
        temp_dir_base = Path(settings.TEMP_DIR).resolve()
        target_dir = (Path(settings.TEMP_DIR) / str(job_id_or_folder_name)).resolve()

        if target_dir == temp_dir_base:
            logger.warning("Intento de borrado de la raíz de TEMP_DIR bloqueado: %s", target_dir)
            return False

        if not target_dir.is_relative_to(temp_dir_base):
            logger.warning("Intento de borrado fuera de TEMP_DIR bloqueado: %s", target_dir)
            return False

        if not target_dir.exists() or not target_dir.is_dir():
            return False

        shutil.rmtree(target_dir, ignore_errors=True)
        return True
    except Exception:
        logger.exception("Error borrando subcarpeta temporal %s", job_id_or_folder_name)
        return False


async def remove_job_temp_dir(job_id_or_folder_name: str) -> bool:
    """Borra de forma segura y asíncrona la subcarpeta de un job dentro de settings.TEMP_DIR."""
    return await asyncio.to_thread(remove_job_temp_dir_sync, job_id_or_folder_name)


async def cleanup_downloads() -> int:
    """Realiza dos pasadas de limpieza sobre settings.TEMP_DIR:
    1. Vencidos: busca jobs DONE con expires_at anterior a ahora (UTC), borra su subcarpeta
       y actualiza el job de forma condicional a EXPIRED.
    2. Huérfanos: recorre las subcarpetas directas de settings.TEMP_DIR ignorando jobs
       activos en memoria. Si no es un id válido, no existe o no es DONE con expires_at
       en el futuro, borra la subcarpeta.
    Devuelve el número total de carpetas borradas de disco.
    """
    deleted_count = 0
    now = datetime.now(timezone.utc)

    # 1. Pasada de vencidos
    try:
        expired_jobs = await DownloadJob.find(
            DownloadJob.status == JobStatus.DONE,
            DownloadJob.expires_at < now,
        ).to_list()
    except Exception:
        logger.exception("Error consultando jobs vencidos en la base de datos")
        expired_jobs = []

    for job in expired_jobs:
        try:
            if await remove_job_temp_dir(str(job.id)):
                deleted_count += 1

            await DownloadJob.find_one(
                DownloadJob.id == job.id,
                DownloadJob.status == JobStatus.DONE,
            ).update({
                "$set": {
                    "status": JobStatus.EXPIRED,
                    "updated_at": now,
                }
            })
        except Exception:
            logger.exception("Error limpiando descarga vencida %s", job.id)

    # 2. Pasada de huérfanos
    temp_dir_path = Path(settings.TEMP_DIR)
    if temp_dir_path.exists() and temp_dir_path.is_dir():
        try:
            subdirs = await asyncio.to_thread(
                lambda: [p.name for p in temp_dir_path.iterdir() if p.is_dir()]
            )
        except Exception:
            logger.exception("Error listando subcarpetas de TEMP_DIR (%s)", temp_dir_path)
            subdirs = []

        for folder_name in subdirs:
            try:
                # Sáltate las que correspondan a un job activo en memoria
                if get_job_state(folder_name) is not None:
                    continue

                should_delete = False
                if not ObjectId.is_valid(folder_name):
                    should_delete = True
                else:
                    job = await DownloadJob.get(folder_name)
                    if job is None:
                        should_delete = True
                    else:
                        is_valid_done = (
                            job.status == JobStatus.DONE
                            and job.expires_at is not None
                            and _to_utc(job.expires_at) > now
                        )
                        if not is_valid_done:
                            should_delete = True

                if should_delete:
                    if await remove_job_temp_dir(folder_name):
                        deleted_count += 1
            except Exception:
                logger.exception("Error procesando carpeta huérfana %s", folder_name)

    return deleted_count


async def cleanup_loop() -> None:
    """Bucle periódico que ejecuta la limpieza de descargas al arrancar y cada CLEANUP_INTERVAL_SECONDS."""
    try:
        while True:
            try:
                deleted_count = await cleanup_downloads()
                if deleted_count > 0:
                    logger.info("Limpieza periódica de temporales: %d carpeta(s) eliminada(s)", deleted_count)
            except Exception:
                logger.exception("Error no controlado durante la vuelta de limpieza periódica")

            await asyncio.sleep(settings.CLEANUP_INTERVAL_SECONDS)
    except asyncio.CancelledError:
        pass


def _make_download_hooks(job_id_str: str, is_audio: bool):
    def progress_hook(d: dict):
        if is_job_cancelled(job_id_str):
            raise DownloadCancelled("Download cancelled by user")

        status = d.get("status")
        if status in ("downloading", "finished"):
            info = d.get("info_dict") or {}
            vcodec = info.get("vcodec", "none")
            is_stream_video = bool(vcodec and vcodec != "none")

            downloaded = d.get("downloaded_bytes") or 0
            total = d.get("total_bytes") or d.get("total_bytes_estimate") or 0
            if status == "finished":
                pct = 1.0
            elif total > 0:
                pct = min(1.0, max(0.0, downloaded / float(total)))
            else:
                pct = 0.0

            if is_audio:
                stage = "audio"
                audio_prog = pct
                total_prog = pct
                prog_text = f"Descargando audio {int(pct * 100)}%"
                video_prog = 0.0
            else:
                acodec = info.get("acodec", "none")
                is_single_format = bool(is_stream_video and acodec and acodec != "none")

                if is_stream_video:
                    stage = "video"
                    video_prog = pct
                    audio_prog = 0.0
                    prog_text = f"Descargando video {int(pct * 100)}%"
                    total_prog = pct if is_single_format else pct * 0.5
                else:
                    stage = "audio"
                    audio_prog = pct
                    video_prog = 1.0
                    prog_text = f"Descargando audio {int(pct * 100)}%"
                    total_prog = 0.5 + (pct * 0.5)

            update_job_progress(
                job_id_str,
                stage=stage,
                video_progress=video_prog,
                audio_progress=audio_prog,
                progress=total_prog,
                progress_text=prog_text,
            )

    def postprocessor_hook(d: dict):
        if is_job_cancelled(job_id_str):
            raise DownloadCancelled("Download cancelled by user")

        status = d.get("status")
        if status == "started":
            stage = "merging"
            status_val = JobStatus.MERGING.value
            prog_text = "Convirtiendo a MP3..." if is_audio else "Combinando audio y video..."
            update_job_merging(
                job_id_str,
                status=status_val,
                stage=stage,
                video_progress=1.0,
                audio_progress=1.0,
                progress=1.0,
                progress_text=prog_text,
            )

    return progress_hook, postprocessor_hook


def _download_from_info_sync(
    job_id_str: str,
    temp_dir: Path,
    job_format: str,
    format_string: Optional[str],
    info_dict: dict[str, Any],
    ignore_cookies: bool = False
) -> tuple[bool, str]:
    yl = YTDLPLogger(logger)
    opts = build_ytdlp_options(ignore_cookies=ignore_cookies, ytdlp_logger=yl)
    output_template = str(temp_dir / "%(title)s.%(ext)s")
    is_audio = job_format in ("audioMP3", "audio")
    ph, pph = _make_download_hooks(job_id_str, is_audio)

    opts.update({
        "noplaylist": True,
        "outtmpl": {"default": output_template},
        "progress_hooks": [ph],
        "postprocessor_hooks": [pph],
    })

    if is_audio:
        opts["format"] = "bestaudio/best"
        opts["postprocessors"] = [{
            "key": "FFmpegExtractAudio",
            "preferredcodec": "mp3",
        }]
    else:
        opts["format"] = format_string or "bestvideo+bestaudio/best"
        opts["merge_output_format"] = "mp4"

    try:
        with yt_dlp.YoutubeDL(opts) as ydl:
            ydl.process_ie_result(copy.deepcopy(info_dict), download=True)
            return True, ""
    except DownloadCancelled:
        raise
    except Exception as e:
        err = yl.last_error or str(e)
        return False, err


class DownloadService:
    fail_if_stale = staticmethod(fail_if_stale)
    remove_job_temp_dir = staticmethod(remove_job_temp_dir)
    cleanup_downloads = staticmethod(cleanup_downloads)
    cleanup_loop = staticmethod(cleanup_loop)

    @staticmethod
    async def start_download(job: DownloadJob) -> None:
        job_id_str = str(job.id)
        temp_dir = Path(settings.TEMP_DIR) / job_id_str
        progress_flush_task: Optional[asyncio.Task] = None
        final_status: JobStatus = JobStatus.FAILED

        # Tarea en segundo plano para flush de progreso y heartbeat a Mongo
        async def _progress_flush_loop() -> None:
            last_flushed_snapshot = None
            last_heartbeat_time = datetime.now(timezone.utc)
            try:
                while True:
                    await asyncio.sleep(settings.PROGRESS_FLUSH_SECONDS)
                    now = datetime.now(timezone.utc)
                    state = get_job_state(job_id_str)
                    if not state:
                        continue

                    snapshot = (
                        state.status,
                        state.stage,
                        round(state.video_progress, 4),
                        round(state.audio_progress, 4),
                        round(state.progress, 4),
                        state.progress_text,
                        state.title,
                        state.thumbnail_url,
                        state.error_message,
                    )

                    if snapshot != last_flushed_snapshot:
                        set_doc: dict[str, Any] = {
                            "status": state.status,
                            "stage": state.stage,
                            "video_progress": state.video_progress,
                            "audio_progress": state.audio_progress,
                            "progress": state.progress,
                            "progress_text": state.progress_text,
                            "updated_at": now,
                        }
                        if state.title:
                            set_doc["title"] = state.title
                        if state.thumbnail_url:
                            set_doc["thumbnail_url"] = state.thumbnail_url
                        if state.error_message:
                            set_doc["error_message"] = state.error_message

                        await DownloadJob.find_one(
                            DownloadJob.id == job.id,
                            In("status", [JobStatus.QUEUED, JobStatus.RUNNING, JobStatus.MERGING])
                        ).update({"$set": set_doc})

                        last_flushed_snapshot = snapshot
                        last_heartbeat_time = now
                    else:
                        if (now - last_heartbeat_time).total_seconds() >= settings.JOB_HEARTBEAT_SECONDS:
                            await DownloadJob.find_one(
                                DownloadJob.id == job.id,
                                In("status", [JobStatus.QUEUED, JobStatus.RUNNING, JobStatus.MERGING])
                            ).update({"$set": {"updated_at": now}})
                            last_heartbeat_time = now
            except asyncio.CancelledError:
                pass
            except Exception:
                logger.exception("Error en _progress_flush_loop para job %s", job_id_str)

        try:
            progress_flush_task = asyncio.create_task(_progress_flush_loop())

            # Si el trabajo se canceló estando en cola, no descarga nada
            if is_job_cancelled(job_id_str):
                final_status = JobStatus.CANCELLED
                return

            # Adquirir semáforo de descarga
            async with get_download_semaphore():
                if is_job_cancelled(job_id_str):
                    final_status = JobStatus.CANCELLED
                    return

                # Comprobar espacio libre en TEMP_DIR antes de descargar
                try:
                    Path(settings.TEMP_DIR).mkdir(parents=True, exist_ok=True)
                    disk_stat = shutil.disk_usage(settings.TEMP_DIR)
                    free_mb = disk_stat.free // (1024 * 1024)
                except Exception:
                    free_mb = 999999

                if free_mb < settings.MIN_FREE_DISK_MB:
                    err_msg = "Servidor sin espacio, inténtalo más tarde"
                    logger.error(
                        "Download job %s falló: servidor sin espacio libre suficiente (%d MB < %d MB)",
                        job_id_str, free_mb, settings.MIN_FREE_DISK_MB
                    )
                    final_status = JobStatus.FAILED
                    now = datetime.now(timezone.utc)
                    await DownloadJob.find_one(
                        DownloadJob.id == job.id,
                        DownloadJob.status != JobStatus.CANCELLED
                    ).update({
                        "$set": {
                            "status": JobStatus.FAILED,
                            "error_message": err_msg,
                            "progress_text": f"Error: {err_msg}",
                            "updated_at": now,
                        }
                    })
                    update_job_status(
                        job_id_str,
                        status=JobStatus.FAILED.value,
                        progress_text=f"Error: {err_msg}",
                        error_message=err_msg
                    )
                    return

                started_at = datetime.now(timezone.utc)
                temp_dir.mkdir(parents=True, exist_ok=True)

                update_job_status(job_id_str, status=JobStatus.RUNNING.value, progress_text="Descargando...")
                await DownloadJob.find_one(
                    DownloadJob.id == job.id,
                    DownloadJob.status != JobStatus.CANCELLED
                ).update({
                    "$set": {
                        "status": JobStatus.RUNNING,
                        "started_at": started_at,
                        "updated_at": started_at,
                    }
                })

                # Verificar si existe información en caché para la URL
                info_to_use = get_cached_info(job.url)
                from_cache = info_to_use is not None
                success = False
                err = ""

                if from_cache and info_to_use:
                    logger.info("Download job %s: using cached info for url=%s", job_id_str, job.url)
                    title = info_to_use.get("title")
                    thumbnail = info_to_use.get("thumbnail")
                    if title or thumbnail:
                        update_job_metadata(job_id_str, title=title, thumbnail_url=thumbnail)
                        now = datetime.now(timezone.utc)
                        await DownloadJob.find_one(
                            DownloadJob.id == job.id,
                            DownloadJob.status != JobStatus.CANCELLED
                        ).update({"$set": {"title": title, "thumbnail_url": thumbnail, "updated_at": now}})

                    success, err = await asyncio.to_thread(
                        _download_from_info_sync,
                        job_id_str,
                        temp_dir,
                        job.format,
                        job.format_string,
                        info_to_use,
                        False
                    )

                    if not success and not is_job_cancelled(job_id_str):
                        logger.warning(
                            "Download job %s falló usando caché (err=%s), reintentando con extracción nueva...",
                            job_id_str, err[:120]
                        )
                        invalidate_cached_info(job.url)
                        info_to_use = None
                        from_cache = False

                if not from_cache and not is_job_cancelled(job_id_str):
                    # Extracción dentro del semáforo de extracción
                    async with get_extraction_semaphore():
                        if is_job_cancelled(job_id_str):
                            final_status = JobStatus.CANCELLED
                            return

                        logger.info("Download job %s: extracting info inside semaphore for url=%s", job_id_str, job.url)
                        fresh_info, extract_err = await asyncio.to_thread(FormatService._extract_sync, job.url, False)
                        if not fresh_info and any(ck in extract_err.lower() for ck in ("cookie", "cookies", "rotated in the browser", "no longer valid")):
                            logger.warning(
                                "Download job %s extracción falló por cookies inválidas, reintentando extracción sin cookies: err=%s",
                                job_id_str, extract_err[:120]
                            )
                            fresh_info, extract_err = await asyncio.to_thread(FormatService._extract_sync, job.url, True)

                        if not fresh_info:
                            err = extract_err
                            success = False
                        else:
                            set_cached_info(job.url, fresh_info)
                            info_to_use = fresh_info
                            title = info_to_use.get("title")
                            thumbnail = info_to_use.get("thumbnail")
                            if title or thumbnail:
                                update_job_metadata(job_id_str, title=title, thumbnail_url=thumbnail)
                                now = datetime.now(timezone.utc)
                                await DownloadJob.find_one(
                                    DownloadJob.id == job.id,
                                    DownloadJob.status != JobStatus.CANCELLED
                                ).update({"$set": {"title": title, "thumbnail_url": thumbnail, "updated_at": now}})

                    if info_to_use and not is_job_cancelled(job_id_str):
                        success, err = await asyncio.to_thread(
                            _download_from_info_sync,
                            job_id_str,
                            temp_dir,
                            job.format,
                            job.format_string,
                            info_to_use,
                            False
                        )
                        if not success and not is_job_cancelled(job_id_str):
                            if any(ck in err.lower() for ck in ("cookie", "cookies", "rotated in the browser", "no longer valid")):
                                logger.warning(
                                    "Download job %s descarga falló por cookies, reintentando sin cookies: err=%s",
                                    job_id_str, err[:120]
                                )
                                success, err = await asyncio.to_thread(
                                    _download_from_info_sync,
                                    job_id_str,
                                    temp_dir,
                                    job.format,
                                    job.format_string,
                                    info_to_use,
                                    True
                                )

                if is_job_cancelled(job_id_str):
                    final_status = JobStatus.CANCELLED
                    return

                if success:
                    final_file = None
                    temp_extensions = {".part", ".ytdl", ".temp"}
                    for file_path in temp_dir.iterdir():
                        if file_path.is_file() and file_path.suffix.lower() not in temp_extensions:
                            final_file = file_path
                            break

                    if final_file:
                        final_status = JobStatus.DONE
                        now = datetime.now(timezone.utc)
                        expires_at = now + timedelta(minutes=settings.DOWNLOAD_TTL_MINUTES)
                        await DownloadJob.find_one(
                            DownloadJob.id == job.id,
                            DownloadJob.status != JobStatus.CANCELLED
                        ).update({
                            "$set": {
                                "status": JobStatus.DONE,
                                "stage": "done",
                                "video_progress": 1.0,
                                "audio_progress": 1.0,
                                "progress": 1.0,
                                "progress_text": "Completado",
                                "file_path": str(final_file),
                                "file_name": final_file.name,
                                "file_size": final_file.stat().st_size,
                                "expires_at": expires_at,
                                "updated_at": now,
                            }
                        })
                        update_job_done(job_id_str)
                    else:
                        final_status = JobStatus.FAILED
                        err_msg = f"El video supera el tamaño máximo de {settings.MAX_FILE_SIZE_MB} MB"
                        logger.warning("Download job %s falló: archivo no encontrado o excedió max_filesize", job_id_str)
                        now = datetime.now(timezone.utc)
                        await DownloadJob.find_one(
                            DownloadJob.id == job.id,
                            DownloadJob.status != JobStatus.CANCELLED
                        ).update({
                            "$set": {
                                "status": JobStatus.FAILED,
                                "error_message": err_msg,
                                "progress_text": f"Error: {err_msg}",
                                "updated_at": now,
                            }
                        })
                        update_job_status(
                            job_id_str,
                            status=JobStatus.FAILED.value,
                            progress_text=f"Error: {err_msg}",
                            error_message=err_msg
                        )
                else:
                    final_status = JobStatus.FAILED
                    clean_err = clean_ytdlp_error(err)
                    logger.error("Download job %s failed: %s", job_id_str, clean_err)
                    now = datetime.now(timezone.utc)
                    await DownloadJob.find_one(
                        DownloadJob.id == job.id,
                        DownloadJob.status != JobStatus.CANCELLED
                    ).update({
                        "$set": {
                            "status": JobStatus.FAILED,
                            "error_message": clean_err,
                            "progress_text": f"Error: {clean_err}",
                            "updated_at": now,
                        }
                    })
                    update_job_status(
                        job_id_str,
                        status=JobStatus.FAILED.value,
                        progress_text=f"Error: {clean_err}",
                        error_message=clean_err
                    )

        except DownloadCancelled:
            logger.info("Download job %s cancelado durante la ejecución", job_id_str)
            final_status = JobStatus.CANCELLED
            return
        except Exception as e:
            logger.exception("Excepción no controlada en start_download para job %s: %s", job_id_str, e)
            final_status = JobStatus.FAILED
            err_msg = "Error interno"
            now = datetime.now(timezone.utc)
            try:
                await DownloadJob.find_one(
                    DownloadJob.id == job.id,
                    DownloadJob.status != JobStatus.CANCELLED
                ).update({
                    "$set": {
                        "status": JobStatus.FAILED,
                        "error_message": err_msg,
                        "progress_text": f"Error: {err_msg}",
                        "updated_at": now,
                    }
                })
            except Exception:
                logger.exception("No se pudo guardar el estado FAILED tras error interno para job %s", job_id_str)
            update_job_status(
                job_id_str,
                status=JobStatus.FAILED.value,
                progress_text=f"Error: {err_msg}",
                error_message=err_msg
            )
        finally:
            if progress_flush_task and not progress_flush_task.done():
                progress_flush_task.cancel()
                try:
                    await progress_flush_task
                except asyncio.CancelledError:
                    pass

            if final_status != JobStatus.DONE:
                try:
                    shutil.rmtree(temp_dir, ignore_errors=True)
                except Exception:
                    pass

            unregister_job(job_id_str)
