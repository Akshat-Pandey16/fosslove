from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from sqlalchemy import delete, or_

from fosslove.core.logging import get_logger
from fosslove.db.models.user import RefreshToken, VerificationToken
from fosslove.db.session import get_sessionmaker
from fosslove.services import catalog_service

logger = get_logger(__name__)


async def recompute_category_counts(ctx: dict[str, Any]) -> dict[str, str]:
    factory = get_sessionmaker()
    async with factory() as session:
        await catalog_service.recompute_counts(session)
    logger.info("recompute_category_counts_done")
    return {"status": "ok"}


async def cleanup_expired_tokens(ctx: dict[str, Any]) -> dict[str, int]:
    now = datetime.now(UTC)
    factory = get_sessionmaker()
    async with factory() as session:
        refresh_result = await session.execute(
            delete(RefreshToken).where(RefreshToken.expires_at < now)
        )
        verification_result = await session.execute(
            delete(VerificationToken).where(
                or_(
                    VerificationToken.expires_at < now,
                    VerificationToken.used_at.is_not(None),
                )
            )
        )
        await session.commit()
    counts = {
        "refresh_tokens": refresh_result.rowcount or 0,
        "verification_tokens": verification_result.rowcount or 0,
    }
    logger.info("cleanup_expired_tokens_done", **counts)
    return counts
