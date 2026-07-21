from beanie import Document, Indexed
from datetime import datetime, UTC
from enum import Enum
from pydantic import Field
from typing import Optional

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
    url: str
    format: str

    quality: str = "best"
    codec: str = "any"
    hdr: str = "any"

    selected_format_id: Optional[str] = None
    format_string: Optional[str] = None

    status: JobStatus = JobStatus.PENDING
    progress: float = 0.0
    progress_text: str = ""
    title: Optional[str] = None
    thumbnail_url: Optional[str] = None
    file_path: Optional[str] = None
    file_name: Optional[str] = None
    file_size: Optional[int] = None
    error_message: Optional[str] = None

    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    expires_at: Optional[datetime] = None

    class Settings:
        name = "download_jobs"
        indexes = ["user_id", "status", "created_at", [("expires_at", 1)]]
