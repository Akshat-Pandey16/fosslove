from __future__ import annotations

from slugify import slugify


def make_slug(value: str, *, max_length: int = 120) -> str:
    return slugify(value, max_length=max_length) or "item"
