from __future__ import annotations

import re

from pydantic import EmailStr, Field, field_validator

from fosslove.schemas.common import StrictModel

PASSWORD_MIN_LENGTH = 8
PASSWORD_MAX_LENGTH = 128
_HAS_LETTER = re.compile(r"[A-Za-z]")
_HAS_DIGIT = re.compile(r"\d")


def _validate_password(value: str) -> str:
    if not _HAS_LETTER.search(value) or not _HAS_DIGIT.search(value):
        raise ValueError("Password must contain at least one letter and one digit")
    return value


def _normalize_email(value: str) -> str:
    return value.strip().lower()


class RegisterRequest(StrictModel):
    email: EmailStr
    password: str = Field(min_length=PASSWORD_MIN_LENGTH, max_length=PASSWORD_MAX_LENGTH)
    full_name: str | None = Field(default=None, max_length=200)

    _check_password = field_validator("password")(_validate_password)

    @field_validator("email")
    @classmethod
    def _email(cls, value: str) -> str:
        return _normalize_email(value)

    @field_validator("full_name")
    @classmethod
    def _name(cls, value: str | None) -> str | None:
        return value.strip() if value else None


class LoginRequest(StrictModel):
    email: EmailStr
    password: str

    @field_validator("email")
    @classmethod
    def _email(cls, value: str) -> str:
        return _normalize_email(value)


class TokenPair(StrictModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


class RefreshRequest(StrictModel):
    refresh_token: str


class LogoutRequest(StrictModel):
    refresh_token: str


class VerifyEmailRequest(StrictModel):
    token: str


class EmailRequest(StrictModel):
    email: EmailStr

    @field_validator("email")
    @classmethod
    def _email(cls, value: str) -> str:
        return _normalize_email(value)


class PasswordResetConfirm(StrictModel):
    token: str
    new_password: str = Field(min_length=PASSWORD_MIN_LENGTH, max_length=PASSWORD_MAX_LENGTH)

    _check_password = field_validator("new_password")(_validate_password)


class ChangePasswordRequest(StrictModel):
    current_password: str
    new_password: str = Field(min_length=PASSWORD_MIN_LENGTH, max_length=PASSWORD_MAX_LENGTH)

    _check_password = field_validator("new_password")(_validate_password)


class EmailChangeRequest(StrictModel):
    new_email: EmailStr

    @field_validator("new_email")
    @classmethod
    def _email(cls, value: str) -> str:
        return _normalize_email(value)


class EmailChangeConfirm(StrictModel):
    token: str
