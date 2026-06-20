from __future__ import annotations

import time
import uuid

import structlog
from limits import parse
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import JSONResponse, Response

from fosslove.core.logging import get_logger
from fosslove.core.ratelimit import RateLimiter
from fosslove.core.runtime_settings import RuntimeSettings

logger = get_logger(__name__)


def get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    if request.client is not None:
        return request.client.host
    return "unknown"


class RequestContextMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        request_id = request.headers.get("x-request-id") or uuid.uuid4().hex
        request.state.request_id = request_id
        structlog.contextvars.clear_contextvars()
        structlog.contextvars.bind_contextvars(
            request_id=request_id,
            method=request.method,
            path=request.url.path,
            client_ip=get_client_ip(request),
        )
        start = time.perf_counter()
        try:
            response = await call_next(request)
        except Exception:
            duration_ms = round((time.perf_counter() - start) * 1000, 2)
            logger.exception("request_failed", duration_ms=duration_ms)
            structlog.contextvars.clear_contextvars()
            raise
        duration_ms = round((time.perf_counter() - start) * 1000, 2)
        response.headers["x-request-id"] = request_id
        logger.info("request", status_code=response.status_code, duration_ms=duration_ms)
        structlog.contextvars.clear_contextvars()
        return response


class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(
        self,
        app: object,
        *,
        exempt_prefixes: tuple[str, ...] = (),
    ) -> None:
        super().__init__(app)  # type: ignore[arg-type]
        self._exempt = exempt_prefixes

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        path = request.url.path
        limiter: RateLimiter | None = getattr(request.app.state, "rate_limiter", None)
        runtime: RuntimeSettings | None = getattr(request.app.state, "runtime_settings", None)
        if (
            limiter is None
            or runtime is None
            or request.method == "OPTIONS"
            or any(path.startswith(p) for p in self._exempt)
        ):
            return await call_next(request)

        await runtime.ensure_fresh()
        if not runtime.rate_limit_enabled:
            return await call_next(request)

        item = parse(runtime.rate_limit_default)
        result = await limiter.hit(f"global:{get_client_ip(request)}", item)
        headers = {
            "x-ratelimit-limit": str(result.limit),
            "x-ratelimit-remaining": str(result.remaining),
            "x-ratelimit-reset": str(result.reset_after),
        }
        if not result.allowed:
            request_id = getattr(request.state, "request_id", None)
            body = {"error": {"code": "rate_limited", "message": "Too many requests."}}
            if request_id:
                body["request_id"] = request_id
            return JSONResponse(
                status_code=429,
                content=body,
                headers={**headers, "retry-after": str(result.reset_after)},
            )
        response = await call_next(request)
        for header, value in headers.items():
            response.headers[header] = value
        return response
