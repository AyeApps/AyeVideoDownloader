"""Tests para create_download_ticket / verify_download_ticket en app.core.security."""
from datetime import UTC, datetime, timedelta

from jose import jwt

from app.core.config import settings
from app.core.security import create_download_ticket, verify_download_ticket

JOB_ID = "job_12345"
USER_ID = "user_abc"
SCOPE = "download"


def test_valid_ticket_returns_user_id():
    """Un ticket válido debe devolver el user_id correcto."""
    ticket = create_download_ticket(JOB_ID, USER_ID, SCOPE)
    result = verify_download_ticket(ticket, JOB_ID, SCOPE)
    assert result == USER_ID


def test_wrong_job_id_fails():
    """Un ticket con job_id distinto debe devolver None."""
    ticket = create_download_ticket(JOB_ID, USER_ID, SCOPE)
    result = verify_download_ticket(ticket, "other_job", SCOPE)
    assert result is None


def test_wrong_scope_fails():
    """Un ticket con scope distinto debe devolver None."""
    ticket = create_download_ticket(JOB_ID, USER_ID, SCOPE)
    result = verify_download_ticket(ticket, JOB_ID, "stream")
    assert result is None


def test_tampered_ticket_fails():
    """Un ticket con un carácter modificado debe devolver None."""
    ticket = create_download_ticket(JOB_ID, USER_ID, SCOPE)
    tampered = ticket[:-4] + "XXXX"
    result = verify_download_ticket(tampered, JOB_ID, SCOPE)
    assert result is None


def test_normal_jwt_without_ticket_suffix_fails():
    """Un JWT normal firmado con JWT_SECRET_KEY (sin sufijo) debe devolver None."""
    now = datetime.now(UTC)
    to_encode = {
        "sub": USER_ID,
        "job_id": JOB_ID,
        "scope": SCOPE,
        "type": "download_ticket",
        "aud": "aye-video-downloader",
        "iat": now,
        "exp": now + timedelta(seconds=120),
    }
    # Firmado con la clave BASE (sin el sufijo ':download-ticket')
    fake_ticket = jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm="HS256")
    result = verify_download_ticket(fake_ticket, JOB_ID, SCOPE)
    assert result is None
