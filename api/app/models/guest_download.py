from datetime import UTC, datetime

from beanie import Document, Indexed
from pydantic import Field


class GuestDownload(Document):
    ip_hash: Indexed(str)
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    job_id: str | None = None
    url: str | None = None

    class Settings:
        name = "guest_downloads"
        indexes = ["ip_hash", "created_at", [("created_at", -1)]]  # noqa: RUF012 — configuración de índices de Beanie, no campo del documento
