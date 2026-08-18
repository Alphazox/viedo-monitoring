import tempfile
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status

from inference.annotate import annotate_video
from inference.config import get_settings
from inference.pipeline import get_detector
from inference.security import get_current_claims
from inference.state import data_dir

router = APIRouter(prefix="/detection", tags=["detection"], dependencies=[Depends(get_current_claims)])
settings = get_settings()

SAMPLES_DIR = data_dir / "samples"
DEMO_SAMPLE_NAME = "object-detection-demo.mp4"


def _annotate(video_path: str) -> dict:
    out_name = f"annotated-{uuid4().hex}.mp4"
    out_path = data_dir / "demo-videos" / out_name
    stats = annotate_video(get_detector(), video_path, out_path, all_classes=True)
    return {"video": f"/demo-videos/{out_name}", **stats}


@router.post("/annotate")
async def annotate(video: UploadFile = File(...)) -> dict:
    """Runs the real YOLOv8+DeepSORT pipeline over an uploaded clip and
    returns a new video with each frame's live detections drawn as boxes +
    track ids + class labels — proof the detector/tracker actually found
    something, not a number-only summary. Unlike the person-only pipeline
    used elsewhere in this service (gait/activity/fall), this reports every
    COCO class YOLO recognizes (person, car, bag, chair, ...), not just
    people. Synthetic clips generated elsewhere in this repo (gait/activity
    demos) won't produce any boxes here — YOLO doesn't recognize their drawn
    stick figures as real objects; this endpoint needs footage with actual
    recognizable subjects in it."""
    contents = await video.read()
    if not contents:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Uploaded video is empty")
    suffix = Path(video.filename or "video.mp4").suffix or ".mp4"
    tmp_path = Path(tempfile.gettempdir()) / f"detect-{uuid4().hex}{suffix}"
    tmp_path.write_bytes(contents)

    try:
        return _annotate(str(tmp_path))
    except ValueError as exc:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, str(exc)) from exc
    finally:
        tmp_path.unlink(missing_ok=True)


@router.post("/demo/run")
async def run_demo() -> dict:
    """One-click demo: runs YOLO+DeepSORT against a locally-supplied sample
    clip at DEMO_DATA_DIR/samples/object-detection-demo.mp4, reporting every
    COCO class YOLO recognizes rather than just people. Like the fall demo,
    this needs a real (or realistic) clip with actual recognizable subjects
    in it — not bundled in the image or the repo; place one locally to use
    this endpoint."""
    if settings.is_production:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Not found")
    sample_path = SAMPLES_DIR / DEMO_SAMPLE_NAME
    if not sample_path.exists():
        raise HTTPException(
            status.HTTP_404_NOT_FOUND,
            f"No demo sample at {sample_path} — place a real clip there, or use /detection/annotate "
            "to upload your own.",
        )
    try:
        return _annotate(str(sample_path))
    except ValueError as exc:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, str(exc)) from exc
