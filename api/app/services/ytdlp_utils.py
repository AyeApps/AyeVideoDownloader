import os
import base64
from typing import List
from app.core.config import settings

def get_base_ytdlp_args(ignore_cookies: bool = False) -> List[str]:
    args: List[str] = [
        "--no-check-certificates",
        "--prefer-free-formats",
    ]

    # Enable remote components for YouTube JS challenge solving
    args.extend(["--remote-components", "ejs:github"])

    # JS Runtimes for signature deciphering
    if settings.YTDLP_JS_RUNTIMES:
        for rt in settings.YTDLP_JS_RUNTIMES.split(","):
            cleaned = rt.strip()
            if cleaned:
                args.extend(["--js-runtimes", cleaned])

    # Player client (only set if customized, default lets yt-dlp select automatically)
    if settings.YTDLP_PLAYER_CLIENT and settings.YTDLP_PLAYER_CLIENT != "default":
        args.extend(["--extractor-args", f"youtube:player_client={settings.YTDLP_PLAYER_CLIENT}"])

    # Cookie support: env Base64, env Text, explicitly configured path, or default /app/cookies.txt
    if not ignore_cookies:
        cookies_target = "/tmp/ytdlp_cookies.txt"
        if settings.YTDLP_COOKIES_B64:
            try:
                decoded = base64.b64decode(settings.YTDLP_COOKIES_B64).decode("utf-8", errors="ignore")
                with open(cookies_target, "w", encoding="utf-8") as f:
                    f.write(decoded)
                args.extend(["--cookies", cookies_target])
            except Exception:
                pass
        elif settings.YTDLP_COOKIES_TEXT:
            try:
                with open(cookies_target, "w", encoding="utf-8") as f:
                    f.write(settings.YTDLP_COOKIES_TEXT)
                args.extend(["--cookies", cookies_target])
            except Exception:
                pass
        elif settings.YTDLP_COOKIES_PATH and os.path.exists(settings.YTDLP_COOKIES_PATH):
            args.extend(["--cookies", settings.YTDLP_COOKIES_PATH])
        elif os.path.exists("/app/cookies.txt"):
            args.extend(["--cookies", "/app/cookies.txt"])

    # Proxy support
    if settings.YTDLP_PROXY:
        args.extend(["--proxy", settings.YTDLP_PROXY])

    return args
