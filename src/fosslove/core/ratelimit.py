from __future__ import annotations

import time
from dataclasses import dataclass

from limits import RateLimitItem, parse
from redis.asyncio import Redis
from redis.exceptions import RedisError

from fosslove.core.logging import get_logger

logger = get_logger(__name__)


@dataclass(frozen=True, slots=True)
class RateLimitResult:
    allowed: bool
    limit: int
    remaining: int
    reset_after: int


class RateLimiter:
    def __init__(self, redis_client: Redis | None, *, enabled: bool = True) -> None:
        self._redis = redis_client
        self._enabled = enabled
        self._mem: dict[tuple[str, int], int] = {}
        self._mem_pruned_at = 0.0

    def parse_spec(self, spec: str) -> RateLimitItem:
        return parse(spec)

    async def hit(self, key: str, item: RateLimitItem) -> RateLimitResult:
        limit = item.amount
        window = item.get_expiry()
        if not self._enabled or window <= 0:
            return RateLimitResult(allowed=True, limit=limit, remaining=limit, reset_after=0)
        if self._redis is not None:
            return await self._hit_redis(key, limit, window)
        return self._hit_memory(key, limit, window)

    async def _hit_redis(self, key: str, limit: int, window: int) -> RateLimitResult:
        now = int(time.time())
        bucket = now // window
        rkey = f"rl:{{{key}}}:{window}:{bucket}"
        try:
            async with self._redis.pipeline(transaction=True) as pipe:  # type: ignore[union-attr]
                pipe.incr(rkey)
                pipe.expire(rkey, window)
                count, _ = await pipe.execute()
        except RedisError as exc:
            logger.warning("ratelimit_redis_failed_open", error=str(exc))
            return RateLimitResult(allowed=True, limit=limit, remaining=limit, reset_after=0)
        reset_after = (bucket + 1) * window - now
        return RateLimitResult(
            allowed=count <= limit,
            limit=limit,
            remaining=max(0, limit - count),
            reset_after=reset_after,
        )

    def _hit_memory(self, key: str, limit: int, window: int) -> RateLimitResult:
        now = int(time.time())
        bucket = now // window
        self._prune_memory(bucket)
        mem_key = (f"{key}:{window}", bucket)
        count = self._mem.get(mem_key, 0) + 1
        self._mem[mem_key] = count
        reset_after = (bucket + 1) * window - now
        return RateLimitResult(
            allowed=count <= limit,
            limit=limit,
            remaining=max(0, limit - count),
            reset_after=reset_after,
        )

    def _prune_memory(self, current_bucket: int) -> None:
        monotonic = time.monotonic()
        if monotonic - self._mem_pruned_at < 30:
            return
        self._mem_pruned_at = monotonic
        stale = [k for k in self._mem if k[1] < current_bucket]
        for k in stale:
            self._mem.pop(k, None)
