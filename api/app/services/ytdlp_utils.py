import os
import base64
import re
import importlib.util
from typing import Any, Optional
from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)

_prepared_cookies_path: Optional[str] = None
_cookies_initialized: bool = False


class YTDLPLogger:
    """
    Logger personalizado para YoutubeDL que reenvía advertencias y errores
    al logger de la aplicación sin emitir mensajes de debug, y almacena
    el último mensaje de error emitido.
    """
    def __init__(self, app_logger=None):
        self.app_logger = app_logger or logger
        self.last_error: str = ""

    def debug(self, msg: str) -> None:
        pass

    def info(self, msg: str) -> None:
        pass

    def warning(self, msg: str) -> None:
        self.app_logger.warning("yt-dlp: %s", msg)

    def error(self, msg: str) -> None:
        self.last_error = msg
        self.app_logger.error("yt-dlp: %s", msg)


def clean_ytdlp_error(err_msg: str) -> str:
    """
    Limpia el mensaje de error de yt-dlp eliminando el prefijo 'ERROR:'
    y cualquier etiqueta de extractor/id inicial como '[youtube] id:'.
    """
    if not err_msg:
        return "Error desconocido en yt-dlp"
    clean = re.sub(r"^ERROR:\s*", "", err_msg, flags=re.IGNORECASE).strip()
    clean = re.sub(r"^\[[^\]]+\]\s*[^:]+:\s*", "", clean).strip()
    return clean or err_msg


def get_prepared_cookies_path() -> Optional[str]:
    """
    Prepara el archivo de cookies privado en /tmp la primera vez que se solicita
    (orden: B64, texto, ruta configurada, /app/cookies.txt) con permisos 0o600.
    Todas las llamadas posteriores reutilizan la misma ruta.
    """
    global _prepared_cookies_path, _cookies_initialized
    if _cookies_initialized:
        return _prepared_cookies_path

    _cookies_initialized = True
    cookies_target = "/tmp/ytdlp_cookies.txt"

    def _write_private_file(data: str) -> bool:
        try:
            flags = os.O_WRONLY | os.O_CREAT | os.O_TRUNC
            fd = os.open(cookies_target, flags, 0o600)
            with os.fdopen(fd, "w", encoding="utf-8") as f:
                f.write(data)
            os.chmod(cookies_target, 0o600)
            return True
        except Exception:
            logger.exception("Error escribiendo archivo privado de cookies en %s", cookies_target)
            return False

    if settings.YTDLP_COOKIES_B64:
        try:
            decoded = base64.b64decode(settings.YTDLP_COOKIES_B64).decode("utf-8", errors="ignore")
            if _write_private_file(decoded):
                _prepared_cookies_path = cookies_target
        except Exception:
            logger.exception("Error decodificando YTDLP_COOKIES_B64")
    elif settings.YTDLP_COOKIES_TEXT:
        if _write_private_file(settings.YTDLP_COOKIES_TEXT):
            _prepared_cookies_path = cookies_target
    elif settings.YTDLP_COOKIES_PATH and os.path.exists(settings.YTDLP_COOKIES_PATH):
        try:
            with open(settings.YTDLP_COOKIES_PATH, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()
            if _write_private_file(content):
                _prepared_cookies_path = cookies_target
        except Exception:
            logger.exception("Error leyendo cookies desde YTDLP_COOKIES_PATH")
    elif os.path.exists("/app/cookies.txt"):
        try:
            with open("/app/cookies.txt", "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()
            if _write_private_file(content):
                _prepared_cookies_path = cookies_target
        except Exception:
            logger.exception("Error leyendo cookies desde /app/cookies.txt")

    return _prepared_cookies_path


def build_ytdlp_options(
    ignore_cookies: bool = False,
    ytdlp_logger: Optional[YTDLPLogger] = None
) -> dict[str, Any]:
    """
    Construye las opciones para la clase YoutubeDL de yt-dlp garantizando
    modo silencioso, cookies privadas, proxy, player_client, certificados y límites.
    """
    opts: dict[str, Any] = {
        "nocheckcertificate": True,
        "prefer_free_formats": True,
        "quiet": True,
        "noprogress": True,
    }

    if ytdlp_logger is not None:
        opts["logger"] = ytdlp_logger

    # Componentes remotas ejs desde github solo si yt_dlp_ejs no está instalado
    if importlib.util.find_spec("yt_dlp_ejs") is None:
        opts["remote_components"] = ["ejs:github"]

    # Runtimes JS para descifrado de firmas
    if settings.YTDLP_JS_RUNTIMES:
        # La API de YoutubeDL espera {runtime: {"path": ruta|None}}, igual que --js-runtimes
        # del CLI ("node", "deno:/usr/local/bin/deno"); una lista la rechaza.
        rts: dict[str, dict[str, Optional[str]]] = {}
        for rt in settings.YTDLP_JS_RUNTIMES.split(","):
            rt = rt.strip()
            if rt:
                name, _, path = rt.partition(":")
                rts[name.strip().lower()] = {"path": path.strip() or None}
        if rts:
            opts["js_runtimes"] = rts

    # Player client
    if settings.YTDLP_PLAYER_CLIENT and settings.YTDLP_PLAYER_CLIENT != "default":
        opts["extractor_args"] = {"youtube": {"player_client": [settings.YTDLP_PLAYER_CLIENT]}}

    # Cookies
    if not ignore_cookies:
        cookie_path = get_prepared_cookies_path()
        if cookie_path:
            opts["cookiefile"] = cookie_path

    # Proxy
    if settings.YTDLP_PROXY:
        opts["proxy"] = settings.YTDLP_PROXY

    # Tamaño máximo de archivo
    if settings.MAX_FILE_SIZE_MB and settings.MAX_FILE_SIZE_MB > 0:
        opts["max_filesize"] = settings.MAX_FILE_SIZE_MB * 1024 * 1024

    return opts
