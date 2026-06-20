from __future__ import annotations

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

import fosslove.db.models  # noqa: F401
from fosslove import __version__
from fosslove.admin import setup_admin
from fosslove.api.router import api_router
from fosslove.core.cache import Cache, build_redis
from fosslove.core.config import Settings, get_settings
from fosslove.core.exceptions import register_exception_handlers
from fosslove.core.logging import configure_logging, get_logger
from fosslove.core.middleware import RateLimitMiddleware, RequestContextMiddleware
from fosslove.core.ratelimit import RateLimiter
from fosslove.db.session import dispose_engine, get_sessionmaker, init_engine
from fosslove.services import auth_service
from fosslove.services.email import EmailSender

logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    settings = get_settings()
    redis = await build_redis(settings)
    app.state.redis = redis
    app.state.cache = Cache(redis)
    app.state.rate_limiter = RateLimiter(redis, enabled=settings.RATE_LIMIT_ENABLED)
    app.state.email_sender = EmailSender(settings)

    if settings.FIRST_ADMIN_EMAIL and settings.FIRST_ADMIN_PASSWORD:
        factory = get_sessionmaker()
        async with factory() as session:
            await auth_service.ensure_admin(
                session,
                settings.FIRST_ADMIN_EMAIL,
                settings.FIRST_ADMIN_PASSWORD.get_secret_value(),
            )

    logger.info(
        "startup",
        version=__version__,
        environment=settings.ENV.value,
        cache_backend=app.state.cache.backend,
        database=settings.database_url_safe,
    )
    try:
        yield
    finally:
        await app.state.cache.close()
        await dispose_engine()
        logger.info("shutdown")


def _add_middleware(app: FastAPI, settings: Settings) -> None:
    prefix = settings.API_V1_PREFIX
    app.add_middleware(
        RateLimitMiddleware,
        default_spec=settings.RATE_LIMIT_DEFAULT,
        exempt_prefixes=(
            "/health",
            "/admin",
            f"{prefix}/docs",
            f"{prefix}/redoc",
            f"{prefix}/openapi.json",
        ),
    )
    app.add_middleware(TrustedHostMiddleware, allowed_hosts=settings.ALLOWED_HOSTS)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["*"],
        expose_headers=["x-request-id"],
        max_age=600,
    )
    app.add_middleware(RequestContextMiddleware)


def _add_health_routes(app: FastAPI, settings: Settings) -> None:
    @app.get("/", tags=["Health"])
    async def root() -> dict[str, str]:
        return {"service": settings.PROJECT_NAME, "version": __version__, "status": "ok"}

    @app.get("/health", tags=["Health"])
    async def health() -> dict[str, str]:
        return {"status": "ok"}

    @app.get("/health/ready", tags=["Health"])
    async def ready(request: Request) -> JSONResponse:
        checks: dict[str, str] = {}
        healthy = True

        try:
            factory = get_sessionmaker()
            async with factory() as session:
                await session.execute(text("SELECT 1"))
            checks["database"] = "ok"
        except SQLAlchemyError:
            checks["database"] = "error"
            healthy = False

        redis = getattr(request.app.state, "redis", None)
        if redis is None:
            checks["redis"] = "disabled"
        else:
            try:
                await redis.ping()
                checks["redis"] = "ok"
            except Exception:
                checks["redis"] = "error"

        status_code = 200 if healthy else 503
        return JSONResponse(status_code=status_code, content={"status": checks})


def create_app(settings: Settings | None = None) -> FastAPI:
    settings = settings or get_settings()
    configure_logging(settings)
    engine = init_engine(settings)

    app = FastAPI(
        title=settings.PROJECT_NAME,
        version=__version__,
        description="One-stop catalog of FOSS apps with install-script generation.",
        lifespan=lifespan,
        docs_url=f"{settings.API_V1_PREFIX}/docs",
        redoc_url=f"{settings.API_V1_PREFIX}/redoc",
        openapi_url=f"{settings.API_V1_PREFIX}/openapi.json",
    )

    register_exception_handlers(app)
    _add_middleware(app, settings)
    app.include_router(api_router, prefix=settings.API_V1_PREFIX)
    _add_health_routes(app, settings)
    setup_admin(app, engine)
    return app


app = create_app()
