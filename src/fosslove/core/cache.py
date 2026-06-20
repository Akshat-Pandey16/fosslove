from __future__ import annotations

import time

from redis.asyncio import Redis
from redis.exceptions import RedisError

from fosslove.core.config import Settings
from fosslove.core.logging import get_logger

logger = get_logger(__name__)


async def build_redis(settings: Settings) -> Redis | None:
    if not settings.redis_dsn:
        return None
    client: Redis = Redis.from_url(
        settings.redis_dsn,
        decode_responses=True,
        socket_connect_timeout=2,
        socket_timeout=2,
        health_check_interval=30,
    )
    try:
        await client.ping()
    except (RedisError, OSError) as exc:
        logger.warning("redis_unavailable", error=str(exc))
        await client.aclose()
        return None
    return client


class Cache:
    def __init__(self, redis_client: Redis | None) -> None:
        self._redis = redis_client
        self._local: dict[str, tuple[float, str]] = {}

    @property
    def backend(self) -> str:
        return "redis" if self._redis is not None else "memory"

    async def get(self, key: str) -> str | None:
        if self._redis is not None:
            try:
                value: str | None = await self._redis.get(key)
                return value
            except RedisError as exc:
                logger.warning("cache_get_failed", key=key, error=str(exc))
                return None
        entry = self._local.get(key)
        if entry is None:
            return None
        expires_at, value = entry
        if expires_at < time.monotonic():
            self._local.pop(key, None)
            return None
        return value

    async def set(self, key: str, value: str, ttl_seconds: int) -> None:
        if self._redis is not None:
            try:
                await self._redis.set(key, value, ex=ttl_seconds)
            except RedisError as exc:
                logger.warning("cache_set_failed", key=key, error=str(exc))
            return
        self._local[key] = (time.monotonic() + ttl_seconds, value)

    async def delete(self, *keys: str) -> None:
        if not keys:
            return
        if self._redis is not None:
            try:
                await self._redis.delete(*keys)
            except RedisError as exc:
                logger.warning("cache_delete_failed", error=str(exc))
            return
        for key in keys:
            self._local.pop(key, None)

    async def delete_prefix(self, prefix: str) -> None:
        if self._redis is not None:
            try:
                async for key in self._redis.scan_iter(match=f"{prefix}*", count=200):
                    await self._redis.delete(key)
            except RedisError as exc:
                logger.warning("cache_delete_prefix_failed", error=str(exc))
            return
        for key in [k for k in self._local if k.startswith(prefix)]:
            self._local.pop(key, None)

    async def close(self) -> None:
        if self._redis is not None:
            await self._redis.aclose()
