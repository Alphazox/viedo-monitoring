from __future__ import annotations

import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import require_service_key
from app.core.database import get_db
from app.models.camera import Camera, CameraStatus

router = APIRouter(prefix="/internal", tags=["internal"], dependencies=[Depends(require_service_key)])


class InternalCameraOut(BaseModel):
    id: str
    organization_id: str
    name: str
    stream_type: str
    stream_url: str | None
    enabled: bool


class InternalCameraListResponse(BaseModel):
    items: list[InternalCameraOut]


class CameraHeartbeat(BaseModel):
    status: str
    fps: float | None = None
    last_seen_at: datetime | None = None


@router.get("/cameras", response_model=InternalCameraListResponse)
def list_cameras_for_ingestion(db: Session = Depends(get_db)) -> InternalCameraListResponse:
    """Unmasked camera list for video-engine to discover what to ingest.
    Unlike GET /cameras (browser-facing, masks stream_url), this is only
    reachable with the service key, so exposing the raw RTSP URL is safe."""
    cameras = db.scalars(select(Camera).where(Camera.enabled.is_(True))).all()
    return InternalCameraListResponse(
        items=[
            InternalCameraOut(
                id=str(c.id),
                organization_id=str(c.organization_id),
                name=c.name,
                stream_type=c.stream_type.value,
                stream_url=c.stream_url,
                enabled=c.enabled,
            )
            for c in cameras
        ]
    )


@router.post("/cameras/{camera_id}/heartbeat", status_code=status.HTTP_204_NO_CONTENT, response_model=None)
def heartbeat(camera_id: str, payload: CameraHeartbeat, db: Session = Depends(get_db)) -> None:
    try:
        cid = uuid.UUID(camera_id)
    except ValueError:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Camera not found") from None

    camera = db.get(Camera, cid)
    if camera is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Camera not found")

    try:
        camera.status = CameraStatus(payload.status)
    except ValueError:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid status") from None
    if payload.fps is not None:
        camera.fps = payload.fps
    camera.last_seen_at = payload.last_seen_at or datetime.utcnow()
    db.commit()
    return None
