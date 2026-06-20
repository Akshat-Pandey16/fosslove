from __future__ import annotations

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from fosslove.db.models.user import User
from fosslove.schemas.user import UserUpdate


async def get_user(session: AsyncSession, user_id: uuid.UUID) -> User | None:
    return await session.get(User, user_id)


async def update_profile(session: AsyncSession, user: User, data: UserUpdate) -> User:
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(user, key, value)
    await session.commit()
    return user


async def delete_account(session: AsyncSession, user: User) -> None:
    await session.delete(user)
    await session.commit()
