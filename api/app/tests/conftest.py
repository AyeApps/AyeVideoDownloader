import pytest

import app.services.ytdlp_engine as engine


@pytest.fixture(autouse=True)
def reset_engine_state():
    """Limpia el estado global de ytdlp_engine antes y después de cada test."""
    engine._active_jobs.clear()
    engine._info_cache.clear()
    engine._arrival_counter = 0
    yield
    engine._active_jobs.clear()
    engine._info_cache.clear()
    engine._arrival_counter = 0


@pytest.fixture
def temp_dir(tmp_path, monkeypatch):
    """Apunta settings.TEMP_DIR a tmp_path para tests de limpieza de archivos."""
    from app.core.config import settings
    monkeypatch.setattr(settings, "TEMP_DIR", str(tmp_path))
    return tmp_path
