import uuid

from sqlalchemy import Float, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.base import UUIDPKMixin


class VideoFrame(UUIDPKMixin, Base):
    """Sparse, sampled-frame metadata (not every decoded frame) — enough to
    replay what the AI pipeline saw at a given video timestamp without
    storing every frame as an image."""

    __tablename__ = "video_frames"

    video_asset_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("video_assets.id", ondelete="CASCADE"), nullable=False, index=True
    )
    camera_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("cameras.id"), nullable=False)
    frame_index: Mapped[int] = mapped_column(Integer)
    video_timestamp_seconds: Mapped[float] = mapped_column(Float)
    frame_path: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    detection_count: Mapped[int] = mapped_column(Integer, default=0)
