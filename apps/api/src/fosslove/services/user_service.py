from __future__ import annotations

import uuid
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from fosslove.db.models.user import User
from fosslove.db.models.userdata import Collection, Favorite, ScriptRun
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


async def export_data(session: AsyncSession, user: User) -> dict[str, Any]:
    collections = list(
        await session.scalars(
            select(Collection)
            .where(Collection.user_id == user.id)
            .options(selectinload(Collection.items))
            .order_by(Collection.created_at)
        )
    )
    favorites = list(
        await session.scalars(select(Favorite.app_id).where(Favorite.user_id == user.id))
    )
    runs = list(
        await session.scalars(
            select(ScriptRun).where(ScriptRun.user_id == user.id).order_by(ScriptRun.created_at)
        )
    )
    return {
        "collections": [
            {
                "id": collection.id,
                "name": collection.name,
                "slug": collection.slug,
                "is_public": collection.is_public,
                "app_ids": [item.app_id for item in collection.items],
                "created_at": collection.created_at.isoformat(),
            }
            for collection in collections
        ],
        "favorites": list(favorites),
        "script_runs": [
            {
                "id": run.id,
                "platform": run.platform.value,
                "app_ids": run.app_ids,
                "created_at": run.created_at.isoformat(),
            }
            for run in runs
        ],
    }
