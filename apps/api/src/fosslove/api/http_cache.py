from __future__ import annotations

import hashlib
from collections.abc import Awaitable, Callable

from fastapi import Request, Response
from pydantic import BaseModel

from fosslove.core.cache import Cache

CATALOG_PREFIX = "catalog:"
_CACHE_CONTROL = "public, max-age=60, stale-while-revalidate=120"


def _etag(body: str) -> str:
    return '"' + hashlib.sha256(body.encode("utf-8")).hexdigest()[:32] + '"'


async def cached_json(
    request: Request,
    cache: Cache,
    key: str,
    produce: Callable[[], Awaitable[BaseModel]],
    *,
    ttl: int = 60,
) -> Response:
    body = await cache.get(key)
    if body is None:
        model = await produce()
        body = model.model_dump_json()
        await cache.set(key, body, ttl)
    etag = _etag(body)
    headers = {"Cache-Control": _CACHE_CONTROL, "ETag": etag, "Vary": "Accept-Encoding"}
    if request.headers.get("if-none-match") == etag:
        return Response(status_code=304, headers=headers)
    return Response(content=body, media_type="application/json", headers=headers)
