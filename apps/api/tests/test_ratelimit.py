from __future__ import annotations

from fosslove.core.ratelimit import RateLimiter


async def test_memory_limiter_blocks_beyond_limit() -> None:
    limiter = RateLimiter(None)
    item = limiter.parse_spec("3/minute")
    verdicts = [(await limiter.hit("client-a", item)).allowed for _ in range(4)]
    assert verdicts == [True, True, True, False]


async def test_memory_limiter_is_keyed_per_client() -> None:
    limiter = RateLimiter(None)
    item = limiter.parse_spec("1/minute")
    assert (await limiter.hit("client-x", item)).allowed is True
    assert (await limiter.hit("client-y", item)).allowed is True
    assert (await limiter.hit("client-x", item)).allowed is False


async def test_limiter_reports_remaining_and_reset() -> None:
    limiter = RateLimiter(None)
    item = limiter.parse_spec("10/minute")
    result = await limiter.hit("client-z", item)
    assert result.limit == 10
    assert result.remaining == 9
    assert 0 < result.reset_after <= 60
