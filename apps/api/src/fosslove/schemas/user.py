from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any

from pydantic import EmailStr, Field, field_validator

from fosslove.db.models.enums import UserRole
from fosslove.schemas.common import APIModel, StrictModel


class UserRead(APIModel):
    id: uuid.UUID
    email: EmailStr
    full_name: str | None
    role: UserRole
    is_active: bool
    is_verified: bool
    created_at: datetime


class UserUpdate(StrictModel):
    full_name: str | None = Field(default=None, max_length=200)

    @field_validator("full_name")
    @classmethod
    def _name(cls, value: str | None) -> str | None:
        return value.strip() if value else None


class SessionRead(APIModel):
    id: uuid.UUID
    user_agent: str | None
    client_ip: str | None
    created_at: datetime
    last_used_at: datetime | None
    expires_at: datetime


class UserDataExport(APIModel):
    user: UserRead
    collections: list[dict[str, Any]]
    favorites: list[int]
    script_runs: list[dict[str, Any]]
