import asyncio
import copy
import time
from collections import OrderedDict
from dataclasses import dataclass
from typing import Any

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)

# ==============================================================================
# 1. Semáforos asyncio de extracción y descarga
# ==============================================================================
_extraction_semaphore: asyncio.Semaphore | None = None
_download_semaphore: asyncio.Semaphore | None = None


def get_extraction_semaphore() -> asyncio.Semaphore:
    global _extraction_semaphore
    if _extraction_semaphore is None:
        _extraction_semaphore = asyncio.Semaphore(settings.MAX_CONCURRENT_EXTRACTIONS)
    return _extraction_semaphore


def get_download_semaphore() -> asyncio.Semaphore:
    global _download_semaphore
    if _download_semaphore is None:
        _download_semaphore = asyncio.Semaphore(settings.MAX_CONCURRENT_DOWNLOADS)
    return _download_semaphore


# ==============================================================================
# 2. Caché en memoria de información de videos (URL -> sanitized_info)
# ==============================================================================
# OrderedDict mantiene orden de inserción; al superar INFO_CACHE_MAX_ITEMS se expulsa la más antigua.
_info_cache: OrderedDict[str, dict[str, Any]] = OrderedDict()


def get_cached_info(url: str) -> dict[str, Any] | None:
    """
    Obtiene una copia profunda de la información saneada en caché si existe y no ha expirado.
    """
    if url in _info_cache:
        entry = _info_cache[url]
        if time.time() > entry["expires_at"]:
            _info_cache.pop(url, None)
            return None
        return copy.deepcopy(entry["info"])
    return None


def set_cached_info(url: str, sanitized_info: dict[str, Any]) -> None:
    """
    Guarda la información (ya saneada con YoutubeDL.sanitize_info) en la caché en memoria.
    Si se supera INFO_CACHE_MAX_ITEMS, expulsa la entrada más antigua.
    """
    if url in _info_cache:
        _info_cache.pop(url, None)
    while len(_info_cache) >= settings.INFO_CACHE_MAX_ITEMS:
        _info_cache.popitem(last=False)

    _info_cache[url] = {
        "info": copy.deepcopy(sanitized_info),
        "expires_at": time.time() + settings.INFO_CACHE_TTL_SECONDS,
    }


def invalidate_cached_info(url: str) -> None:
    """
    Invalida y elimina una URL de la caché en memoria (por ejemplo, si expira o falla).
    """
    _info_cache.pop(url, None)


# ==============================================================================
# 3. Registro de trabajos activos del proceso
# ==============================================================================
@dataclass
class ActiveJobState:
    job_id: str
    user_id: str
    status: str = "queued"
    stage: str = "video"
    video_progress: float = 0.0
    audio_progress: float = 0.0
    progress: float = 0.0
    progress_text: str = "En cola"
    title: str | None = None
    thumbnail_url: str | None = None
    error_message: str | None = None
    is_cancelled: bool = False
    arrival_order: int = 0
    created_at: float = 0.0


_active_jobs: dict[str, ActiveJobState] = {}
_arrival_counter: int = 0


def register_job(
    job_id: str,
    user_id: str,
    initial_status: str = "queued",
    progress_text: str = "En cola",
    title: str | None = None,
    thumbnail_url: str | None = None,
) -> ActiveJobState:
    """
    Registra un trabajo activo en el registro en memoria con su orden de llegada.
    """
    global _arrival_counter
    _arrival_counter += 1
    state = ActiveJobState(
        job_id=job_id,
        user_id=user_id,
        status=initial_status,
        progress_text=progress_text,
        title=title,
        thumbnail_url=thumbnail_url,
        arrival_order=_arrival_counter,
        created_at=time.time(),
    )
    _active_jobs[job_id] = state
    return state


def unregister_job(job_id: str) -> None:
    """
    Elimina un trabajo del registro en memoria al finalizar o cancelarse.
    """
    _active_jobs.pop(job_id, None)


