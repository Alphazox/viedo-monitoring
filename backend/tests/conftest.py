"""Test fixtures. Requires a real Postgres reachable at TEST_DATABASE_URL —
the models use Postgres-only column types (UUID, JSONB), so sqlite can't
stand in. In docker-compose, point this at the `postgres` service with a
separate database name; in CI, a postgres service container.
"""
from __future__ import annotations

import os
import uuid

os.environ.setdefault(
    "DATABASE_URL",
    os.environ.get(
        "TEST_DATABASE_URL",
        "postgresql+psycopg://aegisvision:change-me-in-dev@localhost:5432/aegisvision_test",
    ),
)
os.environ.setdefault("ENV", "test")
os.environ.setdefault("JWT_SECRET", "test-secret-not-for-production")
os.environ.setdefault("SERVICE_API_KEY", "test-service-key-not-for-production")
os.environ.setdefault("SEED_ADMIN_PASSWORD", "test-admin-password")

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import get_settings
from app.core.database import Base, get_db
from app.core.security import hash_password
from app.main import app
from app.models.organization import Organization
from app.models.site import Site
from app.models.user import User, UserRole

settings = get_settings()


@pytest.fixture(scope="session")
def engine():
    eng = create_engine(settings.DATABASE_URL, future=True)
    Base.metadata.create_all(eng)
    yield eng
    Base.metadata.drop_all(eng)
    eng.dispose()


@pytest.fixture()
def db_session(engine) -> Session:
    connection = engine.connect()
    transaction = connection.begin()
    TestSession = sessionmaker(bind=connection, autoflush=False, autocommit=False, future=True)
    session = TestSession()
    try:
        yield session
    finally:
        session.close()
        transaction.rollback()
        connection.close()


@pytest.fixture()
def client(db_session):
    def _override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = _override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture()
def org(db_session) -> Organization:
    o = Organization(name=f"Test Org {uuid.uuid4().hex[:8]}", slug=f"test-org-{uuid.uuid4().hex[:8]}")
    db_session.add(o)
    db_session.flush()
    return o


@pytest.fixture()
def site(db_session, org) -> Site:
    s = Site(organization_id=org.id, name="Main Site")
    db_session.add(s)
    db_session.flush()
    return s


@pytest.fixture()
def user_password() -> str:
    return "correct-horse-battery-staple"


@pytest.fixture()
def user(db_session, org, user_password) -> User:
    u = User(
        organization_id=org.id,
        email="admin@example.com",
        password_hash=hash_password(user_password),
        full_name="Test Admin",
        role=UserRole.ADMIN,
    )
    db_session.add(u)
    db_session.flush()
    db_session.commit()
    return u


@pytest.fixture()
def other_org_camera(db_session):
    from app.models.camera import Camera, StreamType

    other_org = Organization(name=f"Other Org {uuid.uuid4().hex[:8]}", slug=f"other-org-{uuid.uuid4().hex[:8]}")
    db_session.add(other_org)
    db_session.flush()
    other_site = Site(organization_id=other_org.id, name="Other Site")
    db_session.add(other_site)
    db_session.flush()
    cam = Camera(
        organization_id=other_org.id,
        site_id=other_site.id,
        name="Other Org Camera",
        stream_type=StreamType.UPLOAD,
    )
    db_session.add(cam)
    db_session.flush()
    db_session.commit()
    return cam
