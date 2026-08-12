import logging
import tempfile
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, File, HTTPException, UploadFile, status

from app.activity.demo import run_activity_demo
from app.activity.service import evaluate_and_alert
from app.alerts_store import alert_log
from app.combined_demo import run_combined_demo

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/activity", tags=["activity"])

_ai_service_root = Path(__file__).resolve().parents[3]


@router.post("/analyze")
async def analyze(video: UploadFile = File(...)) -> dict:
    """Runs the suspicious-activity heuristic (after-hours + loitering near
    the entrance zone — see app/activity/__init__.py for what this is and
    isn't) on an uploaded clip and raises an alert if both conditions hold."""
    contents = await video.read()
    if not contents:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Uploaded video is empty")
    suffix = Path(video.filename or "video.mp4").suffix or ".mp4"
    tmp_path = Path(tempfile.gettempdir()) / f"activity-{uuid4().hex}{suffix}"
    tmp_path.write_bytes(contents)
    try:
        return evaluate_and_alert(str(tmp_path), alert_log)
    except ValueError as exc:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, str(exc)) from exc
    finally:
        tmp_path.unlink(missing_ok=True)


@router.post("/demo/run")
async def run_demo() -> dict:
    """One-click, server-side run of three contrasting scenarios (night +
    loiter, night walk-by, daytime loiter) showing the heuristic only fires
    when both signals hold — see scripts/run_activity_demo.py for the CLI
    equivalent."""
    return run_activity_demo(_ai_service_root)


@router.post("/demo/run-combined")
async def run_combined() -> dict:
    """Single video exercising both detectors together: one synthetic clip
    of a person approaching and loitering at a restricted entrance after
    hours, evaluated by both the suspicious-activity zone heuristic and gait
    re-identification against whatever's currently in the gallery."""
    return run_combined_demo(_ai_service_root)
