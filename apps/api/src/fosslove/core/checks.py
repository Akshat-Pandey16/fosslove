from __future__ import annotations

from typing import Any

from django.conf import settings
from django.core.checks import Error, register

DEFAULT_DB_CREDENTIAL = "fosslove"


@register("fosslove")
def production_safety(app_configs: Any, **kwargs: Any) -> list[Error]:
    if not settings.IS_PRODUCTION:
        return []

    errors: list[Error] = []
    secret = settings.SECRET_KEY

    if secret == settings.PLACEHOLDER_SECRET:
        errors.append(Error("FOSSLOVE_SECRET_KEY is the placeholder value.", id="fosslove.E001"))
    if len(secret) < settings.MIN_SECRET_LENGTH:
        errors.append(
            Error(
                f"FOSSLOVE_SECRET_KEY must be at least {settings.MIN_SECRET_LENGTH} characters.",
                id="fosslove.E002",
            )
        )
    if settings.DEBUG:
        errors.append(Error("FOSSLOVE_DEBUG must be false in production.", id="fosslove.E003"))
    if "*" in settings.ALLOWED_HOSTS:
        errors.append(Error("FOSSLOVE_ALLOWED_HOSTS must not contain '*'.", id="fosslove.E004"))
    if settings.DATABASES["default"]["PASSWORD"] == DEFAULT_DB_CREDENTIAL:
        errors.append(
            Error("FOSSLOVE_POSTGRES_PASSWORD must not be the default.", id="fosslove.E005")
        )
    if settings.EMAIL_ENABLED:
        if settings.EMAIL_BACKEND_NAME != "smtp":
            errors.append(
                Error("FOSSLOVE_EMAIL_BACKEND must be 'smtp' in production.", id="fosslove.E006")
            )
        if not settings.EMAIL_HOST:
            errors.append(Error("FOSSLOVE_SMTP_HOST is required.", id="fosslove.E007"))
        if not settings.EMAIL_USE_TLS:
            errors.append(Error("FOSSLOVE_SMTP_USE_TLS must be true.", id="fosslove.E008"))
        if not settings.FRONTEND_BASE_URL.startswith("https://"):
            errors.append(
                Error("FOSSLOVE_FRONTEND_BASE_URL must use https://.", id="fosslove.E009")
            )
    if settings.REFRESH_TOKEN_TTL_SECONDS <= settings.ACCESS_TOKEN_TTL_SECONDS:
        errors.append(
            Error(
                "FOSSLOVE_REFRESH_TOKEN_TTL_SECONDS must exceed the access token TTL.",
                id="fosslove.E010",
            )
        )
    return errors
