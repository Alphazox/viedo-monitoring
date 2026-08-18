from __future__ import annotations

import logging
import threading
from contextlib import asynccontextmanager
from pathlib import Path

import jwt
from fastapi import Depends, FastAPI, HTTPException, Query, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from fastapi.staticfiles import StaticFiles

from clips.writer import write_clip
from config import get_settings
from ingestion.manager import IngestionManager
from snapshots.writer import write_snapshot
from streaming.sweeper import sweep_old_segments

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

settings = get_settings()
media_dir = Path(settings.media_dir)
live_dir = media_dir / "live"
snapshots_dir = media_dir / "snapshots"
clips_dir = media_dir / "clips"
for d in (live_dir, snapshots_dir, clips_dir):
    d.mkdir(parents=True, exist_ok=True)

manager = IngestionManager(settings, media_dir)

_bearer_scheme = HTTPBearer(auto_error=True)


def get_current_claims(credentials: HTTPAuthorizationCredentials = Depends(_bearer_scheme)) -> dict:
    """Validates the same user access token the backend issues (shared
    JWT_SECRET) — gates the on-demand snapshot/clip trigger endpoints below,
    which are for a logged-in operator, not the internal ingestion loop."""
    try:
        payload = jwt.decode(credentials.credentials, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    except jwt.InvalidTokenError as exc:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or expired token") from exc
    if payload.get("type") != "access":
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Expected an access token")
    return payload


def _sweep_loop(stop_event: threading.Event) -> None:
    while not stop_event.wait(settings.segment_retention_seconds / 4):
        removed = sweep_old_segments(live_dir, settings.segment_retention_seconds)
        if removed:
            logger.info("Swept %d stale HLS segment(s)", removed)


@asynccontextmanager
async def lifespan(app: FastAPI):
    manager.start()
    sweep_stop = threading.Event()
    sweep_thread = threading.Thread(target=_sweep_loop, args=(sweep_stop,), name="segment-sweeper", daemon=True)
    sweep_thread.start()
    yield
    sweep_stop.set()
    sweep_thread.join(timeout=5)
    manager.stop()


app = FastAPI(title=settings.app_name, lifespan=lifespan)

app.mount("/live", StaticFiles(directory=live_dir), name="live")
app.mount("/media/snapshots", StaticFiles(directory=snapshots_dir), name="snapshots")
app.mount("/media/clips", StaticFiles(directory=clips_dir), name="clips")


@app.get("/health/live")
def health_live() -> dict:
    return {"status": "ok"}


@app.get("/health/ready")
def health_ready() -> dict:
    return {"status": "ok", "cameras_ingesting": manager.worker_count()}


@app.post("/cameras/{camera_id}/snapshot")
def trigger_snapshot(camera_id: str, claims: dict = Depends(get_current_claims)) -> dict:
    worker = manager.get_worker(camera_id)
    if worker is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Camera is not currently being ingested")
    frame = worker.buffer.latest()
    if frame is None:
        raise HTTPException(status.HTTP_409_CONFLICT, "No frames buffered yet for this camera")
    path = write_snapshot(frame, snapshots_dir, camera_id)
    return {"path": f"/media/snapshots/{path.name}"}


@app.post("/cameras/{camera_id}/clip")
def trigger_clip(
    camera_id: str, seconds: float = Query(default=10.0, gt=0), claims: dict = Depends(get_current_claims)
) -> dict:
    worker = manager.get_worker(camera_id)
    if worker is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Camera is not currently being ingested")
    frames = worker.buffer.last_seconds(seconds)
    if not frames:
        raise HTTPException(status.HTTP_409_CONFLICT, "No frames buffered yet for this camera")
    path = write_clip(frames, clips_dir, camera_id, fps=max(len(frames) / seconds, 1.0))
    return {"path": f"/media/clips/{path.name}"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=settings.port, reload=not settings.is_production)
