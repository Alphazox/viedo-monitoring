from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel

from app.models.camera import CameraStatus, StreamType


class CameraOut(BaseModel):
    id: str
    name: str
    description: str | None
    location: str | None
    site_id: str
    stream_type: str
    status: str
    enabled: bool
    fps: float | None
    last_seen_at: datetime | None
    created_at: datetime


class CameraCreate(BaseModel):
    name: str
    description: str | None = None
    location: str | None = None
    site_id: str | None = None
    stream_type: StreamType = StreamType.UPLOAD
    stream_url: str | None = None


class CameraUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    location: str | None = None
    stream_type: StreamType | None = None
    stream_url: str | None = None
    status: CameraStatus | None = None
    enabled: bool | None = None


class CameraListResponse(BaseModel):
    items: list[CameraOut]
    total: int
