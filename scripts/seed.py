"""Idempotent demo-data seeder: creates a demo Organization, one ADMIN User,
a Site, and a few Cameras so the dashboard isn't empty on first login.

Run from the repo root: `python scripts/seed.py` (with backend/requirements
installed) or `python backend/../scripts/seed.py` from anywhere — this file
adds `backend/` to sys.path itself so it's self-locating.
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

_BACKEND_DIR = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(_BACKEND_DIR))

from app.core.config import get_settings  # noqa: E402
from app.core.database import SessionLocal  # noqa: E402
from app.core.security import hash_password  # noqa: E402
from app.models.camera import Camera, CameraStatus, StreamType  # noqa: E402
from app.models.organization import Organization  # noqa: E402
from app.models.site import Site  # noqa: E402
from app.models.user import User, UserRole  # noqa: E402


def _slugify(name: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
    return slug or "org"


def main() -> None:
    settings = get_settings()
    db = SessionLocal()
    created: list[str] = []
    found: list[str] = []

    try:
        org = db.query(Organization).filter(Organization.name == settings.SEED_ORG_NAME).first()
        if org is None:
            org = Organization(name=settings.SEED_ORG_NAME, slug=_slugify(settings.SEED_ORG_NAME), is_demo=True)
            db.add(org)
            db.flush()
            created.append(f"organization '{org.name}'")
        else:
            found.append(f"organization '{org.name}'")

        admin = (
            db.query(User)
            .filter(User.organization_id == org.id, User.email == settings.SEED_ADMIN_EMAIL)
            .first()
        )
        if admin is None:
            admin = User(
                organization_id=org.id,
                email=settings.SEED_ADMIN_EMAIL,
                password_hash=hash_password(settings.SEED_ADMIN_PASSWORD),
                full_name="Demo Admin",
                role=UserRole.ADMIN,
            )
            db.add(admin)
            db.flush()
            created.append(f"admin user '{admin.email}'")
        else:
            found.append(f"admin user '{admin.email}'")

        site = db.query(Site).filter(Site.organization_id == org.id, Site.name == "Main Site").first()
        if site is None:
            site = Site(organization_id=org.id, name="Main Site", timezone="UTC")
            db.add(site)
            db.flush()
            created.append(f"site '{site.name}'")
        else:
            found.append(f"site '{site.name}'")

        demo_cameras = [
            ("Front Entrance", CameraStatus.ONLINE),
            ("Loading Dock", CameraStatus.ONLINE),
            ("Parking Lot A", CameraStatus.OFFLINE),
        ]
        for name, status in demo_cameras:
            existing = (
                db.query(Camera)
                .filter(Camera.organization_id == org.id, Camera.site_id == site.id, Camera.name == name)
                .first()
            )
            if existing is None:
                camera = Camera(
                    organization_id=org.id,
                    site_id=site.id,
                    name=name,
                    stream_type=StreamType.UPLOAD,
                    status=status,
                    enabled=True,
                )
                db.add(camera)
                created.append(f"camera '{name}'")
            else:
                found.append(f"camera '{name}'")

        db.commit()
    finally:
        db.close()

    print("Seed complete.")
    if created:
        print("  created:", ", ".join(created))
    if found:
        print("  already present:", ", ".join(found))
    print(f"\nLogin with: {settings.SEED_ADMIN_EMAIL} / {settings.SEED_ADMIN_PASSWORD}")


if __name__ == "__main__":
    main()
