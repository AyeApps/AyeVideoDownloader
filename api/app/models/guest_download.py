from beanie import Document, Indexed
from datetime import datetime, timezone
from pydantic import Field
from typing import Optional

class GuestDownload(Document):
    ip_hash: Indexed(str)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    job_id: Optional[str] = None
    url: Optional[str] = None

    class Settings:
        name = "guest_downloads"
        indexes = ["ip_hash", "created_at", [("created_at", -1)]]
