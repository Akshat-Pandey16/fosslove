from __future__ import annotations

import asyncio
import os
import sys
from pathlib import Path
from typing import Any

import asyncpg
from alembic.autogenerate import compare_metadata
from alembic.runtime.migration import MigrationContext
from sqlalchemy import Connection
from sqlalchemy.ext.asyncio import create_async_engine

from fosslove.core.config import get_settings
from fosslove.db.base import Base

_MIGRATION_DB = "fosslove_migration_check"
_API_DIR = Path(__file__).resolve().parents[1]


def _diff(connection: Connection) -> list[Any]:
    context = MigrationContext.configure(connection)
    return list(compare_metadata(context, Base.metadata))


async def test_migrations_match_models() -> None:
    settings = get_settings()
    admin = await asyncpg.connect(
        host=settings.POSTGRES_HOST,
        port=settings.POSTGRES_PORT,
        user=settings.POSTGRES_USER,
        password=settings.POSTGRES_PASSWORD.get_secret_value(),
        database="postgres",
    )
    await admin.execute(f'DROP DATABASE IF EXISTS "{_MIGRATION_DB}" WITH (FORCE)')
    await admin.execute(f'CREATE DATABASE "{_MIGRATION_DB}"')
    await admin.close()

    env = {**os.environ, "FOSSLOVE_POSTGRES_DB": _MIGRATION_DB}
    process = await asyncio.create_subprocess_exec(
        sys.executable,
        "-m",
        "alembic",
        "upgrade",
        "head",
        cwd=str(_API_DIR),
        env=env,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    _, stderr = await process.communicate()
    assert process.returncode == 0, stderr.decode()

    url = (
        f"postgresql+asyncpg://{settings.POSTGRES_USER}:"
        f"{settings.POSTGRES_PASSWORD.get_secret_value()}@"
        f"{settings.POSTGRES_HOST}:{settings.POSTGRES_PORT}/{_MIGRATION_DB}"
    )
    engine = create_async_engine(url)
    try:
        async with engine.connect() as connection:
            diffs = await connection.run_sync(_diff)
    finally:
        await engine.dispose()

    structural = [
        d for d in diffs if isinstance(d, tuple) and str(d[0]).split("_")[0] in {"add", "remove"}
    ]
    assert structural == [], structural
