"""Automated ingestion entry point for video-engine. Everywhere else in this
service, a human uploads a whole video file through the browser; video-engine
instead calls this one endpoint periodically with a short buffered clip per
camera. Reuses the exact same analysis primitives the manual routes use
(events/activity_rules.evaluate_and_alert, fall/detector.analyze_fall,
inference/state.alert_log) so results land in the same /alerts feed the
dashboard already reads, tagged with camera_label to identify the source.
"""
from __future__ import annotations

import logging
import tempfile
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status

from events.activity_rules import evaluate_and_alert
from fall.detector import analyze_fall
from inference.security import require_service_key
from inference.state import alert_log, settings
from zones import DEFAULT_ENTRANCE_ZONE

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/pipeline", tags=["pipeline"], dependencies=[Depends(require_service_key)])


def _record_fall_if_any(event, camera_label: str | None) -> dict | None:
    if event is None or event.confidence < settings.fall_confidence_threshold:
        return None
    severity = "critical" if event.confidence >= 0.8 else "warning"
    return alert_log.record(
        type="fall_detected",
        severity=severity,
        message=(
            f"Possible fall detected at {event.timestamp_seconds}s into the clip "
            f"({event.confidence:.0%} confidence — bounding-box aspect ratio dropped from "
            f"{event.aspect_before} to {event.aspect_after})"
        ),
        camera_label=camera_label,
    )


@router.post("/ingest-clip")
async def ingest_clip(
    video: UploadFile = File(...),
    camera_id: str = Form(...),
    camera_label: str | None = Form(default=None),
) -> dict:
    """video-engine calls this every CLIP_FORWARD_INTERVAL_SECONDS per camera
    with the most recently buffered footage. Runs the activity (after-hours +
    loitering) and fall heuristics against it and records any resulting
    alerts — the same checks /activity/analyze and /fall/analyze run on a
    manually uploaded clip, just on an automated cadence."""
    contents = await video.read()
    if not contents:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Uploaded clip is empty")
    suffix = Path(video.filename or "clip.mp4").suffix or ".mp4"
    tmp_path = Path(tempfile.gettempdir()) / f"pipeline-{uuid4().hex}{suffix}"
    tmp_path.write_bytes(contents)

    label = camera_label or camera_id
    try:
        try:
            activity_result = evaluate_and_alert(str(tmp_path), alert_log, DEFAULT_ENTRANCE_ZONE, camera_label=label)
        except ValueError as exc:
            logger.warning("Activity analysis failed for camera %s: %s", camera_id, exc)
            activity_result = None

        try:
            fall_event, fall_stats = analyze_fall(str(tmp_path))
            fall_alert = _record_fall_if_any(fall_event, label)
        except ValueError as exc:
            logger.warning("Fall analysis failed for camera %s: %s", camera_id, exc)
            fall_alert, fall_stats = None, None
    finally:
        tmp_path.unlink(missing_ok=True)

    return {
        "camera_id": camera_id,
        "activity_alert": activity_result.get("alert") if activity_result else None,
        "fall_alert": fall_alert,
        "fall_stats": fall_stats,
    }
