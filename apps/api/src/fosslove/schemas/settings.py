from __future__ import annotations

from typing import Literal

from limits import parse
from pydantic import BaseModel, EmailStr, Field, field_validator

from fosslove.schemas.common import StrictModel


class SettingsRead(BaseModel):
    registration_enabled: bool
    email_enabled: bool
    rate_limit_enabled: bool
    rate_limit_default: str
    rate_limit_auth: str
    email_backend: Literal["console", "smtp"]
    email_from: str
    smtp_host: str
    smtp_port: int
    smtp_user: str
    smtp_password_set: bool
    smtp_use_tls: bool
    project_name: str
    frontend_base_url: str


class SettingsUpdate(StrictModel):
    registration_enabled: bool | None = None
    email_enabled: bool | None = None
    rate_limit_enabled: bool | None = None
    rate_limit_default: str | None = Field(default=None, min_length=1, max_length=50)
    rate_limit_auth: str | None = Field(default=None, min_length=1, max_length=50)
    email_backend: Literal["console", "smtp"] | None = None
    email_from: EmailStr | None = None
    smtp_host: str | None = Field(default=None, max_length=255)
    smtp_port: int | None = Field(default=None, ge=1, le=65535)
    smtp_user: str | None = Field(default=None, max_length=255)
    smtp_password: str | None = Field(default=None, max_length=500)
    smtp_use_tls: bool | None = None
    project_name: str | None = Field(default=None, min_length=1, max_length=100)
    frontend_base_url: str | None = Field(default=None, min_length=1, max_length=500)

    @field_validator("rate_limit_default", "rate_limit_auth")
    @classmethod
    def _valid_rate(cls, value: str | None) -> str | None:
        if value is not None:
            parse(value)
        return value
