from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.api.routes import auth, cameras, internal, users
from app.core.config import Settings, get_settings
from app.core.database import SessionLocal
from app.core.logging import configure_logging

settings = get_settings()
configure_logging()

_INSECURE_DEFAULTS = {
    "JWT_SECRET": "dev-only-insecure-secret-change-me",
    "SEED_ADMIN_PASSWORD": "change-me-strong-password",
    "SERVICE_API_KEY": "dev-only-insecure-service-key-change-me",
}


def _reject_insecure_production_defaults(check_settings: Settings) -> None:
    if check_settings.ENV != "production":
        return
    leaked = [name for name, default in _INSECURE_DEFAULTS.items() if getattr(check_settings, name) == default]
    if leaked:
        raise RuntimeError(
            "Refusing to start with insecure default value(s) in production: "
            f"{', '.join(leaked)}. Set real values via environment variables."
        )


_reject_insecure_production_defaults(settings)

app = FastAPI(title="AegisVision AI API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1")
app.include_router(cameras.router, prefix="/api/v1")
app.include_router(users.router, prefix="/api/v1")
app.include_router(internal.router, prefix="/api/v1")


@app.get("/health/live")
def health_live() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/health/ready")
def health_ready() -> dict[str, str]:
    db = SessionLocal()
    try:
        db.execute(text("SELECT 1"))
    finally:
        db.close()
    return {"status": "ok"}
