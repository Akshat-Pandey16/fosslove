from __future__ import annotations

import re
from typing import Any

from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _

HAS_LETTER = re.compile(r"[A-Za-z]")
HAS_DIGIT = re.compile(r"\d")


class LetterAndDigitValidator:
    def validate(self, password: str, user: Any = None) -> None:
        if not HAS_LETTER.search(password) or not HAS_DIGIT.search(password):
            raise ValidationError(
                _("Password must contain at least one letter and one digit."),
                code="password_no_letter_or_digit",
            )

    def get_help_text(self) -> str:
        return str(_("Your password must contain at least one letter and one digit."))
