"""Auth for the AI engine. Two distinct principals call this service:

- A logged-in human, via the frontend, holding the same JWT access token the
  backend issued (see backend/app/core/security.py) — validated the same way
  here (same JWT_SECRET/algorithm, shared via the root .env in
  docker-compose) so there's no second login system.
- video-engine, an internal service with no human behind it — validated via
  a shared X-Service-Key header instead of a JWT.
"""
from __future__ import annotations

import hmac
from typing import Any

import jwt
from fastapi import Depends, Header, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from inference.config import get_settings

_bearer_scheme = HTTPBearer(auto_error=True)
_settings = get_settings()


def get_current_claims(credentials: HTTPAuthorizationCredentials = Depends(_bearer_scheme)) -> dict[str, Any]:
    try:
        payload = jwt.decode(credentials.credentials, _settings.jwt_secret, algorithms=[_settings.jwt_algorithm])
    except jwt.ExpiredSignatureError as exc:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token has expired") from exc
    except jwt.InvalidTokenError as exc:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or expired token") from exc

    if payload.get("type") != "access":
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Expected an access token")
    return payload


def require_service_key(x_service_key: str | None = Header(default=None)) -> None:
    if not x_service_key or not hmac.compare_digest(x_service_key, _settings.service_api_key):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or missing service key")
