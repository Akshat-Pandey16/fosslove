from __future__ import annotations

from django.core.validators import RegexValidator

RATE_LIMIT_PATTERN = r"^\d+/(second|minute|hour|day)$"

rate_limit_validator = RegexValidator(
    regex=RATE_LIMIT_PATTERN,
    message="Rate limits must look like '200/minute'.",
    code="invalid_rate_limit",
)
