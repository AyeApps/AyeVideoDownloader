from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List

class Settings(BaseSettings):
    app_env: str = "development"
    debug: bool = False
    app_name: str = "AyeVideoDownloader"
    
    mongodb_url: str = "mongodb://localhost:27017"
    database_name: str = "aye_video_dev"
    
    jwt_secret_key: str = "secret"
    access_token_expire_minutes: int = 60
    refresh_token_expire_minutes: int = 10080
    
    allowed_origins: List[str] = ["http://localhost:3000", "ayevideo://app"]
    
    max_concurrent_downloads: int = 3
    download_ttl_minutes: int = 30
    temp_dir: str = "/tmp/ayevideo_downloads"
    max_file_size_mb: int = 2048
    
    rate_limit_login: str = "5/minute"
    rate_limit_downloads: str = "10/minute"

    ytdlp_cookies_path: str = ""
    ytdlp_proxy: str = ""
    ytdlp_player_client: str = "android,tv,web"
    ytdlp_js_runtimes: str = "deno"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

settings = Settings()
