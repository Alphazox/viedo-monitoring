import logging
import tempfile
from pathlib import Path
from uuid import uuid4

import cv2
from fastapi import APIRouter, File, Form, HTTPException, UploadFile, status

from app.alerts_store import alert_log
from app.core.config import get_settings
from app.detection.pipeline import track_people
from app.gait.demo import run_alert_demo
from app.gait.gallery import GaitGallery
from app.gait.seed import seed_gallery
from app.gait.service import GaitRecognitionService
from app.gait.visualize import visualize_gait_extraction
from app.gait.watch import evaluate_watch

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/gait", tags=["gait"])

_settings = get_settings()
_data_dir = Path(_settings.demo_data_dir) / "gait"
_ai_service_root = Path(__file__).resolve().parents[3]
_service = GaitRecognitionService(_data_dir / "model" / "gait_embedding_net.pt")
_gallery = GaitGallery(_data_dir / "gallery")


async def _save_upload(video: UploadFile) -> Path:
    contents = await video.read()
    if not contents:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Uploaded video is empty")
    suffix = Path(video.filename or "video.mp4").suffix or ".mp4"
    tmp_path = Path(tempfile.gettempdir()) / f"gait-{uuid4().hex}{suffix}"
    tmp_path.write_bytes(contents)
    return tmp_path


@router.post("/enroll")
async def enroll(
    label: str = Form(...), watchlisted: bool = Form(False), video: UploadFile = File(...)
) -> dict:
    """Extracts a gait embedding from an uploaded walking clip and stores it
    in the gallery under a new subject id. `watchlisted=true` marks this
    subject as alert-worthy — a later /gait/watch match against them raises
    an alert."""
    tmp_path = await _save_upload(video)
    try:
        embedding = _service.embed_video(str(tmp_path))
    except ValueError as exc:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, str(exc)) from exc
    finally:
        tmp_path.unlink(missing_ok=True)

    subject_id = uuid4().hex
    _gallery.enroll(subject_id, label, embedding, watchlisted=watchlisted)
    return {"subjectId": subject_id, "label": label, "watchlisted": watchlisted}


@router.post("/identify")
async def identify(video: UploadFile = File(...), top_k: int = Form(3)) -> dict:
    """Extracts a gait embedding from an uploaded clip and ranks it against
    everyone currently enrolled in the gallery by cosine similarity."""
    tmp_path = await _save_upload(video)
    try:
        embedding = _service.embed_video(str(tmp_path))
    except ValueError as exc:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, str(exc)) from exc
    finally:
        tmp_path.unlink(missing_ok=True)

    return {"matches": _gallery.identify(embedding, top_k=top_k)}


@router.get("/gallery")
async def list_gallery() -> dict:
    return {"subjects": _gallery.list_subjects()}


@router.post("/watch")
async def watch(video: UploadFile = File(...)) -> dict:
    """Simulates a camera feed being watched: runs gait identification and,
    if the best match is a watchlisted subject at/above GAIT_ALERT_THRESHOLD,
    records an alert and logs a simulated notification (see app/alerts.py
    for why it's simulated rather than real)."""
    tmp_path = await _save_upload(video)
    try:
        embedding = _service.embed_video(str(tmp_path))
    except ValueError as exc:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, str(exc)) from exc
    finally:
        tmp_path.unlink(missing_ok=True)

    return evaluate_watch(embedding, _gallery, alert_log, _settings.gait_alert_threshold)


@router.post("/visualize")
async def visualize(video: UploadFile = File(...)) -> dict:
    """Renders what GaitRecognitionService.embed_video actually does to a
    clip — the real YOLO+DeepSORT tracked bbox and extracted silhouette
    drawn on every frame, then the resulting Gait Energy Image (the actual
    signature) held as a closing card — instead of only the numeric
    embedding /gait/enroll and /gait/watch return. Needs a real,
    recognizable person; this repo's own synthetic clips won't produce a
    track (see app/detection/__init__.py)."""
    tmp_path = await _save_upload(video)
    try:
        tracks = track_people(str(tmp_path))
        if not tracks:
            raise HTTPException(
                status.HTTP_422_UNPROCESSABLE_ENTITY,
                "No person detected in this clip — gait visualization needs a real, recognizable person.",
            )
        cap = cv2.VideoCapture(str(tmp_path))
        fps = cap.get(cv2.CAP_PROP_FPS) or 24.0
        cap.release()

        out_name = f"gait-viz-{uuid4().hex}.mp4"
        out_path = _ai_service_root / "data" / "demo_videos" / out_name
        stats = visualize_gait_extraction(tracks[0], out_path, fps=fps)
    finally:
        tmp_path.unlink(missing_ok=True)

    return {"video": out_name, **stats}


@router.post("/demo/run")
async def run_demo() -> dict:
    """One-click, server-side run of the full single-video enroll -> watch ->
    alert demo (see scripts/run_alert_demo.py for the CLI equivalent) —
    generates its own synthetic clip, so it takes no input."""
    return run_alert_demo(_ai_service_root, threshold=_settings.gait_alert_threshold)


@router.post("/demo/seed-gallery")
async def seed_gallery_route() -> dict:
    """Enrolls several synthetic watchlisted 'suspect' profiles into the
    real gallery (see scripts/seed_gait_gallery.py for the CLI equivalent) so
    it doesn't start with just one entry."""
    return {"enrolled": seed_gallery(_ai_service_root, _service, _gallery)}
