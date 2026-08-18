import enum
import uuid

from sqlalchemy import Boolean, DateTime, Enum, Float, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.base import TimestampMixin, UUIDPKMixin


class StreamType(str, enum.Enum):
    UPLOAD = "UPLOAD"
    RTSP = "RTSP"


class CameraStatus(str, enum.Enum):
    ONLINE = "ONLINE"
    OFFLINE = "OFFLINE"
    ERROR = "ERROR"
    NO_FRAME = "NO_FRAME"
    LOW_FPS = "LOW_FPS"
    PROCESSING = "PROCESSING"


class Camera(UUIDPKMixin, TimestampMixin, Base):
    __tablename__ = "cameras"

    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True
    )
    site_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("sites.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(255))
    description: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    location: Mapped[str | None] = mapped_column(String(255), nullable=True)
    stream_type: Mapped[StreamType] = mapped_column(Enum(StreamType, native_enum=False, validate_strings=True))
    # For RTSP this may contain credentials — never serialize raw to API responses,
    # see app/schemas/camera.py CameraOut which masks it.
    stream_url: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    status: Mapped[CameraStatus] = mapped_column(
        Enum(CameraStatus, native_enum=False, validate_strings=True), default=CameraStatus.OFFLINE
    )
    enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    last_seen_at: Mapped[DateTime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    fps: Mapped[float | None] = mapped_column(Float, nullable=True)
