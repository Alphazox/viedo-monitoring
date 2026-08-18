import logging
import tempfile
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status

from events.activity_rules import evaluate_and_alert
from inference.config import get_settings
from inference.demo import run_activity_demo as _run_activity_demo
from inference.security import get_current_claims
from inference.state import alert_log, data_dir
from zones import DEFAULT_ENTRANCE_ZONE

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/activity", tags=["activity"], dependencies=[Depends(get_current_claims)])
settings = get_settings()


@router.post("/analyze")
async def analyze(video: UploadFile = File(...)) -> dict:
    """Runs the suspicious-activity heuristic (after-hours + loitering near
    the monitored zone) on an uploaded clip and raises an alert if both
    conditions hold."""
    contents = await video.read()
    if not contents:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Uploaded video is empty")
    suffix = Path(video.filename or "video.mp4").suffix or ".mp4"
    tmp_path = Path(tempfile.gettempdir()) / f"activity-{uuid4().hex}{suffix}"
    tmp_path.write_bytes(contents)
    try:
        return evaluate_and_alert(str(tmp_path), alert_log, DEFAULT_ENTRANCE_ZONE)
    except ValueError as exc:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, str(exc)) from exc
    finally:
        tmp_path.unlink(missing_ok=True)


@router.post("/demo/run")
async def run_demo() -> dict:
    """One-click, server-side run of three contrasting scenarios (night +
    loiter, night walk-by, daytime loiter) showing the heuristic only fires
    when both signals hold. Generates its own synthetic clips on the fly."""
    if settings.is_production:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Not found")
    return _run_activity_demo(data_dir, alert_log)
