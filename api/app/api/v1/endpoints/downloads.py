import asyncio
import hashlib
import json
from datetime import UTC, datetime, timedelta
from pathlib import Path

from beanie.operators import In
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request
from fastapi.responses import FileResponse
from slowapi import Limiter
from slowapi.util import get_remote_address
from sse_starlette.sse import EventSourceResponse

from app.core.config import settings
from app.core.deps import get_optional_current_user
from app.core.logging import get_logger
from app.core.security import create_download_ticket, verify_download_ticket
from app.models.download_job import DownloadJob, JobStatus
from app.models.guest_download import GuestDownload
from app.models.user import User
from app.schemas.downloads import CreateDownloadRequest, DownloadJobResponse, DownloadTicketResponse
from app.schemas.pagination import PaginatedResponse
from app.services.download_service import DownloadService, fail_if_stale, remove_job_temp_dir
from app.services.format_service import FormatService
from app.services.ytdlp_engine import (
    cancel_job,
    count_active_jobs,
    count_active_jobs_for_user,
    get_job_state,
    get_queue_position,
    register_job,
)

logger = get_logger(__name__)
limiter = Limiter(key_func=get_remote_address)
router = APIRouter(tags=["downloads"])

def get_client_ip(request: Request) -> str:
    cf_ip = request.headers.get("cf-connecting-ip")
    if cf_ip:
        return cf_ip.strip()
    x_forwarded = request.headers.get("x-forwarded-for")
    if x_forwarded:
        return x_forwarded.split(",")[0].strip()
    if request.client and request.client.host:
        return request.client.host.strip()
    return "127.0.0.1"

def hash_client_ip(ip: str) -> str:
    return hashlib.sha256(ip.encode("utf-8")).hexdigest()[:16]

def check_job_access(job: DownloadJob, current_user: User | None, request: Request) -> bool:
    if current_user and job.user_id == str(current_user.id):
        return True
    
    ip = get_client_ip(request)
    ip_hash = hash_client_ip(ip)
    if job.user_id == f"guest_{ip_hash}":
        return True
    return bool(hasattr(job, "ip_hash") and job.ip_hash == ip_hash)

@router.get("/guest-quota")
@router.get("/quota")
async def get_guest_quota(request: Request):
    ip = get_client_ip(request)
    ip_hash = hash_client_ip(ip)
    cutoff = datetime.now(UTC) - timedelta(hours=24)
    count = await GuestDownload.find(
        GuestDownload.ip_hash == ip_hash,
        GuestDownload.created_at >= cutoff
    ).count()
    return {
        "used": count,
        "remaining": max(0, 2 - count),
        "limit": 2
    }

@router.post("", status_code=202, response_model=DownloadJobResponse)
@router.post("/", status_code=202, response_model=DownloadJobResponse)
@limiter.limit("10/minute")
async def create_download(
    request: Request,
    body: CreateDownloadRequest,
    background_tasks: BackgroundTasks,
    current_user: User | None = Depends(get_optional_current_user),
):
    ip = get_client_ip(request)
    ip_hash = hash_client_ip(ip)

    if not current_user:
        cutoff = datetime.now(UTC) - timedelta(hours=24)
        count = await GuestDownload.find(
            GuestDownload.ip_hash == ip_hash,
            GuestDownload.created_at >= cutoff
        ).count()
        if count >= 2:
            raise HTTPException(
                status_code=403,
                detail={
                    "code": "GUEST_LIMIT_REACHED",
                    "message": "Has alcanzado el límite de 2 descargas de prueba gratuitas. Inicia sesión o regístrate para continuar."
                }
            )
        user_id = f"guest_{ip_hash}"
    else:
        user_id = str(current_user.id)

    # Comprobación de límites de cola del servidor y de usuario activo
    if count_active_jobs() >= settings.MAX_QUEUED_JOBS:
        raise HTTPException(
            status_code=503,
            detail={
                "code": "SERVER_BUSY",
                "message": "El servidor está ocupado, inténtalo en unos minutos."
            }
        )

    if count_active_jobs_for_user(user_id) >= settings.MAX_ACTIVE_JOBS_PER_USER:
        raise HTTPException(
            status_code=429,
            detail={
                "code": "TOO_MANY_ACTIVE",
                "message": "Tienes demasiadas descargas en curso. Espera a que terminen algunas."
            }
        )

    is_audio = body.format in ("audioMP3", "audio")
    normalized_format = "audioMP3" if is_audio else "videoMP4"

    if is_audio:
        fmt_string = None
    elif body.selected_format_id:
        fmt_string = FormatService.build_format_string_from_id(body.selected_format_id)
    else:
        fmt_string = FormatService.build_format_string(body.quality, body.codec, body.hdr, body.fps)

    job = DownloadJob(
        user_id=user_id,
        ip_hash=ip_hash if not current_user else None,
        url=str(body.url),
        format=normalized_format,
        quality=body.quality,
        codec=body.codec,
        hdr=body.hdr,
        fps=body.fps,
        selected_format_id=body.selected_format_id,
        format_string=fmt_string,
        status=JobStatus.QUEUED,
        progress_text="En cola",
    )
    await job.insert()

    if not current_user:
        guest_record = GuestDownload(
            ip_hash=ip_hash,
            job_id=str(job.id),
            url=str(body.url),
            created_at=datetime.now(UTC)
        )
        await guest_record.insert()

    register_job(
        job_id=str(job.id),
        user_id=user_id,
        initial_status=JobStatus.QUEUED.value,
        progress_text="En cola",
        title=job.title,
        thumbnail_url=job.thumbnail_url,
    )

    background_tasks.add_task(DownloadService.start_download, job)

    return DownloadJobResponse(
        job_id=str(job.id),
        status=job.status,
        stage=job.stage,
        video_progress=job.video_progress,
        audio_progress=job.audio_progress,
        progress=job.progress,
        progress_text=job.progress_text,
        error_message=job.error_message,
        title=job.title,
        thumbnail_url=job.thumbnail_url,
        file_size=job.file_size,
        file_name=job.file_name,
        created_at=job.created_at,
        expires_at=job.expires_at,
        queue_position=get_queue_position(str(job.id)),
    )

