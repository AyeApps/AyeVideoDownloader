import os
from typing import List
from app.core.config import settings

def get_base_ytdlp_args() -> List[str]:
    args: List[str] = [
        "--js-runtimes", settings.ytdlp_js_runtimes,
        "--extractor-args", f"youtube:player_client={settings.ytdlp_player_client}",
        "--user-agent", "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Mobile/15E148 Safari/604.1",
    ]

    # Cookie support: explicitly configured path or default /app/cookies.txt
    cookies_path = settings.ytdlp_cookies_path or "/app/cookies.txt"
    if os.path.exists(cookies_path):
        args.extend(["--cookies", cookies_path])

    # Proxy support
    if settings.ytdlp_proxy:
        args.extend(["--proxy", settings.ytdlp_proxy])

    return args
