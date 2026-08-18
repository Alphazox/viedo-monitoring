from __future__ import annotations

import os
import tempfile
from datetime import UTC, datetime, timedelta

os.environ.setdefault("ENV", "test")
os.environ.setdefault("JWT_SECRET", "test-secret-not-for-production")
os.environ.setdefault("SERVICE_API_KEY", "test-service-key-not-for-production")
os.environ.setdefault("DEMO_DATA_DIR", os.path.join(tempfile.mkdtemp(prefix="ai-engine-test-"), "data"))

import jwt
import pytest
from fastapi.testclient import TestClient

from inference.config import get_settings
from inference.main import app

settings = get_settings()


@pytest.fixture()
def client() -> TestClient:
    with TestClient(app) as c:
        yield c


@pytest.fixture()
def access_token() -> str:
    now = datetime.now(UTC)
    payload = {
        "sub": "00000000-0000-0000-0000-000000000001",
        "organization_id": "00000000-0000-0000-0000-000000000002",
        "role": "ADMIN",
        "email": "admin@example.com",
        "type": "access",
        "iat": now,
        "exp": now + timedelta(minutes=15),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


@pytest.fixture()
def auth_headers(access_token) -> dict[str, str]:
    return {"Authorization": f"Bearer {access_token}"}


@pytest.fixture()
def service_headers() -> dict[str, str]:
    return {"X-Service-Key": settings.service_api_key}
