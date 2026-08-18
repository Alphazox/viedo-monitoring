from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel

from app.models.user import UserRole


class UserOut(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    is_active: bool
    created_at: datetime


class UserCreate(BaseModel):
    email: str
    password: str
    full_name: str
    role: UserRole = UserRole.VIEWER


class UserListResponse(BaseModel):
    items: list[UserOut]
    total: int
