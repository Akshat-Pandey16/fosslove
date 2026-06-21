from __future__ import annotations

import uuid

from sqlalchemy import delete, func, select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from fosslove.core.exceptions import NotFoundError
from fosslove.core.pagination import Pagination
from fosslove.db.models.catalog import App
from fosslove.db.models.userdata import Favorite


async def add_favorite(session: AsyncSession, user_id: uuid.UUID, app_id: int) -> None:
    if await session.get(App, app_id) is None:
        raise NotFoundError("App not found.")
    await session.execute(
        pg_insert(Favorite)
        .values(user_id=user_id, app_id=app_id)
        .on_conflict_do_nothing(index_elements=["user_id", "app_id"])
    )
    await session.commit()


async def remove_favorite(session: AsyncSession, user_id: uuid.UUID, app_id: int) -> None:
    await session.execute(
        delete(Favorite).where(Favorite.user_id == user_id, Favorite.app_id == app_id)
    )
    await session.commit()


async def favorite_ids(session: AsyncSession, user_id: uuid.UUID) -> list[int]:
    rows = await session.scalars(
        select(Favorite.app_id)
        .where(Favorite.user_id == user_id)
        .order_by(Favorite.created_at.desc())
    )
    return list(rows)


async def list_favorites(
    session: AsyncSession, user_id: uuid.UUID, pagination: Pagination
) -> tuple[list[App], int]:
    total = (
        await session.scalar(
            select(func.count()).select_from(Favorite).where(Favorite.user_id == user_id)
        )
    ) or 0
    rows = await session.scalars(
        select(App)
        .join(Favorite, Favorite.app_id == App.id)
        .where(Favorite.user_id == user_id)
        .order_by(Favorite.created_at.desc())
        .offset(pagination.offset)
        .limit(pagination.limit)
    )
    return list(rows), total
