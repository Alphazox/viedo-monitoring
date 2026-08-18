from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "AegisVision AI - AI Engine"
    env: str = Field(default="development", alias="ENV")
    log_level: str = Field(default="INFO", alias="LOG_LEVEL")
    port: int = Field(default=8001, alias="PORT")
    allowed_origins: str = Field(default="http://localhost:3000", alias="ALLOWED_ORIGINS")

    # --- Auth ---
    # Same secret the backend signs user access tokens with (see
    # backend/app/core/security.py) — both services read the same root .env
    # in docker-compose, so this must stay in sync with the backend's value.
    jwt_secret: str = Field(default="dev-only-insecure-secret-change-me", alias="JWT_SECRET")
    jwt_algorithm: str = Field(default="HS256", alias="JWT_ALGORITHM")
    # Shared secret for internal service-to-service calls (video-engine ->
    # this service's /pipeline/* routes) — not a user credential.
    service_api_key: str = Field(default="dev-only-insecure-service-key-change-me", alias="SERVICE_API_KEY")

    # Local, file-backed storage for the gait gallery, alert log, YOLO
    # weights cache, and generated demo videos — no database this round.
    demo_data_dir: str = Field(default="./data", alias="DEMO_DATA_DIR")

    # --- AI / detection ---
    ai_model_path: str = Field(default="yolov8n.pt", alias="AI_MODEL_PATH")
    ai_device: str = Field(default="cpu", alias="AI_DEVICE")

    # --- Gait watchlist ---
    gait_alert_threshold: float = Field(default=0.85, alias="GAIT_ALERT_THRESHOLD")

    # --- Rule engine thresholds ---
    # NOTE: mirrored from the root .env.example for parity with the backend's
    # rule-engine config surface, but not yet load-bearing in the ported
    # activity heuristic below (events/activity_rules.py) — that heuristic
    # keeps the old, demo-clip-tuned frame-count thresholds (10 frames dwell,
    # ~few-second clips) rather than converting these second-based values,
    # since the synthetic demo clips are only a few seconds long and a
    # literal 30s loitering threshold would never fire against them. Wiring
    # real continuous-stream thresholds through is future work, same as
    # attributes/ and fall/.
    loitering_threshold_seconds: int = Field(default=30, alias="LOITERING_THRESHOLD_SECONDS")
    intrusion_cooldown_seconds: int = Field(default=60, alias="INTRUSION_COOLDOWN_SECONDS")
    fall_confidence_threshold: float = Field(default=0.5, alias="FALL_CONFIDENCE_THRESHOLD")

    @property
    def is_production(self) -> bool:
        return self.env == "production"

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.allowed_origins.split(",")]


@lru_cache
def get_settings() -> Settings:
    return Settings()
