from __future__ import annotations

import asyncio

from sqlalchemy import text

from fosslove.core.config import get_settings
from fosslove.core.logging import configure_logging, get_logger
from fosslove.db.session import dispose_engine, init_engine

logger = get_logger(__name__)


async def _reset() -> None:
    settings = get_settings()
    configure_logging(settings)
    engine = init_engine(settings)
    async with engine.begin() as connection:
        await connection.execute(text("DROP SCHEMA IF EXISTS public CASCADE"))
        await connection.execute(text("CREATE SCHEMA public"))
    await dispose_engine()
    logger.warning("database_reset", database=settings.database_url_safe)


def main() -> None:
    asyncio.run(_reset())


if __name__ == "__main__":
    main()
