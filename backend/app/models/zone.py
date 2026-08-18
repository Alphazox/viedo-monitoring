import enum
import uuid

from sqlalchemy import Boolean, Enum, ForeignKey, String
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.base import TimestampMixin, UUIDPKMixin


class ZoneType(str, enum.Enum):
    RESTRICTED = "RESTRICTED"
    MONITORING = "MONITORING"
    ENTRY = "ENTRY"
    EXIT = "EXIT"
    RECEPTION = "RECEPTION"
    GATE = "GATE"


class Zone(UUIDPKMixin, TimestampMixin, Base):
    __tablename__ = "zones"

    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True
    )
    site_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("sites.id", ondelete="CASCADE"), nullable=False, index=True
    )
    camera_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("cameras.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(255))
    type: Mapped[ZoneType] = mapped_column(Enum(ZoneType, native_enum=False, validate_strings=True))
    # Normalized polygon: [{"x": 0.2, "y": 0.15}, ...] in 0..1 image-fraction coords.
    polygon: Mapped[list] = mapped_column(JSONB)
    enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    # Per-zone rule overrides, e.g. {"loitering_threshold_seconds": 45}
    rules: Mapped[dict] = mapped_column(JSONB, default=dict)
