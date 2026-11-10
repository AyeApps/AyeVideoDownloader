from datetime import UTC, datetime, timedelta
from typing import Any

from jose import jwt
from passlib.context import CryptContext

from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
ALGORITHM = "HS256"

def create_access_token(subject: str | Any, expires_delta: timedelta | None = None) -> str:
    if expires_delta:
        expire = datetime.now(UTC) + expires_delta
    else:
        expire = datetime.now(UTC) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def create_refresh_token(subject: str | Any, expires_delta: timedelta | None = None) -> str:
    if expires_delta:
        expire = datetime.now(UTC) + expires_delta
    else:
        expire = datetime.now(UTC) + timedelta(minutes=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def create_download_ticket(job_id: str, user_id: str, scope: str) -> str:
    now = datetime.now(UTC)
    expire = now + timedelta(seconds=settings.DOWNLOAD_TICKET_TTL_SECONDS)
    to_encode = {
        "sub": str(user_id),
        "job_id": str(job_id),
        "scope": scope,
        "type": "download_ticket",
        "aud": "aye-video-downloader",
        "iat": now,
        "exp": expire,
    }
    return jwt.encode(
        to_encode,
        settings.JWT_SECRET_KEY + ":download-ticket",
        algorithm=ALGORITHM,
    )

def verify_download_ticket(ticket: str, job_id: str, scope: str) -> str | None:
    if not ticket or not isinstance(ticket, str):
        return None
    try:
        payload = jwt.decode(
            ticket,
            settings.JWT_SECRET_KEY + ":download-ticket",
            algorithms=[ALGORITHM],
            audience="aye-video-downloader",
        )
        if payload.get("type") != "download_ticket":
            return None
        if str(payload.get("job_id")) != str(job_id):
            return None
        if payload.get("scope") != scope:
            return None
        sub = payload.get("sub")
        if not sub:
            return None
        return str(sub)
    except Exception:  # noqa: BLE001 — jose lanza tipos variados (ExpiredSignatureError, JWTError, etc.); cualquier fallo retorna None
        return None

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)
