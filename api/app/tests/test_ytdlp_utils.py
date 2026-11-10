"""Tests para app.services.ytdlp_utils."""
import yt_dlp

from app.core.config import settings
from app.services.ytdlp_utils import YTDLPLogger, build_ytdlp_options, clean_ytdlp_error

# ---------------------------------------------------------------------------
# js_runtimes
# ---------------------------------------------------------------------------

def test_js_runtimes_comma_separated(monkeypatch):
    """'node,deno' produce dos entradas en js_runtimes, ambas con path None."""
    monkeypatch.setattr(settings, "YTDLP_JS_RUNTIMES", "node,deno")
    opts = build_ytdlp_options(ignore_cookies=True)
    rts = opts.get("js_runtimes", {})
    assert isinstance(rts, dict), "js_runtimes debe ser dict"
    assert set(rts.keys()) == {"node", "deno"}
    assert rts["node"] == {"path": None}
    assert rts["deno"] == {"path": None}


def test_js_runtimes_with_path(monkeypatch):
    """'Deno:/usr/local/bin/deno' produce clave en minúsculas con ruta correcta."""
    monkeypatch.setattr(settings, "YTDLP_JS_RUNTIMES", "Deno:/usr/local/bin/deno")
    opts = build_ytdlp_options(ignore_cookies=True)
    rts = opts.get("js_runtimes", {})
    assert isinstance(rts, dict)
    assert "deno" in rts
    assert rts["deno"] == {"path": "/usr/local/bin/deno"}


def test_js_runtimes_empty(monkeypatch):
    """Si YTDLP_JS_RUNTIMES está vacío no debe aparecer js_runtimes."""
    monkeypatch.setattr(settings, "YTDLP_JS_RUNTIMES", "")
    opts = build_ytdlp_options(ignore_cookies=True)
    assert "js_runtimes" not in opts


# ---------------------------------------------------------------------------
# YoutubeDL acepta las opciones sin lanzar excepción (sin red)
# ---------------------------------------------------------------------------

def test_ytdlp_options_accepted_by_youtubedl(monkeypatch):
    """YoutubeDL debe construirse sin excepción con las opciones de build_ytdlp_options."""
    monkeypatch.setattr(settings, "YTDLP_JS_RUNTIMES", "node,deno")
    monkeypatch.setattr(settings, "YTDLP_PROXY", "")
    monkeypatch.setattr(settings, "YTDLP_PLAYER_CLIENT", "default")
    opts = build_ytdlp_options(ignore_cookies=True, ytdlp_logger=YTDLPLogger())
    with yt_dlp.YoutubeDL(opts):
        pass  # Solo verificamos que no se lanza excepción


# ---------------------------------------------------------------------------
# ignore_cookies
# ---------------------------------------------------------------------------

def test_no_cookiefile_when_ignore_cookies(monkeypatch):
    """Con ignore_cookies=True no debe aparecer cookiefile en las opciones."""
    opts = build_ytdlp_options(ignore_cookies=True)
    assert "cookiefile" not in opts


def test_no_cookiefile_without_cookies_configured(monkeypatch):
    """Sin cookies configuradas tampoco debe aparecer cookiefile."""
    monkeypatch.setattr(settings, "YTDLP_COOKIES_PATH", "")
    monkeypatch.setattr(settings, "YTDLP_COOKIES_B64", "")
    monkeypatch.setattr(settings, "YTDLP_COOKIES_TEXT", "")
    opts = build_ytdlp_options(ignore_cookies=False)
    assert "cookiefile" not in opts


# ---------------------------------------------------------------------------
# max_filesize
# ---------------------------------------------------------------------------

def test_max_filesize_present_when_configured(monkeypatch):
    """max_filesize debe ser MAX_FILE_SIZE_MB * 1024 * 1024 cuando es > 0."""
    monkeypatch.setattr(settings, "MAX_FILE_SIZE_MB", 500)
    opts = build_ytdlp_options(ignore_cookies=True)
    assert "max_filesize" in opts
    assert opts["max_filesize"] == 500 * 1024 * 1024


def test_max_filesize_absent_when_zero(monkeypatch):
    """max_filesize no debe aparecer cuando MAX_FILE_SIZE_MB es 0."""
    monkeypatch.setattr(settings, "MAX_FILE_SIZE_MB", 0)
    opts = build_ytdlp_options(ignore_cookies=True)
    assert "max_filesize" not in opts


# ---------------------------------------------------------------------------
# clean_ytdlp_error
# ---------------------------------------------------------------------------

def test_clean_ytdlp_error_removes_prefix():
    """Debe eliminar el prefijo 'ERROR:' (case-insensitive)."""
    result = clean_ytdlp_error("ERROR: Video unavailable")
    assert not result.startswith("ERROR:")
    assert "Video unavailable" in result


def test_clean_ytdlp_error_removes_extractor_tag():
    """Debe eliminar la etiqueta [youtube] id: al principio."""
    result = clean_ytdlp_error("[youtube] jNQXAC9IVRw: Video unavailable")
    assert "[youtube]" not in result
    assert "Video unavailable" in result


def test_clean_ytdlp_error_handles_empty():
    """Cadena vacía debe devolver mensaje genérico."""
    result = clean_ytdlp_error("")
    assert result  # No debe estar vacío
