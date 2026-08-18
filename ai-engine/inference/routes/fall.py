import logging
import tempfile
from dataclasses import asdict
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status

from fall.detector import analyze_fall
from inference.annotate import annotate_video
from inference.pipeline import get_detector
from inference.security import get_current_claims
from inference.state import alert_log, data_dir, settings

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/fall", tags=["fall"], dependencies=[Depends(get_current_claims)])

SAMPLES_DIR = data_dir / "samples"
DEMO_SAMPLE_NAME = "fall-demo.mp4"


def _record_if_fell(event, camera_label: str | None = None) -> dict | None:
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


def _run_and_respond(video_path: str, camera_label: str | None = None) -> dict:
    try:
        event, stats = analyze_fall(video_path)
    except ValueError as exc:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, str(exc)) from exc

    alert = _record_if_fell(event, camera_label)

    # Best-effort annotated preview (YOLO+DeepSORT boxes) over the same
    # bounded window analyze_fall() scans — a fall past that window still
    # gets *detected* (analyze_fall samples further via frame striding),
    # it just won't be visible in this particular preview clip.
    video_url = None
    try:
        out_name = f"fall-annotated-{uuid4().hex}.mp4"
        out_path = data_dir / "demo-videos" / out_name
        annotate_video(get_detector(), video_path, out_path)
        video_url = f"/demo-videos/{out_name}"
    except ValueError:
        logger.warning("Fall-preview annotation failed for %r, omitting video_url", video_path, exc_info=True)

    return {
        "fell": event is not None and event.confidence >= settings.fall_confidence_threshold,
        "event": asdict(event) if event else None,
        "threshold": settings.fall_confidence_threshold,
        "alert": alert,
        "video_url": video_url,
        **stats,
    }


@router.post("/analyze")
async def analyze(video: UploadFile = File(...)) -> dict:
    """Runs bbox-geometry fall detection (see fall/detector.py) on an
    uploaded clip and raises an alert if a fall is found at or above
    FALL_CONFIDENCE_THRESHOLD."""
    contents = await video.read()
    if not contents:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Uploaded video is empty")
    suffix = Path(video.filename or "video.mp4").suffix or ".mp4"
    tmp_path = Path(tempfile.gettempdir()) / f"fall-{uuid4().hex}{suffix}"
    tmp_path.write_bytes(contents)
    try:
        return _run_and_respond(str(tmp_path))
    finally:
        tmp_path.unlink(missing_ok=True)


@router.post("/demo/run")
async def run_demo() -> dict:
    """One-click demo: runs fall detection against a locally-supplied
    sample clip at DEMO_DATA_DIR/samples/fall-demo.mp4. Unlike the gait and
    activity demos, this one isn't self-generating — a synthetic stick
    figure has no realistic bbox-collapse to detect, so it needs a real
    (or realistic) clip of an actual fall. Not bundled in the image or the
    repo (see README); place one locally to use this endpoint."""
    if settings.is_production:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Not found")
    sample_path = SAMPLES_DIR / DEMO_SAMPLE_NAME
    if not sample_path.exists():
        raise HTTPException(
            status.HTTP_404_NOT_FOUND,
            f"No demo sample at {sample_path} — place a real clip of a fall there, "
            "or use /fall/analyze to upload your own.",
        )
    return _run_and_respond(str(sample_path), camera_label="Fall demo sample")
