from __future__ import annotations

import os

os.environ["FOSSLOVE_POSTGRES_DB"] = "fosslove_test"
os.environ.setdefault("FOSSLOVE_POSTGRES_PORT", "5544")
os.environ.setdefault("FOSSLOVE_SECRET_KEY", "test-secret-key-for-ci-and-local-use-only-0123456789")
os.environ.setdefault("FOSSLOVE_RATE_LIMIT_ENABLED", "false")
os.environ.setdefault("FOSSLOVE_EMAIL_BACKEND", "console")
os.environ.pop("FOSSLOVE_REDIS_URL", None)

from collections.abc import AsyncIterator

import asyncpg
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession

import fosslove.db.models  # noqa: F401
from fosslove.core.cache import Cache
from fosslove.core.config import get_settings
from fosslove.core.ratelimit import RateLimiter
from fosslove.core.runtime_settings import RuntimeSettings
from fosslove.db.base import Base
from fosslove.db.session import dispose_engine, get_sessionmaker, init_engine
from fosslove.services import auth_service
from fosslove.services.email import EmailSender


@pytest_asyncio.fixture(scope="session")
async def _engine() -> AsyncIterator[AsyncEngine]:
    settings = get_settings()
    admin = await asyncpg.connect(
        host=settings.POSTGRES_HOST,
        port=settings.POSTGRES_PORT,
        user=settings.POSTGRES_USER,
        password=settings.POSTGRES_PASSWORD.get_secret_value(),
        database="postgres",
    )
    exists = await admin.fetchval(
        "SELECT 1 FROM pg_database WHERE datname = $1", settings.POSTGRES_DB
    )
    if not exists:
        await admin.execute(f'CREATE DATABASE "{settings.POSTGRES_DB}"')
    await admin.close()

    engine = init_engine(settings)
    async with engine.begin() as conn:
        await conn.execute(text("CREATE EXTENSION IF NOT EXISTS pg_trgm"))
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await dispose_engine()


@pytest_asyncio.fixture(autouse=True)
async def _truncate(_engine: AsyncEngine) -> AsyncIterator[None]:
    yield
    tables = ", ".join(f'"{table.name}"' for table in reversed(Base.metadata.sorted_tables))
    async with _engine.begin() as conn:
        await conn.execute(text(f"TRUNCATE {tables} RESTART IDENTITY CASCADE"))


@pytest_asyncio.fixture
async def db_session(_engine: AsyncEngine) -> AsyncIterator[AsyncSession]:
    async with get_sessionmaker()() as session:
        yield session


@pytest_asyncio.fixture
async def client(_engine: AsyncEngine) -> AsyncIterator[AsyncClient]:
    from fosslove.main import create_app

    app = create_app()
    app.state.redis = None
    app.state.cache = Cache(None)
    app.state.rate_limiter = RateLimiter(None, enabled=False)
    runtime = RuntimeSettings(get_settings())
    await runtime.load()
    app.state.runtime_settings = runtime
    app.state.email_sender = EmailSender(runtime)
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as http_client:
        yield http_client


@pytest_asyncio.fixture
async def auth_headers(client: AsyncClient) -> dict[str, str]:
    await client.post(
        "/api/v1/auth/register",
        json={"email": "user@test.io", "password": "User12345", "full_name": "User"},
    )
    response = await client.post(
        "/api/v1/auth/login", json={"email": "user@test.io", "password": "User12345"}
    )
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


@pytest_asyncio.fixture
async def admin_headers(client: AsyncClient, db_session: AsyncSession) -> dict[str, str]:
    await auth_service.ensure_admin(db_session, "admin@test.io", "Admin12345")
    response = await client.post(
        "/api/v1/auth/login", json={"email": "admin@test.io", "password": "Admin12345"}
    )
    return {"Authorization": f"Bearer {response.json()['access_token']}"}
