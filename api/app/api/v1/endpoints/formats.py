from fastapi import APIRouter, Depends, HTTPException, Request
from app.schemas.downloads import FetchFormatsRequest, FetchFormatsResponse, BuildFormatStringResponse
from app.services.format_service import FormatService
from app.core.deps import get_current_user
from app.models.user import User
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
router = APIRouter(prefix="/formats", tags=["formats"])

@router.post("", response_model=FetchFormatsResponse)
@router.post("/fetch", response_model=FetchFormatsResponse)
@limiter.limit("20/minute")
async def fetch_formats(
    request: Request,
    body: FetchFormatsRequest,
    current_user: User = Depends(get_current_user),
) -> FetchFormatsResponse:
    try:
        return await FormatService.fetch_formats(str(body.url))
    except ValueError as e:
        msg = str(e)
        if "429" in msg or "Too Many Requests" in msg:
            msg = "YouTube ha bloqueado o limitado temporalmente la IP del servidor (HTTP 429). Se ha intentado usar clientes alternativos (iOS/Mobile). Si persiste, configura un archivo de cookies o un proxy."
        raise HTTPException(status_code=422, detail=msg)


@router.get("/build-string", response_model=BuildFormatStringResponse)
async def build_format_string(
    quality: str = "best",
    codec: str = "any",
    hdr: str = "any",
    current_user: User = Depends(get_current_user),
) -> BuildFormatStringResponse:
    return BuildFormatStringResponse(
        format_string=FormatService.build_format_string(quality, codec, hdr)
    )
