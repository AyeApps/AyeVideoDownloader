from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.core.config import settings
from app.models.user import User
from app.models.download_job import DownloadJob
from app.models.revoked_token import RevokedToken

async def init_db():
    client = AsyncIOMotorClient(settings.mongodb_url)
    database = client[settings.database_name]
    await init_beanie(database, document_models=[User, DownloadJob, RevokedToken])