@router.get("", response_model=PaginatedResponse[DownloadJobResponse])
@router.get("/", response_model=PaginatedResponse[DownloadJobResponse])
async def list_downloads(
    request: Request,
    page: int = 1,
    size: int = 20,
    current_user: User | None = Depends(get_optional_current_user)
):
    skip = (page - 1) * size
    if current_user:
        target_user_id = str(current_user.id)
    else:
        ip = get_client_ip(request)
        target_user_id = f"guest_{hash_client_ip(ip)}"

    total = await DownloadJob.find(DownloadJob.user_id == target_user_id).count()
    jobs = await DownloadJob.find(DownloadJob.user_id == target_user_id).skip(skip).limit(size).to_list()
    active_statuses = (JobStatus.QUEUED, JobStatus.RUNNING, JobStatus.MERGING)
    jobs = [await fail_if_stale(job) if job.status in active_statuses else job for job in jobs]
    
    items = [
        DownloadJobResponse(
            job_id=str(job.id),
            status=job.status,
            stage=job.stage,
            video_progress=job.video_progress,
            audio_progress=job.audio_progress,
            progress=job.progress,
            progress_text=job.progress_text,
            error_message=job.error_message,
            title=job.title,
            thumbnail_url=job.thumbnail_url,
            file_size=job.file_size,
            file_name=job.file_name,
            created_at=job.created_at,
            expires_at=job.expires_at,
            queue_position=get_queue_position(str(job.id)) if job.status == JobStatus.QUEUED else None,
        ) for job in jobs
    ]
    pages = (total + size - 1) // size
    return PaginatedResponse(items=items, total=total, page=page, size=size, pages=pages)

@router.get("/{job_id}", response_model=DownloadJobResponse)
async def get_download(
    job_id: str,
    request: Request,
    current_user: User | None = Depends(get_optional_current_user)
):
    job = await DownloadJob.get(job_id)
    if not job or not check_job_access(job, current_user, request):
        raise HTTPException(404, "Not found")
        
    job = await fail_if_stale(job)
        
    return DownloadJobResponse(
        job_id=str(job.id),
        status=job.status,
        stage=job.stage,
        video_progress=job.video_progress,
        audio_progress=job.audio_progress,
        progress=job.progress,
        progress_text=job.progress_text,
        error_message=job.error_message,
        title=job.title,
        thumbnail_url=job.thumbnail_url,
        file_size=job.file_size,
        file_name=job.file_name,
        created_at=job.created_at,
        expires_at=job.expires_at,
        queue_position=get_queue_position(str(job.id)) if job.status == JobStatus.QUEUED else None,
    )

