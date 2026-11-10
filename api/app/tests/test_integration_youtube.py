"""Tests de integración real con YouTube.

Solo se ejecutan cuando la variable de entorno RUN_NETWORK_TESTS=1.
Requieren ffmpeg instalado y acceso a internet.
"""
import os

import pytest

from app.core.config import settings
from app.services.download_service import _extract_and_download_sync
from app.services.ytdlp_engine import get_job_state, register_job

pytestmark = pytest.mark.network


SKIP_REASON = "RUN_NETWORK_TESTS != 1"
YOUTUBE_SHORT = "https://www.youtube.com/watch?v=jNQXAC9IVRw"


def _should_run() -> bool:
    return os.environ.get("RUN_NETWORK_TESTS", "0") == "1"


@pytest.mark.skipif(not _should_run(), reason=SKIP_REASON)
def test_integration_audio_mp3(tmp_path, monkeypatch):
    """Descarga audio MP3 de un video corto de YouTube y verifica que existe el archivo."""
    monkeypatch.setattr(settings, "TEMP_DIR", str(tmp_path))

    job_id = "integ_audio_01"
    register_job(job_id, "test_user")

    job_dir = tmp_path / job_id
    job_dir.mkdir()

    success, error = _extract_and_download_sync(
        job_id,
        job_dir,
        YOUTUBE_SHORT,
        "audioMP3",
        None,
        ignore_cookies=True,
    )

    assert success is True, f"Error en descarga de audio: {error}"

    mp3_files = list(job_dir.glob("*.mp3"))
    assert len(mp3_files) >= 1, "No se encontró ningún archivo .mp3"
    assert get_job_state(job_id).title == "Me at the zoo"


@pytest.mark.skipif(not _should_run(), reason=SKIP_REASON)
def test_integration_video_mp4(tmp_path, monkeypatch):
    """Descarga video MP4 (360p) de un video corto de YouTube y verifica que existe el archivo."""
    monkeypatch.setattr(settings, "TEMP_DIR", str(tmp_path))

    job_id = "integ_video_01"
    register_job(job_id, "test_user")

    job_dir = tmp_path / job_id
    job_dir.mkdir()

    success, error = _extract_and_download_sync(
        job_id,
        job_dir,
        YOUTUBE_SHORT,
        "videoMP4",
        "bestvideo[height<=360]+bestaudio/best",
        ignore_cookies=True,
    )

    assert success is True, f"Error en descarga de video: {error}"

    mp4_files = list(job_dir.glob("*.mp4"))
    assert len(mp4_files) >= 1, "No se encontró ningún archivo .mp4"
    assert get_job_state(job_id).title == "Me at the zoo"
