import tempfile
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, File, HTTPException, UploadFile, status

from app.detection.annotate import annotate_video
from app.detection.pipeline import _detector

router = APIRouter(prefix="/detection", tags=["detection"])

_ai_service_root = Path(__file__).resolve().parents[3]


@router.post("/annotate")
async def annotate(video: UploadFile = File(...)) -> dict:
    """Runs the real YOLOv8+DeepSORT pipeline over an uploaded clip and
    returns a new video with each frame's live detections drawn as boxes +
    track ids — proof the detector/tracker actually found someone, not a
    number-only summary. Synthetic clips generated elsewhere in this repo
    (gait/activity demos) won't produce any boxes here — YOLO doesn't
    recognize their drawn stick figures as people; this endpoint needs
    footage with an actual recognizable human in it."""
    contents = await video.read()
    if not contents:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Uploaded video is empty")
    suffix = Path(video.filename or "video.mp4").suffix or ".mp4"
    tmp_path = Path(tempfile.gettempdir()) / f"detect-{uuid4().hex}{suffix}"
    tmp_path.write_bytes(contents)

    try:
        out_name = f"annotated-{uuid4().hex}.mp4"
        out_path = _ai_service_root / "data" / "demo_videos" / out_name
        stats = annotate_video(_detector, str(tmp_path), out_path)
    except ValueError as exc:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, str(exc)) from exc
    finally:
        tmp_path.unlink(missing_ok=True)

    return {"video": out_name, **stats}
