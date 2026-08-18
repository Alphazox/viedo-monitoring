from __future__ import annotations

import uuid

from fastapi import APIRouter, Cookie, Depends, HTTPException, Response, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.config import get_settings
from app.core.database import get_db
from app.core.security import (
    TokenError,
    create_access_token,
    create_refresh_token,
    decode_token,
    verify_password,
)
from app.models.organization import Organization
from app.models.user import User
from app.schemas.auth import LoginRequest, MeResponse, TokenResponse

router = APIRouter(prefix="/auth", tags=["auth"])
settings = get_settings()

_INVALID_CREDENTIALS = HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid email or password")


def _set_refresh_cookie(response: Response, refresh_token: str) -> None:
    response.set_cookie(
        key=settings.REFRESH_COOKIE_NAME,
        value=refresh_token,
        httponly=True,
        secure=settings.REFRESH_COOKIE_SECURE,
        samesite="lax",
        path="/api/v1/auth",
        max_age=settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS * 86400,
    )


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, response: Response, db: Session = Depends(get_db)) -> TokenResponse:
    user = db.scalar(select(User).where(func.lower(User.email) == payload.email.lower()))
    if user is None or not user.is_active or not verify_password(payload.password, user.password_hash):
        raise _INVALID_CREDENTIALS

    _set_refresh_cookie(
        response, create_refresh_token(user_id=str(user.id), organization_id=str(user.organization_id))
    )
    return TokenResponse(
        access_token=create_access_token(
            user_id=str(user.id), organization_id=str(user.organization_id), role=user.role.value, email=user.email
        )
    )


@router.post("/refresh", response_model=TokenResponse)
def refresh(
    response: Response,
    db: Session = Depends(get_db),
    refresh_token: str | None = Cookie(default=None, alias=settings.REFRESH_COOKIE_NAME),
) -> TokenResponse:
    if not refresh_token:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or expired refresh token")
    try:
        claims = decode_token(refresh_token, expected_type="refresh")
        user_id = uuid.UUID(claims["sub"])
    except (TokenError, ValueError, KeyError) as exc:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or expired refresh token") from exc

    user = db.get(User, user_id)
    if user is None or not user.is_active:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or expired refresh token")

    _set_refresh_cookie(
        response, create_refresh_token(user_id=str(user.id), organization_id=str(user.organization_id))
    )
    return TokenResponse(
        access_token=create_access_token(
            user_id=str(user.id), organization_id=str(user.organization_id), role=user.role.value, email=user.email
        )
    )


@router.get("/me", response_model=MeResponse)
def me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> MeResponse:
    organization = db.get(Organization, current_user.organization_id)
    return MeResponse(
        id=str(current_user.id),
        email=current_user.email,
        full_name=current_user.full_name,
        role=current_user.role.value,
        organization_id=str(current_user.organization_id),
        organization_name=organization.name if organization else "",
    )


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT, response_model=None)
def logout(response: Response, current_user: User = Depends(get_current_user)) -> None:
    # Access token is stateless (nothing stored server-side to revoke); the
    # refresh token lives in an httpOnly cookie, so logout must clear it here
    # rather than relying on the client to discard something it can't touch.
    response.delete_cookie(key=settings.REFRESH_COOKIE_NAME, path="/api/v1/auth")
    return None
