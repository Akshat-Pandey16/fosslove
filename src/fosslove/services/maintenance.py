from __future__ import annotations

from datetime import UTC, datetime

from sqlalchemy import delete, or_
from sqlalchemy.ext.asyncio import AsyncSession

from fosslove.db.models.user import RefreshToken, VerificationToken


async def cleanup_expired_tokens(session: AsyncSession) -> dict[str, int]:
    now = datetime.now(UTC)
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
    return {
        "refresh_tokens": refresh_result.rowcount or 0,
        "verification_tokens": verification_result.rowcount or 0,
    }
