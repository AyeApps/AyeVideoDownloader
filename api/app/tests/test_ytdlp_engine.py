"""Tests para app.services.ytdlp_engine."""
import time

import app.services.ytdlp_engine as engine
from app.core.config import settings
from app.services.ytdlp_engine import (
    cancel_job,
    count_active_jobs,
    count_active_jobs_for_user,
    get_cached_info,
    get_job_state,
    get_queue_position,
    register_job,
    set_cached_info,
    update_job_status,
)

# ---------------------------------------------------------------------------
# Posición en cola
# ---------------------------------------------------------------------------

def test_queue_position_third_job_has_two_ahead():
    """Tres jobs registrados: el tercero debe tener 2 por delante."""
    register_job("j1", "u1")
    register_job("j2", "u1")
    register_job("j3", "u1")
    assert get_queue_position("j3") == 2


def test_queue_position_cancel_decrements():
    """Cancelar uno de los que va adelante reduce la posición en 1."""
    register_job("j1", "u1")
    register_job("j2", "u1")
    register_job("j3", "u1")
    cancel_job("j1")
    assert get_queue_position("j3") == 1


def test_queue_position_non_queued_returns_none():
    """Un job con status != 'queued' devuelve None."""
    register_job("j1", "u1", initial_status="running")
    assert get_queue_position("j1") is None


def test_queue_position_nonexistent_returns_none():
    """Un job que no existe devuelve None."""
    assert get_queue_position("no_existe") is None


# ---------------------------------------------------------------------------
# cancel_job no revierte por update_job_status
# ---------------------------------------------------------------------------

def test_cancel_marks_cancelled():
    """cancel_job debe marcar is_cancelled=True y status='cancelled'."""
    register_job("j1", "u1")
    result = cancel_job("j1")
    assert result is True
    state = get_job_state("j1")
    assert state.is_cancelled is True
    assert state.status == "cancelled"


def test_update_job_status_does_not_revert_cancelled():
    """update_job_status no debe revertir un job ya cancelado."""
    register_job("j1", "u1")
    cancel_job("j1")
    update_job_status("j1", "running", progress_text="corriendo")
    state = get_job_state("j1")
    assert state.status == "cancelled"
    assert state.progress_text == "Cancelado"


# ---------------------------------------------------------------------------
# Conteos por usuario
# ---------------------------------------------------------------------------

def test_count_active_jobs_for_user():
    """Debe contar correctamente los jobs por user_id."""
    register_job("j1", "u1")
    register_job("j2", "u1")
    register_job("j3", "u2")
    assert count_active_jobs_for_user("u1") == 2
    assert count_active_jobs_for_user("u2") == 1
    assert count_active_jobs_for_user("u3") == 0


def test_count_active_jobs():
    """count_active_jobs debe contar el total de jobs en memoria."""
    register_job("j1", "u1")
    register_job("j2", "u2")
    assert count_active_jobs() == 2


# ---------------------------------------------------------------------------
# Caché: expulsión del más antiguo, expiración por TTL, copia profunda
# ---------------------------------------------------------------------------

def test_cache_evicts_oldest_when_full(monkeypatch):
    """Al superar INFO_CACHE_MAX_ITEMS, debe expulsarse el más antiguo."""
    monkeypatch.setattr(settings, "INFO_CACHE_MAX_ITEMS", 3)
    monkeypatch.setattr(settings, "INFO_CACHE_TTL_SECONDS", 600)

    for i in range(3):
        set_cached_info(f"url{i}", {"title": f"video{i}"})

    # Insertar uno más: debe expulsar url0
    set_cached_info("url3", {"title": "video3"})

    assert get_cached_info("url0") is None
    assert get_cached_info("url3") is not None


def test_cache_expires_by_ttl(monkeypatch):
    """Una entrada expirada debe devolver None."""
    monkeypatch.setattr(settings, "INFO_CACHE_MAX_ITEMS", 8)
    monkeypatch.setattr(settings, "INFO_CACHE_TTL_SECONDS", 600)

    set_cached_info("url_ttl", {"title": "expire_me"})

    # Capturar el tiempo real ANTES del patch para evitar recursión
    real_now = time.time()
    monkeypatch.setattr(engine.time, "time", lambda: real_now + 700)

    assert get_cached_info("url_ttl") is None


def test_cache_returns_deep_copy(monkeypatch):
    """La copia devuelta por get_cached_info no debe afectar la caché al modificarse."""
    monkeypatch.setattr(settings, "INFO_CACHE_MAX_ITEMS", 8)
    monkeypatch.setattr(settings, "INFO_CACHE_TTL_SECONDS", 600)

    original = {"title": "original", "nested": {"key": "value"}}
    set_cached_info("url_copy", original)

    copy1 = get_cached_info("url_copy")
    copy1["title"] = "MODIFIED"
    copy1["nested"]["key"] = "MODIFIED"

    copy2 = get_cached_info("url_copy")
    assert copy2["title"] == "original"
    assert copy2["nested"]["key"] == "value"
