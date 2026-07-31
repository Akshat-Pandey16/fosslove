from __future__ import annotations

from typing import Any

from django.db.models import Model, Q, QuerySet
from django.utils.text import slugify


def unique_slug(
    queryset: QuerySet[Any],
    value: str,
    *,
    field: str = "slug",
    max_length: int = 120,
    exclude_pk: Any = None,
    scope: dict[str, Any] | None = None,
) -> str:
    base = slugify(value)[:max_length] or "item"
    candidate = base
    suffix = 2
    lookups = dict(scope or {})
    while True:
        query = queryset.filter(Q(**{field: candidate}), **lookups)
        if exclude_pk is not None:
            query = query.exclude(pk=exclude_pk)
        if not query.exists():
            return candidate
        tail = f"-{suffix}"
        candidate = f"{base[: max_length - len(tail)]}{tail}"
        suffix += 1


def model_unique_slug(model: type[Model], value: str, **kwargs: Any) -> str:
    return unique_slug(model._default_manager.all(), value, **kwargs)
