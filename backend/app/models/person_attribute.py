import uuid

from sqlalchemy import Float, ForeignKey, String
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.base import UUIDPKMixin


class PersonAttribute(UUIDPKMixin, Base):
    """Probabilistic visual observations about a person track at a point in
    time. Every attribute carries a confidence score — never presented as a
    certain fact (e.g. "red upper clothing detected", not "wearing a red shirt").
    """

    __tablename__ = "person_attributes"

    person_track_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("person_tracks.id", ondelete="CASCADE"), nullable=False, index=True
    )
    timestamp: Mapped[float] = mapped_column(Float)
    upper_color: Mapped[str | None] = mapped_column(String(32), nullable=True)
    lower_color: Mapped[str | None] = mapped_column(String(32), nullable=True)
    clothing_type: Mapped[str | None] = mapped_column(String(64), nullable=True)
    carrying_object: Mapped[bool | None] = mapped_column(nullable=True)
    direction: Mapped[str | None] = mapped_column(String(32), nullable=True)  # entering | exiting | stationary
    zone_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("zones.id", ondelete="SET NULL"), nullable=True
    )
    confidence: Mapped[float] = mapped_column(Float)
    attribute_metadata: Mapped[dict] = mapped_column(JSONB, default=dict)
