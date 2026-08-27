import os
import base64
from typing import List
from app.core.config import settings

def get_base_ytdlp_args() -> List[str]:
    args: List[str] = [
        "--js-runtimes", settings.ytdlp_js_runtimes,
        "--extractor-args", f"youtube:player_client={settings.ytdlp_player_client}",
        "--user-agent", "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Mobile/15E148 Safari/604.1",
    ]

    # Cookie support: env Base64, env Text, explicitly configured path, or default /app/cookies.txt
    cookies_target = "/tmp/ytdlp_cookies.txt"
    if settings.ytdlp_cookies_b64:
        try:
            decoded = base64.b64decode(settings.ytdlp_cookies_b64).decode("utf-8", errors="ignore")
            with open(cookies_target, "w", encoding="utf-8") as f:
                f.write(decoded)
            args.extend(["--cookies", cookies_target])
        except Exception:
            pass
    elif settings.ytdlp_cookies_text:
        try:
            with open(cookies_target, "w", encoding="utf-8") as f:
                f.write(settings.ytdlp_cookies_text)
            args.extend(["--cookies", cookies_target])
        except Exception:
            pass
    elif settings.ytdlp_cookies_path and os.path.exists(settings.ytdlp_cookies_path):
        args.extend(["--cookies", settings.ytdlp_cookies_path])
    elif os.path.exists("/app/cookies.txt"):
        args.extend(["--cookies", "/app/cookies.txt"])

    # Proxy support
    if settings.ytdlp_proxy:
        args.extend(["--proxy", settings.ytdlp_proxy])

    return args
