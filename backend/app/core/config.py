"""Central application configuration, loaded from environment variables.

Every value here has a safe development default EXCEPT secrets (JWT_SECRET,
DB password, LLM keys), which must come from the environment in any non-dev
deployment. See ../../../.env.example for the full list of variables.
"""
from functools import lru_cache
from pathlib import Path
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    ENV: Literal["development", "test", "production"] = "development"
    LOG_LEVEL: str = "INFO"

    # Database
    DATABASE_URL: str = "postgresql+psycopg://aegisvision:change-me-in-dev@localhost:5432/aegisvision"

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # Auth
    JWT_SECRET: str = "dev-only-insecure-secret-change-me"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    REFRESH_COOKIE_NAME: str = "aegisvision_refresh"
    REFRESH_COOKIE_SECURE: bool = False

    # Service-to-service auth (ai-engine, video-engine calling back into this
    # API) — not a user credential, checked via the X-Service-Key header.
    SERVICE_API_KEY: str = "dev-only-insecure-service-key-change-me"

    # Storage
    STORAGE_BACKEND: Literal["local", "s3"] = "local"
    UPLOAD_DIR: str = "./storage/uploads"
    MEDIA_DIR: str = "./storage/media"
    MAX_UPLOAD_SIZE_MB: int = 2048
    S3_ENDPOINT_URL: str | None = None
    S3_BUCKET: str | None = None
    S3_ACCESS_KEY_ID: str | None = None
    S3_SECRET_ACCESS_KEY: str | None = None
    S3_REGION: str = "auto"

    # CORS
    CORS_ORIGINS: str = "http://localhost:3000"

    # AI / detection
    AI_MODEL_PATH: str = "yolov8n.pt"
    AI_DEVICE: str = "cpu"
    FRAME_SAMPLE_FPS: float = 2.0

    # Rule engine
    LOITERING_THRESHOLD_SECONDS: int = 30
    INTRUSION_COOLDOWN_SECONDS: int = 60
    FALL_CONFIDENCE_THRESHOLD: float = 0.5

    # Retention
    VIDEO_RETENTION_DAYS: int | None = 90
    EVENT_RETENTION_DAYS: int | None = 180
    INCIDENT_RETENTION_DAYS: int | None = 365

    # LLM
    LLM_PROVIDER: Literal["none", "anthropic", "openai"] = "none"
    LLM_API_KEY: str | None = None
    LLM_MODEL: str | None = None

    # Embeddings
    EMBEDDING_PROVIDER: Literal["local", "openai"] = "local"
    EMBEDDING_MODEL: str = "all-MiniLM-L6-v2"
    EMBEDDING_DIM: int = 384

    # Seed
    SEED_ORG_NAME: str = "Demo Security"
    SEED_ADMIN_EMAIL: str = "admin@demo.local"
    SEED_ADMIN_PASSWORD: str = "change-me-strong-password"

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    @property
    def upload_dir_path(self) -> Path:
        p = Path(self.UPLOAD_DIR)
        p.mkdir(parents=True, exist_ok=True)
        return p

    @property
    def media_dir_path(self) -> Path:
        p = Path(self.MEDIA_DIR)
        (p / "snapshots").mkdir(parents=True, exist_ok=True)
        (p / "clips").mkdir(parents=True, exist_ok=True)
        return p


@lru_cache
def get_settings() -> Settings:
    return Settings()
