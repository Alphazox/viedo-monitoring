from __future__ import annotations

import hmac
import uuid
from collections.abc import Callable

from fastapi import Depends, Header, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.database import get_db
from app.core.security import TokenError, decode_token
from app.models.user import User

_bearer_scheme = HTTPBearer(auto_error=True)
_settings = get_settings()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    try:
        payload = decode_token(credentials.credentials, expected_type="access")
        user_id = uuid.UUID(payload["sub"])
    except (TokenError, ValueError, KeyError) as exc:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or expired token") from exc

    user = db.get(User, user_id)
    if user is None or not user.is_active:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or expired token")
    return user


def require_role(*roles: str) -> Callable[[User], User]:
    def _check(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role.value not in roles:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Insufficient permissions")
        return current_user

    return _check


def require_service_key(x_service_key: str | None = Header(default=None)) -> None:
    """Gate for internal, service-to-service calls (video-engine -> backend),
    distinct from get_current_user: there is no logged-in human on this path."""
    if not x_service_key or not hmac.compare_digest(x_service_key, _settings.SERVICE_API_KEY):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or missing service key")
