from __future__ import annotations

import time
from dataclasses import dataclass

from limits import RateLimitItem, parse
from redis.asyncio import Redis
from redis.exceptions import RedisError

from fosslove.core.logging import get_logger

logger = get_logger(__name__)

_MEMORY_MAX_KEYS = 50_000


@dataclass(frozen=True, slots=True)
class RateLimitResult:
    allowed: bool
    limit: int
    remaining: int
    reset_after: int


class RateLimiter:
    def __init__(self, redis_client: Redis | None) -> None:
        self._redis = redis_client
        self._mem: dict[tuple[str, int], int] = {}
        self._mem_pruned_at = 0.0

    def parse_spec(self, spec: str) -> RateLimitItem:
        return parse(spec)

    async def hit(
        self, key: str, item: RateLimitItem, *, fail_open: bool = True
    ) -> RateLimitResult:
        limit = item.amount
        window = item.get_expiry()
        if window <= 0 or limit <= 0:
            return RateLimitResult(allowed=True, limit=limit, remaining=limit, reset_after=0)
        if self._redis is not None:
            try:
                return await self._hit_redis(self._redis, key, limit, window)
            except RedisError as exc:
                logger.warning("ratelimit_redis_failed", error=str(exc), fail_open=fail_open)
                if fail_open:
                    return RateLimitResult(
                        allowed=True, limit=limit, remaining=limit, reset_after=0
                    )
        return self._hit_memory(key, limit, window)

    async def _hit_redis(self, redis: Redis, key: str, limit: int, window: int) -> RateLimitResult:
        now = time.time()
        bucket = int(now // window)
        elapsed = now - bucket * window
        prev_weight = (window - elapsed) / window
        cur_key = f"rl:{{{key}}}:{window}:{bucket}"
        prev_key = f"rl:{{{key}}}:{window}:{bucket - 1}"
        async with redis.pipeline(transaction=True) as pipe:
            pipe.incr(cur_key)
            pipe.expire(cur_key, window * 2)
            pipe.get(prev_key)
            current, _, previous = await pipe.execute()
        return self._evaluate(int(current), int(previous or 0), prev_weight, limit, window, elapsed)

    def _hit_memory(self, key: str, limit: int, window: int) -> RateLimitResult:
        now = time.time()
        bucket = int(now // window)
        elapsed = now - bucket * window
        prev_weight = (window - elapsed) / window
        self._prune_memory(bucket)
        base = f"{key}:{window}"
        current = self._mem.get((base, bucket), 0) + 1
        self._mem[(base, bucket)] = current
        previous = self._mem.get((base, bucket - 1), 0)
        return self._evaluate(current, previous, prev_weight, limit, window, elapsed)

    @staticmethod
    def _evaluate(
        current: int, previous: int, prev_weight: float, limit: int, window: int, elapsed: float
    ) -> RateLimitResult:
        estimated = current + previous * prev_weight
        reset_after = int(window - elapsed) + 1
        return RateLimitResult(
            allowed=estimated <= limit,
            limit=limit,
            remaining=max(0, limit - int(estimated)),
            reset_after=reset_after,
        )

    def _prune_memory(self, current_bucket: int) -> None:
        monotonic = time.monotonic()
        if monotonic - self._mem_pruned_at < 30 and len(self._mem) < _MEMORY_MAX_KEYS:
            return
        self._mem_pruned_at = monotonic
        for stale in [k for k in self._mem if k[1] < current_bucket - 1]:
            self._mem.pop(stale, None)
        if len(self._mem) > _MEMORY_MAX_KEYS:
            self._mem.clear()
