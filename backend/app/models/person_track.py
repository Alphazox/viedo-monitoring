import uuid

from sqlalchemy import Float, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.base import TimestampMixin, UUIDPKMixin


class PersonTrack(UUIDPKMixin, TimestampMixin, Base):
    """A single person's trajectory within one video/camera session.

    `tracking_id` is a TEMPORARY technical identifier assigned by the tracker
    (e.g. "Person #182") — it is NOT a real-world identity and must never be
    presented to users as one. No face recognition is performed in this MVP.
    """

    __tablename__ = "person_tracks"

    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True
    )
    video_asset_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("video_assets.id", ondelete="CASCADE"), nullable=True, index=True
    )
    camera_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("cameras.id", ondelete="CASCADE"), nullable=False, index=True
    )
    tracking_id: Mapped[int] = mapped_column(Integer)
    start_time: Mapped[float] = mapped_column(Float)
    end_time: Mapped[float] = mapped_column(Float)
    start_frame: Mapped[int] = mapped_column(Integer)
    end_frame: Mapped[int] = mapped_column(Integer)
    # [{"t": 1.2, "cx": 0.4, "cy": 0.6, "bbox": [x1,y1,x2,y2]}, ...]
    trajectory: Mapped[list] = mapped_column(JSONB, default=list)
    snapshot_path: Mapped[str | None] = mapped_column(String(1000), nullable=True)
