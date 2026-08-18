from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_role
from app.core.database import get_db
from app.models.camera import Camera
from app.models.site import Site
from app.models.user import User
from app.schemas.camera import CameraCreate, CameraListResponse, CameraOut, CameraUpdate

router = APIRouter(prefix="/cameras", tags=["cameras"])


def _to_out(camera: Camera) -> CameraOut:
    return CameraOut(
        id=str(camera.id),
        name=camera.name,
        description=camera.description,
        location=camera.location,
        site_id=str(camera.site_id),
        stream_type=camera.stream_type.value,
        status=camera.status.value,
        enabled=camera.enabled,
        fps=camera.fps,
        last_seen_at=camera.last_seen_at,
        created_at=camera.created_at,
    )


def _get_camera_or_404(db: Session, camera_id: str, organization_id: uuid.UUID) -> Camera:
    try:
        cid = uuid.UUID(camera_id)
    except ValueError:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Camera not found") from None

    camera = db.get(Camera, cid)
    if camera is None or camera.organization_id != organization_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Camera not found")
    return camera


def _default_site(db: Session, organization_id: uuid.UUID) -> Site:
    site = db.scalar(
        select(Site).where(Site.organization_id == organization_id, Site.name == "Main Site")
    )
    if site is None:
        site = Site(organization_id=organization_id, name="Main Site")
        db.add(site)
        try:
            db.flush()
        except IntegrityError:
            # Lost a race with a concurrent request that created the same
            # default site first — fall back to the row it committed.
            db.rollback()
            site = db.scalar(
                select(Site).where(Site.organization_id == organization_id, Site.name == "Main Site")
            )
            if site is None:
                raise
    return site


@router.get("", response_model=CameraListResponse)
def list_cameras(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> CameraListResponse:
    cameras = db.scalars(
        select(Camera).where(Camera.organization_id == current_user.organization_id).order_by(Camera.created_at.desc())
    ).all()
    return CameraListResponse(items=[_to_out(c) for c in cameras], total=len(cameras))


@router.post("", response_model=CameraOut, status_code=status.HTTP_201_CREATED)
def create_camera(
    payload: CameraCreate,
    current_user: User = Depends(require_role("ADMIN", "SECURITY_OPERATOR")),
    db: Session = Depends(get_db),
) -> CameraOut:
    site_id: uuid.UUID
    if payload.site_id:
        try:
            site_id = uuid.UUID(payload.site_id)
        except ValueError:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid site_id") from None
        site = db.get(Site, site_id)
        if site is None or site.organization_id != current_user.organization_id:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Site not found")
    else:
        site_id = _default_site(db, current_user.organization_id).id

    camera = Camera(
        organization_id=current_user.organization_id,
        site_id=site_id,
        name=payload.name,
        description=payload.description,
        location=payload.location,
        stream_type=payload.stream_type,
        stream_url=payload.stream_url,
    )
    db.add(camera)
    db.commit()
    db.refresh(camera)
    return _to_out(camera)


@router.patch("/{camera_id}", response_model=CameraOut)
def update_camera(
    camera_id: str,
    payload: CameraUpdate,
    current_user: User = Depends(require_role("ADMIN", "SECURITY_OPERATOR")),
    db: Session = Depends(get_db),
) -> CameraOut:
    camera = _get_camera_or_404(db, camera_id, current_user.organization_id)
    updates = payload.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(camera, field, value)
    db.commit()
    db.refresh(camera)
    return _to_out(camera)


@router.delete("/{camera_id}", status_code=status.HTTP_204_NO_CONTENT, response_model=None)
def delete_camera(
    camera_id: str,
    current_user: User = Depends(require_role("ADMIN", "SECURITY_OPERATOR")),
    db: Session = Depends(get_db),
) -> None:
    camera = _get_camera_or_404(db, camera_id, current_user.organization_id)
    db.delete(camera)
    db.commit()
    return None
