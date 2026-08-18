from __future__ import annotations

import os

os.environ.setdefault("ENV", "test")
os.environ.setdefault("JWT_SECRET", "test-secret-not-for-production")
os.environ.setdefault("SERVICE_API_KEY", "test-service-key-not-for-production")
