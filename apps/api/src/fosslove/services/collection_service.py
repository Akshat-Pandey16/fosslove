from __future__ import annotations

import uuid

from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from fosslove.core.exceptions import BadRequestError, ConflictError, NotFoundError
from fosslove.core.pagination import Pagination
from fosslove.db.models.catalog import App
from fosslove.db.models.userdata import Collection, CollectionApp
from fosslove.schemas.collection import CollectionCreate, CollectionUpdate
from fosslove.utils import make_slug


async def _validate_app_ids(session: AsyncSession, app_ids: list[int]) -> None:
    if not app_ids:
        return
    found = set((await session.scalars(select(App.id).where(App.id.in_(app_ids)))).all())
    missing = [app_id for app_id in app_ids if app_id not in found]
    if missing:
        raise BadRequestError(f"Unknown app IDs: {missing}", code="unknown_apps")


async def _unique_slug(
    session: AsyncSession, user_id: uuid.UUID, base: str, exclude_id: int | None
) -> str:
    candidate = base
    suffix = 2
    while True:
        stmt = select(Collection.id).where(
            Collection.user_id == user_id, Collection.slug == candidate
        )
        if exclude_id is not None:
            stmt = stmt.where(Collection.id != exclude_id)
        if await session.scalar(stmt) is None:
            return candidate
        candidate = f"{base}-{suffix}"
        suffix += 1


async def _load_detail(session: AsyncSession, collection_id: int) -> Collection | None:
    result: Collection | None = await session.scalar(
        select(Collection)
        .where(Collection.id == collection_id)
        .options(selectinload(Collection.items).selectinload(CollectionApp.app))
        .execution_options(populate_existing=True)
    )
    return result


async def _require_detail(session: AsyncSession, collection_id: int) -> Collection:
    collection = await _load_detail(session, collection_id)
    if collection is None:
        raise NotFoundError("Collection not found.")
    return collection


async def get_viewable_collection(
    session: AsyncSession, collection_id: int, viewer_id: uuid.UUID | None
) -> Collection:
    collection = await _load_detail(session, collection_id)
    if collection is None or (not collection.is_public and collection.user_id != viewer_id):
        raise NotFoundError("Collection not found.")
    return collection


async def get_owned_collection(
    session: AsyncSession, collection_id: int, user_id: uuid.UUID
) -> Collection:
    collection = await _load_detail(session, collection_id)
    if collection is None or collection.user_id != user_id:
        raise NotFoundError("Collection not found.")
    return collection


async def list_user_collections(
    session: AsyncSession, user_id: uuid.UUID, pagination: Pagination
) -> tuple[list[tuple[Collection, int]], int]:
    total = (
        await session.scalar(
            select(func.count()).select_from(Collection).where(Collection.user_id == user_id)
        )
    ) or 0
    rows = await session.execute(
        select(Collection, func.count(CollectionApp.app_id))
        .outerjoin(CollectionApp, CollectionApp.collection_id == Collection.id)
        .where(Collection.user_id == user_id)
        .group_by(Collection.id)
        .order_by(Collection.created_at.desc())
        .offset(pagination.offset)
        .limit(pagination.limit)
    )
    return [(collection, count) for collection, count in rows.all()], total


async def list_public_collections(
    session: AsyncSession, pagination: Pagination
) -> tuple[list[tuple[Collection, int]], int]:
    total = (
        await session.scalar(
            select(func.count()).select_from(Collection).where(Collection.is_public.is_(True))
        )
    ) or 0
    rows = await session.execute(
        select(Collection, func.count(CollectionApp.app_id))
        .outerjoin(CollectionApp, CollectionApp.collection_id == Collection.id)
        .where(Collection.is_public.is_(True))
        .group_by(Collection.id)
        .order_by(Collection.created_at.desc())
        .offset(pagination.offset)
        .limit(pagination.limit)
    )
    return [(collection, count) for collection, count in rows.all()], total


async def create_collection(
    session: AsyncSession, user_id: uuid.UUID, data: CollectionCreate
) -> Collection:
    duplicate = await session.scalar(
        select(Collection.id).where(Collection.user_id == user_id, Collection.name == data.name)
    )
    if duplicate is not None:
        raise ConflictError("You already have a collection with this name.", code="name_taken")
    await _validate_app_ids(session, data.app_ids)
    slug = await _unique_slug(session, user_id, make_slug(data.name), None)
    collection = Collection(
        user_id=user_id,
        name=data.name,
        slug=slug,
        description=data.description,
        is_public=data.is_public,
    )
    collection.items = [
        CollectionApp(app_id=app_id, position=index) for index, app_id in enumerate(data.app_ids)
    ]
    session.add(collection)
    await session.commit()
    return await _require_detail(session, collection.id)


async def update_collection(
    session: AsyncSession, collection: Collection, data: CollectionUpdate
) -> Collection:
    updates = data.model_dump(exclude_unset=True)
    new_name = updates.get("name", collection.name)
    if "name" in updates and new_name != collection.name:
        duplicate = await session.scalar(
            select(Collection.id).where(
                Collection.user_id == collection.user_id,
                Collection.name == new_name,
                Collection.id != collection.id,
            )
        )
        if duplicate is not None:
            raise ConflictError("You already have a collection with this name.", code="name_taken")
        collection.slug = await _unique_slug(
            session, collection.user_id, make_slug(new_name), collection.id
        )
    for key, value in updates.items():
        setattr(collection, key, value)
    await session.commit()
    return await _require_detail(session, collection.id)


async def set_apps(session: AsyncSession, collection: Collection, app_ids: list[int]) -> Collection:
    await _validate_app_ids(session, app_ids)
    await session.execute(delete(CollectionApp).where(CollectionApp.collection_id == collection.id))
    await session.flush()
    session.add_all(
        [
            CollectionApp(collection_id=collection.id, app_id=app_id, position=index)
            for index, app_id in enumerate(app_ids)
        ]
    )
    await session.commit()
    return await _require_detail(session, collection.id)


async def delete_collection(session: AsyncSession, collection: Collection) -> None:
    await session.delete(collection)
    await session.commit()
