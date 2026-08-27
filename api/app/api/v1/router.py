from fastapi import APIRouter
from app.api.v1.endpoints import auth, formats, downloads

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(formats.router)
api_router.include_router(downloads.router, prefix="/downloads")
api_router.include_router(downloads.router, prefix="/download")
