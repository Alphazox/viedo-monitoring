"""Import every model so Base.metadata is complete for Alembic autogenerate.

Note: AuditLog, Event, Incident, IncidentMedia, InvestigationQuery,
Notification, and SearchResult are planned (see docs/HLD references) but not
yet implemented — a follow-up round covering audit log / investigation
search / notifications should add them here.
"""
from app.models.camera import Camera
from app.models.organization import Organization
from app.models.person_attribute import PersonAttribute
from app.models.person_track import PersonTrack
from app.models.site import Site
from app.models.user import User
from app.models.video_asset import VideoAsset
from app.models.video_frame import VideoFrame
from app.models.zone import Zone

__all__ = [
    "Camera",
    "Organization",
    "PersonAttribute",
    "PersonTrack",
    "Site",
    "User",
    "VideoAsset",
    "VideoFrame",
    "Zone",
]
