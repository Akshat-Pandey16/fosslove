from __future__ import annotations

import uuid
from typing import Any

from django.contrib.auth.tokens import PasswordResetTokenGenerator, default_token_generator
from django.core import signing
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode

from fosslove.accounts.models import User

EMAIL_CHANGE_SALT = "fosslove.accounts.email-change"


class EmailVerificationTokenGenerator(PasswordResetTokenGenerator):
    key_salt = "fosslove.accounts.EmailVerificationTokenGenerator"

    def _make_hash_value(self, user: Any, timestamp: int) -> str:
        return f"{user.pk}{timestamp}{user.is_verified}{user.email}"


email_verification_token = EmailVerificationTokenGenerator()
password_reset_token = default_token_generator


def encode_uid(user: User) -> str:
    return urlsafe_base64_encode(force_bytes(user.pk))


def user_from_uid(uidb64: str) -> User | None:
    try:
        primary_key = uuid.UUID(urlsafe_base64_decode(uidb64).decode())
    except (ValueError, TypeError, OverflowError, UnicodeDecodeError):
        return None
    return User.objects.filter(pk=primary_key).first()


def make_email_change_token(user: User, new_email: str) -> str:
    return signing.dumps(
        {"uid": str(user.pk), "current": user.email, "new": new_email},
        salt=EMAIL_CHANGE_SALT,
    )


def read_email_change_token(token: str, max_age: int) -> tuple[User, str] | None:
    try:
        payload = signing.loads(token, salt=EMAIL_CHANGE_SALT, max_age=max_age)
    except signing.BadSignature:
        return None
    user = User.objects.filter(pk=payload.get("uid")).first()
    if user is None or user.email != payload.get("current"):
        return None
    return user, str(payload["new"])
