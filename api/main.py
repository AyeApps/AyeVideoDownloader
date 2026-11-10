import asyncio
from contextlib import asynccontextmanager

from beanie.operators import In
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from slowapi.util import get_remote_address

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.logging import get_logger
from app.db.mongodb import init_db
from app.models.download_job import DownloadJob, JobStatus
from app.services.download_service import cleanup_loop, fail_if_stale

logger = get_logger(__name__)

limiter = Limiter(key_func=get_remote_address)

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing database connection...")
    await init_db()
    logger.info("Database connection initialized.")
    try:
        active_jobs = await DownloadJob.find(
            In("status", [JobStatus.QUEUED, JobStatus.RUNNING, JobStatus.MERGING])
        ).to_list()
        for job in active_jobs:
            await fail_if_stale(job)
    except Exception:
        logger.exception("Error durante el barrido de trabajos huérfanos al iniciar")

    cleanup_task = asyncio.create_task(cleanup_loop())
    try:
        yield
    finally:
        cleanup_task.cancel()
        try:
            await cleanup_task
        except asyncio.CancelledError:
            pass

    logger.info("Closing database connection...")

app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS if isinstance(settings.CORS_ORIGINS, list) else [settings.CORS_ORIGINS],
    allow_origin_regex=r"^https://.*\.ayeapps\.com$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")
app.include_router(api_router, prefix="/api")

@app.get("/", tags=["health"])
async def root():
    return {"status": "ok", "app": settings.APP_NAME, "env": settings.APP_ENV}

@app.get("/robots.txt", response_class=PlainTextResponse, tags=["seo"])
async def robots():
    return "User-agent: *\nDisallow: /\n"

@app.get("/health", tags=["health"])
async def health_check():
    return {"status": "ok", "env": settings.APP_ENV}
