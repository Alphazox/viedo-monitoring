from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_role
from app.core.database import get_db
from app.core.security import hash_password
from app.models.user import User
from app.schemas.user import UserCreate, UserListResponse, UserOut

router = APIRouter(prefix="/users", tags=["users"])


def _to_out(user: User) -> UserOut:
    return UserOut(
        id=str(user.id),
        email=user.email,
        full_name=user.full_name,
        role=user.role.value,
        is_active=user.is_active,
        created_at=user.created_at,
    )


@router.get("", response_model=UserListResponse)
def list_users(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> UserListResponse:
    users = db.scalars(
        select(User).where(User.organization_id == current_user.organization_id).order_by(User.created_at.desc())
    ).all()
    return UserListResponse(items=[_to_out(u) for u in users], total=len(users))


@router.post("", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def create_user(
    payload: UserCreate,
    current_user: User = Depends(require_role("ADMIN")),
    db: Session = Depends(get_db),
) -> UserOut:
    # Email is globally unique (login has no org selector — see
    # app/models/user.py's ix_users_email_lower_unique), not just per-org.
    existing = db.scalar(select(User).where(func.lower(User.email) == payload.email.lower()))
    if existing is not None:
        raise HTTPException(status.HTTP_409_CONFLICT, "Email already in use")

    user = User(
        organization_id=current_user.organization_id,
        email=payload.email,
        password_hash=hash_password(payload.password),
        full_name=payload.full_name,
        role=payload.role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return _to_out(user)