@router.get("/{job_id}/stream")
async def stream_progress(
    job_id: str,
    request: Request,
    ticket: str | None = None,
    current_user: User | None = Depends(get_optional_current_user),
) -> EventSourceResponse:
    if "token" in request.query_params and not ticket:
        logger.warning(f"Deprecated ?token= on file/stream for job {job_id}")

    job = await DownloadJob.get(job_id)
    if not job:
        raise HTTPException(404, "Not found")

    if ticket is not None:
        sub = verify_download_ticket(ticket, str(job.id), "stream")
        if not sub or sub != str(job.user_id):
            raise HTTPException(404, "Not found")
    else:
        if not check_job_access(job, current_user, request):
            raise HTTPException(404, "Not found")

    async def event_generator():
        start_time = asyncio.get_event_loop().time()
        while True:
            if (asyncio.get_event_loop().time() - start_time) > settings.STREAM_MAX_SECONDS:
                yield {"event": "error", "data": "timeout"}
                break

            mem_state = get_job_state(job_id)
            if mem_state is not None:
                status_str = mem_state.status
                queue_pos = get_queue_position(job_id) if status_str == JobStatus.QUEUED.value else None
                yield {
                    "event": "progress",
                    "data": json.dumps({
                        "status": status_str,
                        "stage": mem_state.stage,
                        "video_progress": mem_state.video_progress,
                        "audio_progress": mem_state.audio_progress,
                        "progress": mem_state.progress,
                        "progress_text": mem_state.progress_text,
                        "error_message": mem_state.error_message,
                        "title": mem_state.title,
                        "queue_position": queue_pos,
                    })
                }

                if status_str in (JobStatus.DONE.value, JobStatus.FAILED.value, JobStatus.CANCELLED.value):
                    yield {"event": "done", "data": status_str}
                    break

                await asyncio.sleep(1.0)
            else:
                current_job = await DownloadJob.get(job_id)
                if not current_job:
                    yield {"event": "error", "data": "Not found"}
                    break
                
                current_job = await fail_if_stale(current_job)
                status_val = current_job.status.value if hasattr(current_job.status, "value") else str(current_job.status)
                queue_pos = get_queue_position(job_id) if current_job.status == JobStatus.QUEUED else None
                
                yield {
                    "event": "progress",
                    "data": json.dumps({
                        "status": status_val,
                        "stage": current_job.stage,
                        "video_progress": current_job.video_progress,
                        "audio_progress": current_job.audio_progress,
                        "progress": current_job.progress,
                        "progress_text": current_job.progress_text,
                        "error_message": current_job.error_message,
                        "title": current_job.title,
                        "queue_position": queue_pos,
                    })
                }
                
                if current_job.status in (JobStatus.DONE, JobStatus.FAILED, JobStatus.CANCELLED):
                    yield {"event": "done", "data": status_val}
                    break
                
                await asyncio.sleep(2.0)
    
    return EventSourceResponse(event_generator())

@router.post("/{job_id}/ticket", response_model=DownloadTicketResponse)
async def create_download_ticket_for_job(
    job_id: str,
    request: Request,
    scope: str = "file",
    current_user: User | None = Depends(get_optional_current_user),
):
    if scope not in ("file", "stream"):
        raise HTTPException(400, "Invalid scope")

    job = await DownloadJob.get(job_id)
    if not job or not check_job_access(job, current_user, request) or (current_user and job.user_id != str(current_user.id)):
        raise HTTPException(404, "Not found")

    if not current_user:
        raise HTTPException(400, "Guests do not need a ticket")

    if scope == "file" and job.status != JobStatus.DONE:
        raise HTTPException(400, "Job no terminado")

    ticket = create_download_ticket(job_id=str(job.id), user_id=str(current_user.id), scope=scope)
    return DownloadTicketResponse(
        ticket=ticket,
        expires_in=settings.DOWNLOAD_TICKET_TTL_SECONDS,
    )

@router.get("/{job_id}/file")
async def download_file(
    job_id: str,
    request: Request,
    ticket: str | None = None,
    current_user: User | None = Depends(get_optional_current_user),
):
    if "token" in request.query_params and not ticket:
        logger.warning(f"Deprecated ?token= on file/stream for job {job_id}")

    job = await DownloadJob.get(job_id)
    if not job:
        raise HTTPException(404, "Not found")

    if ticket is not None:
        sub = verify_download_ticket(ticket, str(job.id), "file")
        if not sub or sub != str(job.user_id):
            raise HTTPException(404, "Not found")
    else:
        if not check_job_access(job, current_user, request):
            raise HTTPException(404, "Not found")

    if job.status != JobStatus.DONE:
        raise HTTPException(400, "Job no terminado")
    
    if not job.file_path:
        raise HTTPException(404, "File path missing")

    file_path = Path(job.file_path)
    if not file_path.exists():
        job.status = JobStatus.EXPIRED
        await job.save()
        raise HTTPException(410, "Archivo expirado")
    
    return FileResponse(
        path=file_path,
        filename=job.file_name or file_path.name,
        media_type="application/octet-stream",
    )

@router.delete("/{job_id}", status_code=204)
async def delete_download(
    job_id: str,
    request: Request,
    current_user: User | None = Depends(get_optional_current_user)
):
    job = await DownloadJob.get(job_id)
    if not job or not check_job_access(job, current_user, request):
        raise HTTPException(404, "Not found")

    cancel_job(str(job.id))
    now = datetime.now(UTC)

    active_statuses = [
        JobStatus.PENDING,
        JobStatus.FETCHING,
        JobStatus.QUEUED,
        JobStatus.RUNNING,
        JobStatus.MERGING,
    ]

    res = await DownloadJob.find_one(
        DownloadJob.id == job.id,
        In("status", active_statuses),
    ).update({
        "$set": {
            "status": JobStatus.CANCELLED,
            "updated_at": now,
        }
    })

    if not (res and res.modified_count > 0):
        current_job = await DownloadJob.get(job.id)
        if current_job and current_job.status == JobStatus.DONE:
            await remove_job_temp_dir(str(job.id))
            await DownloadJob.find_one(
                DownloadJob.id == job.id,
                DownloadJob.status == JobStatus.DONE,
            ).update({
                "$set": {
                    "status": JobStatus.CANCELLED,
                    "file_path": "",
                    "updated_at": now,
                }
            })

