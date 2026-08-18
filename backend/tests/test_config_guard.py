from __future__ import annotations

import pytest

from app.core.config import Settings
from app.main import _reject_insecure_production_defaults


def test_rejects_default_jwt_secret_in_production():
    bad = Settings(ENV="production", JWT_SECRET="dev-only-insecure-secret-change-me", SERVICE_API_KEY="real-key")
    with pytest.raises(RuntimeError, match="JWT_SECRET"):
        _reject_insecure_production_defaults(bad)


def test_rejects_default_service_api_key_in_production():
    bad = Settings(
        ENV="production",
        JWT_SECRET="a-real-secret",
        SERVICE_API_KEY="dev-only-insecure-service-key-change-me",
    )
    with pytest.raises(RuntimeError, match="SERVICE_API_KEY"):
        _reject_insecure_production_defaults(bad)


def test_allows_real_secrets_in_production():
    good = Settings(
        ENV="production",
        JWT_SECRET="a-real-randomly-generated-secret",
        SEED_ADMIN_PASSWORD="a-real-admin-password",
        SERVICE_API_KEY="a-real-service-key",
    )
    _reject_insecure_production_defaults(good)  # must not raise


def test_dev_environment_is_never_blocked_by_default_secrets():
    dev = Settings(ENV="development")
    _reject_insecure_production_defaults(dev)  # must not raise
