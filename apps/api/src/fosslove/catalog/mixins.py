from __future__ import annotations

from collections.abc import Callable
from typing import Any

from django.core.cache import cache
from django.utils.cache import patch_cache_control
from rest_framework.response import Response

from fosslove.core.cache import CATALOG_TTL_SECONDS, catalog_cache_key


class CatalogCacheMixin:
    cache_ttl: int = CATALOG_TTL_SECONDS

    def cached_response(self, parts: list[Any], produce: Callable[[], Any]) -> Response:
        key = catalog_cache_key(*parts)
        payload = cache.get(key)
        if payload is None:
            payload = produce()
            cache.set(key, payload, self.cache_ttl)
        response = Response(payload)
        patch_cache_control(response, public=True, max_age=self.cache_ttl)
        return response
