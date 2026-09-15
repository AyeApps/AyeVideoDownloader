import base64
import os
import logging
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.core.config import settings
from app.models.user import User
from app.models.download_job import DownloadJob
from app.models.revoked_token import RevokedToken
from app.models.guest_download import GuestDownload

logger = logging.getLogger(__name__)

async def init_db():
    cert_path = settings.MONGODB_CERT_PATH
    if settings.MONGODB_CERT_B64 and settings.MONGODB_CERT_B64.strip():
        temp_cert = "/tmp/aye_video_cert.pem"
        try:
            cert_bytes = base64.b64decode(settings.MONGODB_CERT_B64.strip())
            with open(temp_cert, "wb") as f:
                f.write(cert_bytes)
            cert_path = temp_cert
            logger.info("Decoded X.509 certificate from MONGODB_CERT_B64 successfully.")
        except Exception as e:
            logger.error(f"Error decoding MONGODB_CERT_B64: {e}")

    client_kwargs = {
        "serverSelectionTimeoutMS": 5000,
    }

    if cert_path and os.path.exists(cert_path):
        client_kwargs["tls"] = True
        client_kwargs["tlsCertificateKeyFile"] = cert_path
        client_kwargs["authMechanism"] = "MONGODB-X509"
        client_kwargs["authSource"] = "$external"
        logger.info(f"Connecting to MongoDB with X.509 Certificate ({cert_path})...")

    client = AsyncIOMotorClient(settings.MONGODB_URL, **client_kwargs)
    database = client[settings.DATABASE_NAME]
    await init_beanie(database, document_models=[User, DownloadJob, RevokedToken, GuestDownload])

