import json
from typing import List, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    app_env: str = "development"
    debug: bool = False
    app_name: str = "AyeVideoDownloader"
    
    mongodb_url: str = "mongodb://localhost:27017"
    database_name: str = "aye_video_dev"
    mongodb_cert_b64: str = ""
    mongodb_cert_path: str = ""
    
    jwt_secret_key: str = "super_secure_secret_key_minimum_32_characters_for_ayeapps_atelier"
    access_token_expire_minutes: int = 60
    refresh_token_expire_minutes: int = 10080
    
    allowed_origins: Union[List[str], str] = [
        "https://video.ayeapps.com",
        "https://tasks.ayeapps.com",
        "https://ayeapps.com",
        "https://www.ayeapps.com",
        "https://accounts.ayeapps.com",
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:8080",
        "ayevideo://app"
    ]
    
    @field_validator("allowed_origins", mode="before")
    @classmethod
    def parse_allowed_origins(cls, v):
        if isinstance(v, str):
            v_stripped = v.strip()
            if v_stripped.startswith("[") and v_stripped.endswith("]"):
                try:
                    return json.loads(v_stripped)
                except Exception:
                    # Fallback for single quotes or malformed JSON
                    cleaned = v_stripped.strip("[]").replace("'", '"')
                    try:
                        return json.loads(f"[{cleaned}]")
                    except Exception:
                        return [item.strip().strip("'\"") for item in v_stripped.strip("[]").split(",") if item.strip()]
            return [item.strip().strip("'\"") for item in v.split(",") if item.strip()]
        return v
    
    max_concurrent_downloads: int = 3
    download_ttl_minutes: int = 30
    temp_dir: str = "/tmp/ayevideo_downloads"
    max_file_size_mb: int = 2048
    
    rate_limit_login: str = "5/minute"
    rate_limit_downloads: str = "10/minute"

    ytdlp_cookies_path: str = ""
    ytdlp_cookies_b64: str = ""
    ytdlp_cookies_text: str = ""
    ytdlp_proxy: str = ""
    ytdlp_player_client: str = "default"
    ytdlp_js_runtimes: str = "node,deno"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

settings = Settings()
