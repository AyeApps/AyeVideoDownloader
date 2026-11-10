from datetime import datetime

from pydantic import BaseModel, HttpUrl


class FetchFormatsRequest(BaseModel):
    url: HttpUrl

class AvailableFormatResponse(BaseModel):
    id: str
    height: int
    fps: float
    vcodec: str
    filesize: int | None
    dynamic_range: str | None
    height_label: str
    codec_label: str
    is_hdr: bool
    display_label: str
    size_label: str

class FetchFormatsResponse(BaseModel):
    url: str
    title: str | None
    duration: int | None
    thumbnail: str | None
    formats: list[AvailableFormatResponse]

class BuildFormatStringRequest(BaseModel):
    quality: str = "best"
    codec: str = "any"
    hdr: str = "any"
    fps: str = "any"

class BuildFormatStringResponse(BaseModel):
    format_string: str

class CreateDownloadRequest(BaseModel):
    url: HttpUrl
    format: str = "videoMP4"
    quality: str = "best"
    codec: str = "any"
    hdr: str = "any"
    fps: str = "any"
    selected_format_id: str | None = None

class DownloadJobResponse(BaseModel):
    job_id: str
    status: str
    stage: str | None = "video"
    video_progress: float | None = 0.0
    audio_progress: float | None = 0.0
    progress: float
    progress_text: str
    error_message: str | None = None
    title: str | None
    thumbnail_url: str | None
    file_size: int | None
    file_name: str | None
    created_at: datetime
    expires_at: datetime | None
    queue_position: int | None = None

class DownloadTicketResponse(BaseModel):
    ticket: str
    expires_in: int
