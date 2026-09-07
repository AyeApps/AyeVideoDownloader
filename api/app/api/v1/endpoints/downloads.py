from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Request
from fastapi.responses import FileResponse
from sse_starlette.sse import EventSourceResponse
from app.schemas.downloads import CreateDownloadRequest, DownloadJobResponse
from app.models.download_job import DownloadJob, JobStatus
from app.models.guest_download import GuestDownload
from app.models.user import User
from app.core.deps import get_optional_current_user
from app.services.format_service import FormatService
from app.services.download_service import DownloadService
from app.schemas.pagination import PaginatedResponse
from pathlib import Path
from typing import Optional
from datetime import datetime, timezone, timedelta
import hashlib
import json
import asyncio
from slowapi import Limiter
from slowapi.util import get_remote_address

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

def check_job_access(job: DownloadJob, current_user: Optional[User], request: Request) -> bool:
    if current_user and job.user_id == str(current_user.id):
        return True
    
    ip = get_client_ip(request)
    ip_hash = hash_client_ip(ip)
    if job.user_id == f"guest_{ip_hash}":
        return True
    if hasattr(job, "ip_hash") and job.ip_hash == ip_hash:
        return True
        
    return False

@router.get("/guest-quota")
@router.get("/quota")
async def get_guest_quota(request: Request):
    ip = get_client_ip(request)
    ip_hash = hash_client_ip(ip)
    cutoff = datetime.now(timezone.utc) - timedelta(hours=24)
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
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    ip = get_client_ip(request)
    ip_hash = hash_client_ip(ip)

    if not current_user:
        cutoff = datetime.now(timezone.utc) - timedelta(hours=24)
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
    )
    await job.insert()

    if not current_user:
        guest_record = GuestDownload(
            ip_hash=ip_hash,
            job_id=str(job.id),
            url=str(body.url),
            created_at=datetime.now(timezone.utc)
        )
        await guest_record.insert()

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
    )

@router.get("", response_model=PaginatedResponse[DownloadJobResponse])
@router.get("/", response_model=PaginatedResponse[DownloadJobResponse])
async def list_downloads(
    request: Request,
    page: int = 1,
    size: int = 20,
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    skip = (page - 1) * size
    if current_user:
        target_user_id = str(current_user.id)
    else:
        ip = get_client_ip(request)
        target_user_id = f"guest_{hash_client_ip(ip)}"

    total = await DownloadJob.find(DownloadJob.user_id == target_user_id).count()
    jobs = await DownloadJob.find(DownloadJob.user_id == target_user_id).skip(skip).limit(size).to_list()
    
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
        ) for job in jobs
    ]
    pages = (total + size - 1) // size
    return PaginatedResponse(items=items, total=total, page=page, size=size, pages=pages)

@router.get("/{job_id}", response_model=DownloadJobResponse)
async def get_download(
    job_id: str,
    request: Request,
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    job = await DownloadJob.get(job_id)
    if not job or not check_job_access(job, current_user, request):
        raise HTTPException(404, "Not found")
        
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
    )

@router.get("/{job_id}/stream")
async def stream_progress(
    job_id: str,
    request: Request,
    current_user: Optional[User] = Depends(get_optional_current_user),
) -> EventSourceResponse:
    async def event_generator():
        while True:
            job = await DownloadJob.get(job_id)
            if not job or not check_job_access(job, current_user, request):
                yield {"event": "error", "data": "Not found"}
                break
            
            yield {
                "event": "progress",
                "data": json.dumps({
                    "status": job.status,
                    "stage": job.stage,
                    "video_progress": job.video_progress,
                    "audio_progress": job.audio_progress,
                    "progress": job.progress,
                    "progress_text": job.progress_text,
                    "error_message": job.error_message,
                    "title": job.title,
                })
            }
            
            if job.status in (JobStatus.DONE, JobStatus.FAILED, JobStatus.CANCELLED):
                yield {"event": "done", "data": job.status.value}
                break
            
            await asyncio.sleep(0.5)
    
    return EventSourceResponse(event_generator())

@router.get("/{job_id}/file")
async def download_file(
    job_id: str,
    request: Request,
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    job = await DownloadJob.get(job_id)
    if not job or not check_job_access(job, current_user, request):
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
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    job = await DownloadJob.get(job_id)
    if not job or not check_job_access(job, current_user, request):
        raise HTTPException(404, "Not found")
    
    job.status = JobStatus.CANCELLED
    await job.save()

