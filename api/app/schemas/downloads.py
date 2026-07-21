from pydantic import BaseModel, HttpUrl
from typing import Literal, Optional, List
from datetime import datetime

class FetchFormatsRequest(BaseModel):
    url: HttpUrl

class AvailableFormatResponse(BaseModel):
    id: str
    height: int
    fps: float
    vcodec: str
    filesize: Optional[int]
    dynamic_range: Optional[str]
    height_label: str
    codec_label: str
    is_hdr: bool
    display_label: str
    size_label: str

class FetchFormatsResponse(BaseModel):
    url: str
    title: Optional[str]
    duration: Optional[int]
    thumbnail: Optional[str]
    formats: List[AvailableFormatResponse]

class BuildFormatStringRequest(BaseModel):
    quality: str = "best"
    codec: str = "any"
    hdr: str = "any"

class BuildFormatStringResponse(BaseModel):
    format_string: str

class CreateDownloadRequest(BaseModel):
    url: HttpUrl
    format: Literal["videoMP4", "audioMP3"] = "videoMP4"
    quality: Literal["best","2160","1440","1080","720","480","360"] = "best"
    codec: Literal["any","h264","h265","vp9","av1"] = "any"
    hdr: Literal["any","sdr","hdr"] = "any"
    selected_format_id: Optional[str] = None

class DownloadJobResponse(BaseModel):
    job_id: str
    status: str
    progress: float
    progress_text: str
    title: Optional[str]
    thumbnail_url: Optional[str]
    file_size: Optional[int]
    file_name: Optional[str]
    created_at: datetime
    expires_at: Optional[datetime]
