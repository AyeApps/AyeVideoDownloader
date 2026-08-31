import logging
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.core.config import settings
from app.models.user import User
from app.models.download_job import DownloadJob
from app.models.revoked_token import RevokedToken

logger = logging.getLogger(__name__)

async def init_db():
    try:
        client = AsyncIOMotorClient(settings.mongodb_url, serverSelectionTimeoutMS=5000)
        database = client[settings.database_name]
        await init_beanie(database, document_models=[User, DownloadJob, RevokedToken])
        logger.info("MongoDB and Beanie initialized successfully.")
    except Exception as exc:
        logger.error(f"MongoDB connection failed: {exc}. Service will run in stateless mode.")
