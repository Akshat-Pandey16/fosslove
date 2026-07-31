from __future__ import annotations

from typing import Any

from django.core.cache import cache

CATALOG_VERSION_KEY = "catalog:version"
CATALOG_TTL_SECONDS = 60


def catalog_version() -> int:
    version = cache.get(CATALOG_VERSION_KEY)
    if version is None:
        cache.set(CATALOG_VERSION_KEY, 1, None)
        return 1
    return int(version)


def bump_catalog_version() -> None:
    try:
        cache.incr(CATALOG_VERSION_KEY)
    except ValueError:
        cache.set(CATALOG_VERSION_KEY, 1, None)


def catalog_cache_key(*parts: Any) -> str:
    joined = ":".join("" if part is None else str(part) for part in parts)
    return f"catalog:{catalog_version()}:{joined}"
