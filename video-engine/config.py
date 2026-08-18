from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "AegisVision AI - video-engine"
    env: str = Field(default="development", alias="ENV")
    log_level: str = Field(default="INFO", alias="LOG_LEVEL")
    port: int = Field(default=8002, alias="VIDEO_ENGINE_PORT")

    # --- Talking to the other two services ---
    backend_url: str = Field(default="http://backend:8000", alias="BACKEND_URL")
    ai_engine_url: str = Field(default="http://ai-engine:8001", alias="AI_ENGINE_URL")
    service_api_key: str = Field(default="dev-only-insecure-service-key-change-me", alias="SERVICE_API_KEY")

    # Validates the same user access token the backend issues, for the
    # on-demand snapshot/clip trigger endpoints in main.py.
    jwt_secret: str = Field(default="dev-only-insecure-secret-change-me", alias="JWT_SECRET")
    jwt_algorithm: str = Field(default="HS256", alias="JWT_ALGORITHM")

    # --- Ingestion cadence ---
    camera_poll_interval_seconds: float = Field(default=30.0, alias="CAMERA_POLL_INTERVAL_SECONDS")
    snapshot_interval_seconds: float = Field(default=15.0, alias="SNAPSHOT_INTERVAL_SECONDS")
    clip_forward_interval_seconds: float = Field(default=12.0, alias="CLIP_FORWARD_INTERVAL_SECONDS")
    frame_buffer_seconds: float = Field(default=30.0, alias="FRAME_BUFFER_SECONDS")
    segment_retention_seconds: float = Field(default=300.0, alias="SEGMENT_RETENTION_SECONDS")
    hls_segment_seconds: int = Field(default=4, alias="HLS_SEGMENT_SECONDS")
    hls_playlist_size: int = Field(default=6, alias="HLS_PLAYLIST_SIZE")
    reconnect_backoff_seconds: float = Field(default=5.0, alias="RECONNECT_BACKOFF_SECONDS")

    # --- Storage ---
    media_dir: str = Field(default="./storage/media", alias="MEDIA_DIR")

    # Looped when a camera has no stream_url set (e.g. the seeded UPLOAD-type
    # demo cameras) so the full pipeline is exercisable without a real camera.
    demo_fallback_video: str = Field(
        default="./storage/uploads/sample-walking-realistic.mp4", alias="DEMO_FALLBACK_VIDEO"
    )

    @property
    def is_production(self) -> bool:
        return self.env == "production"


@lru_cache
def get_settings() -> Settings:
    return Settings()
