from datetime import UTC, datetime
from enum import Enum

from beanie import Document, Indexed
from pydantic import Field


class JobStatus(str, Enum):
    PENDING   = "pending"
    FETCHING  = "fetching"
    QUEUED    = "queued"
    RUNNING   = "running"
    MERGING   = "merging"
    DONE      = "done"
    FAILED    = "failed"
    CANCELLED = "cancelled"
    EXPIRED   = "expired"

class DownloadJob(Document):
    user_id: Indexed(str)
    ip_hash: str | None = None
    url: str
    format: str

    quality: str = "best"
    codec: str = "any"
    hdr: str = "any"
    fps: str = "any"

    selected_format_id: str | None = None
    format_string: str | None = None

    status: JobStatus = JobStatus.PENDING
    stage: str = "video"
    video_progress: float = 0.0
    audio_progress: float = 0.0
    progress: float = 0.0
    progress_text: str = ""
    title: str | None = None
    thumbnail_url: str | None = None
    file_path: str | None = None
    file_name: str | None = None
    file_size: int | None = None
    error_message: str | None = None

    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    started_at: datetime | None = None
    updated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    expires_at: datetime | None = None

    class Settings:
        name = "download_jobs"
        indexes = ["user_id", "status", "created_at", [("expires_at", 1)]]  # noqa: RUF012 — configuración de índices de Beanie, no campo del documento