def cancel_job(job_id: str) -> bool:
    """
    Activa el indicador de cancelación para un trabajo en el registro.
    """
    state = _active_jobs.get(job_id)
    if state:
        state.is_cancelled = True
        state.status = "cancelled"
        state.progress_text = "Cancelado"
        return True
    return False


def is_job_cancelled(job_id: str) -> bool:
    """
    Verifica si el trabajo tiene activo el indicador de cancelación en memoria.
    """
    state = _active_jobs.get(job_id)
    return state.is_cancelled if state else False


def get_job_state(job_id: str) -> ActiveJobState | None:
    """
    Obtiene el estado en memoria de un trabajo registrado.
    """
    return _active_jobs.get(job_id)


def update_job_progress(
    job_id: str,
    stage: str,
    video_progress: float,
    audio_progress: float,
    progress: float,
    progress_text: str,
) -> None:
    """
    Actualiza el progreso en memoria desde los hooks de descarga (hilo de yt-dlp).
    """
    state = _active_jobs.get(job_id)
    if state and not state.is_cancelled:
        state.stage = stage
        state.video_progress = video_progress
        state.audio_progress = audio_progress
        state.progress = progress
        state.progress_text = progress_text


def update_job_merging(
    job_id: str,
    status: str,
    stage: str,
    video_progress: float,
    audio_progress: float,
    progress: float,
    progress_text: str,
) -> None:
    """
    Actualiza la etapa a merging en memoria cuando inician los postprocesadores.
    """
    state = _active_jobs.get(job_id)
    if state and not state.is_cancelled:
        state.status = status
        state.stage = stage
        state.video_progress = video_progress
        state.audio_progress = audio_progress
        state.progress = progress
        state.progress_text = progress_text


def update_job_status(
    job_id: str,
    status: str,
    progress_text: str | None = None,
    error_message: str | None = None,
) -> None:
    """
    Actualiza el status y mensajes de un trabajo en memoria.
    """
    state = _active_jobs.get(job_id)
    if state and not state.is_cancelled:
        state.status = status
        if progress_text is not None:
            state.progress_text = progress_text
        if error_message is not None:
            state.error_message = error_message


def update_job_metadata(
    job_id: str,
    title: str | None = None,
    thumbnail_url: str | None = None,
) -> None:
    """
    Actualiza título y miniatura en el registro cuando se obtienen.
    """
    state = _active_jobs.get(job_id)
    if state:
        if title:
            state.title = title
        if thumbnail_url:
            state.thumbnail_url = thumbnail_url


def update_job_done(job_id: str) -> None:
    """
    Marca el trabajo como completado en memoria.
    """
    state = _active_jobs.get(job_id)
    if state and not state.is_cancelled:
        state.status = "done"
        state.stage = "done"
        state.video_progress = 1.0
        state.audio_progress = 1.0
        state.progress = 1.0
        state.progress_text = "Completado"


def get_queue_position(job_id: str) -> int | None:
    """
    Retorna cuántos trabajos activos van por delante del trabajo en cola.
    Cuenta los trabajos registrados que no están cancelados, que llegaron antes
    y siguen activos ('queued', 'running' o 'merging').
    Retorna None si el trabajo no está en el registro o su estado no es 'queued'.
    """
    target = _active_jobs.get(job_id)
    if not target or target.status != "queued":
        return None

    active_statuses = {"queued", "running", "merging"}
    return sum(
        1
        for j in _active_jobs.values()
        if not j.is_cancelled
        and j.status in active_statuses
        and j.arrival_order < target.arrival_order
    )


def count_active_jobs() -> int:
    """
    Cuenta todos los trabajos activos registrados en este proceso.
    """
    return len(_active_jobs)


def count_active_jobs_for_user(user_id: str) -> int:
    """
    Cuenta los trabajos activos registrados para un usuario o invitado específico.
    """
    return sum(1 for j in _active_jobs.values() if j.user_id == user_id)
