from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Request
from fastapi.responses import FileResponse
from sse_starlette.sse import EventSourceResponse
from app.schemas.downloads import CreateDownloadRequest, DownloadJobResponse
from app.models.download_job import DownloadJob, JobStatus
from app.models.user import User
from app.core.deps import get_current_user
from app.services.format_service import FormatService
from app.services.download_service import DownloadService
from app.schemas.pagination import PaginatedResponse
from pathlib import Path
import json
import asyncio
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
router = APIRouter(tags=["downloads"])

@router.post("", status_code=202, response_model=DownloadJobResponse)
@router.post("/", status_code=202, response_model=DownloadJobResponse)
@limiter.limit("10/minute")
async def create_download(
    request: Request,
    body: CreateDownloadRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
):
    is_audio = body.format in ("audioMP3", "audio")
    normalized_format = "audioMP3" if is_audio else "videoMP4"

    if is_audio:
        fmt_string = None
    elif body.selected_format_id:
        fmt_string = FormatService.build_format_string_from_id(body.selected_format_id)
    else:
        fmt_string = FormatService.build_format_string(body.quality, body.codec, body.hdr)

    job = DownloadJob(
        user_id=str(current_user.id),
        url=str(body.url),
        format=normalized_format,
        quality=body.quality,
        codec=body.codec,
        hdr=body.hdr,
        selected_format_id=body.selected_format_id,
        format_string=fmt_string,
    )
    await job.insert()

    background_tasks.add_task(DownloadService.start_download, job)

    return DownloadJobResponse(
        job_id=str(job.id),
        status=job.status,
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
    page: int = 1,
    size: int = 20,
    current_user: User = Depends(get_current_user)
):
    skip = (page - 1) * size
    total = await DownloadJob.find(DownloadJob.user_id == str(current_user.id)).count()
    jobs = await DownloadJob.find(DownloadJob.user_id == str(current_user.id)).skip(skip).limit(size).to_list()
    
    items = [
        DownloadJobResponse(
            job_id=str(job.id),
            status=job.status,
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
async def get_download(job_id: str, current_user: User = Depends(get_current_user)):
    job = await DownloadJob.get(job_id)
    if not job or job.user_id != str(current_user.id):
        raise HTTPException(404, "Not found")
        
    return DownloadJobResponse(
        job_id=str(job.id),
        status=job.status,
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
    current_user: User = Depends(get_current_user),
) -> EventSourceResponse:
    async def event_generator():
        while True:
            job = await DownloadJob.get(job_id)
            if not job or job.user_id != str(current_user.id):
                yield {"event": "error", "data": "Not found"}
                break
            
            yield {
                "event": "progress",
                "data": json.dumps({
                    "status": job.status,
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
async def download_file(job_id: str, current_user: User = Depends(get_current_user)):
    job = await DownloadJob.get(job_id)
    if not job or job.user_id != str(current_user.id):
        raise HTTPException(404)
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
async def delete_download(job_id: str, current_user: User = Depends(get_current_user)):
    job = await DownloadJob.get(job_id)
    if not job or job.user_id != str(current_user.id):
        raise HTTPException(404, "Not found")
    
    # Simple cancel mechanism
    job.status = JobStatus.CANCELLED
    await job.save()
    # In a real app we'd kill the subprocess too
