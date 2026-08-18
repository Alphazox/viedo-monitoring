"""initial schema

Revision ID: 0001_initial_schema
Revises:
Create Date: 2026-08-12

"""
from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB, UUID

from alembic import op

revision: str = "0001_initial_schema"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def _timestamps() -> list[sa.Column]:
    return [
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    ]


def upgrade() -> None:
    op.create_table(
        "organizations",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(), nullable=False, unique=True),
        sa.Column("slug", sa.String(), nullable=False, unique=True),
        sa.Column("is_demo", sa.Boolean(), nullable=False, server_default=sa.false()),
        *_timestamps(),
    )
    op.create_index("ix_organizations_slug", "organizations", ["slug"])

    op.create_table(
        "users",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "organization_id", UUID(as_uuid=True), sa.ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False
        ),
        sa.Column("email", sa.String(320), nullable=False),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("full_name", sa.String(255), nullable=False),
        sa.Column(
            "role",
            sa.Enum("ADMIN", "SECURITY_OPERATOR", "VIEWER", name="user_role", native_enum=False),
            nullable=False,
        ),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        *_timestamps(),
    )
    op.create_index("ix_users_organization_id", "users", ["organization_id"])
    op.create_index("ix_users_email", "users", ["email"])

    op.create_table(
        "sites",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "organization_id", UUID(as_uuid=True), sa.ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False
        ),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("address", sa.String(500), nullable=True),
        sa.Column("timezone", sa.String(64), nullable=False, server_default="UTC"),
        *_timestamps(),
    )
    op.create_index("ix_sites_organization_id", "sites", ["organization_id"])

    op.create_table(
        "cameras",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "organization_id", UUID(as_uuid=True), sa.ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False
        ),
        sa.Column("site_id", UUID(as_uuid=True), sa.ForeignKey("sites.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("description", sa.String(1000), nullable=True),
        sa.Column("location", sa.String(255), nullable=True),
        sa.Column(
            "stream_type", sa.Enum("UPLOAD", "RTSP", name="stream_type", native_enum=False), nullable=False
        ),
        sa.Column("stream_url", sa.String(1000), nullable=True),
        sa.Column(
            "status",
            sa.Enum(
                "ONLINE", "OFFLINE", "ERROR", "NO_FRAME", "LOW_FPS", "PROCESSING", name="camera_status", native_enum=False
            ),
            nullable=False,
            server_default="OFFLINE",
        ),
        sa.Column("enabled", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("last_seen_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("fps", sa.Float(), nullable=True),
        *_timestamps(),
    )
    op.create_index("ix_cameras_organization_id", "cameras", ["organization_id"])
    op.create_index("ix_cameras_site_id", "cameras", ["site_id"])

    op.create_table(
        "zones",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "organization_id", UUID(as_uuid=True), sa.ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False
        ),
        sa.Column("site_id", UUID(as_uuid=True), sa.ForeignKey("sites.id", ondelete="CASCADE"), nullable=False),
        sa.Column("camera_id", UUID(as_uuid=True), sa.ForeignKey("cameras.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column(
            "type",
            sa.Enum(
                "RESTRICTED", "MONITORING", "ENTRY", "EXIT", "RECEPTION", "GATE", name="zone_type", native_enum=False
            ),
            nullable=False,
        ),
        sa.Column("polygon", JSONB, nullable=False),
        sa.Column("enabled", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("rules", JSONB, nullable=False, server_default="{}"),
        *_timestamps(),
    )
    op.create_index("ix_zones_organization_id", "zones", ["organization_id"])
    op.create_index("ix_zones_site_id", "zones", ["site_id"])
    op.create_index("ix_zones_camera_id", "zones", ["camera_id"])

    op.create_table(
        "video_assets",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "organization_id", UUID(as_uuid=True), sa.ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False
        ),
        sa.Column("site_id", UUID(as_uuid=True), sa.ForeignKey("sites.id", ondelete="CASCADE"), nullable=False),
        sa.Column("camera_id", UUID(as_uuid=True), sa.ForeignKey("cameras.id", ondelete="CASCADE"), nullable=False),
        sa.Column("uploaded_by", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("original_filename", sa.String(500), nullable=False),
        sa.Column("file_path", sa.String(1000), nullable=False),
        sa.Column("duration_seconds", sa.Float(), nullable=True),
        sa.Column("fps", sa.Float(), nullable=True),
        sa.Column("width", sa.Integer(), nullable=True),
        sa.Column("height", sa.Integer(), nullable=True),
        sa.Column("status", sa.String(20), nullable=False, server_default="UPLOADED"),
        sa.Column("error_message", sa.String(2000), nullable=True),
        *_timestamps(),
    )
    op.create_index("ix_video_assets_organization_id", "video_assets", ["organization_id"])
    op.create_index("ix_video_assets_site_id", "video_assets", ["site_id"])
    op.create_index("ix_video_assets_camera_id", "video_assets", ["camera_id"])

    op.create_table(
        "video_frames",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "video_asset_id", UUID(as_uuid=True), sa.ForeignKey("video_assets.id", ondelete="CASCADE"), nullable=False
        ),
        sa.Column("camera_id", UUID(as_uuid=True), sa.ForeignKey("cameras.id"), nullable=False),
        sa.Column("frame_index", sa.Integer(), nullable=False),
        sa.Column("video_timestamp_seconds", sa.Float(), nullable=False),
        sa.Column("frame_path", sa.String(1000), nullable=True),
        sa.Column("detection_count", sa.Integer(), nullable=False, server_default="0"),
    )
    op.create_index("ix_video_frames_video_asset_id", "video_frames", ["video_asset_id"])

    op.create_table(
        "person_tracks",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "organization_id", UUID(as_uuid=True), sa.ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False
        ),
        sa.Column(
            "video_asset_id", UUID(as_uuid=True), sa.ForeignKey("video_assets.id", ondelete="CASCADE"), nullable=True
        ),
        sa.Column("camera_id", UUID(as_uuid=True), sa.ForeignKey("cameras.id", ondelete="CASCADE"), nullable=False),
        sa.Column("tracking_id", sa.Integer(), nullable=False),
        sa.Column("start_time", sa.Float(), nullable=False),
        sa.Column("end_time", sa.Float(), nullable=False),
        sa.Column("start_frame", sa.Integer(), nullable=False),
        sa.Column("end_frame", sa.Integer(), nullable=False),
        sa.Column("trajectory", JSONB, nullable=False, server_default="[]"),
        sa.Column("snapshot_path", sa.String(1000), nullable=True),
        *_timestamps(),
    )
    op.create_index("ix_person_tracks_organization_id", "person_tracks", ["organization_id"])
    op.create_index("ix_person_tracks_video_asset_id", "person_tracks", ["video_asset_id"])
    op.create_index("ix_person_tracks_camera_id", "person_tracks", ["camera_id"])

    op.create_table(
        "person_attributes",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "person_track_id", UUID(as_uuid=True), sa.ForeignKey("person_tracks.id", ondelete="CASCADE"), nullable=False
        ),
        sa.Column("timestamp", sa.Float(), nullable=False),
        sa.Column("upper_color", sa.String(32), nullable=True),
        sa.Column("lower_color", sa.String(32), nullable=True),
        sa.Column("clothing_type", sa.String(64), nullable=True),
        sa.Column("carrying_object", sa.Boolean(), nullable=True),
        sa.Column("direction", sa.String(32), nullable=True),
        sa.Column("zone_id", UUID(as_uuid=True), sa.ForeignKey("zones.id", ondelete="SET NULL"), nullable=True),
        sa.Column("confidence", sa.Float(), nullable=False),
        sa.Column("attribute_metadata", JSONB, nullable=False, server_default="{}"),
    )
    op.create_index("ix_person_attributes_person_track_id", "person_attributes", ["person_track_id"])


def downgrade() -> None:
    op.drop_table("person_attributes")
    op.drop_table("person_tracks")
    op.drop_table("video_frames")
    op.drop_table("video_assets")
    op.drop_table("zones")
    op.drop_table("cameras")
    op.drop_table("sites")
    op.drop_table("users")
    op.drop_table("organizations")
