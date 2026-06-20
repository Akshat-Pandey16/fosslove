from __future__ import annotations

from sqlalchemy import ColumnElement, func, or_, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from fosslove.core.exceptions import ConflictError, NotFoundError
from fosslove.core.pagination import Pagination
from fosslove.db.models.catalog import App, Category, PackageReference
from fosslove.db.models.enums import Platform
from fosslove.schemas.catalog import AppCreate, AppUpdate, CategoryCreate, CategoryUpdate
from fosslove.utils import make_slug


def _count_column(platform: Platform) -> ColumnElement[int]:
    if platform is Platform.WINDOWS:
        return Category.windows_app_count
    return Category.linux_app_count


async def _adjust_count(
    session: AsyncSession, category_id: int, platform: Platform, delta: int
) -> None:
    column = _count_column(platform)
    await session.execute(
        update(Category).where(Category.id == category_id).values({column: column + delta})
    )


async def _unique_category_slug(session: AsyncSession, base: str, exclude_id: int | None) -> str:
    candidate = base
    suffix = 2
    while True:
        stmt = select(Category.id).where(Category.slug == candidate)
        if exclude_id is not None:
            stmt = stmt.where(Category.id != exclude_id)
        if await session.scalar(stmt) is None:
            return candidate
        candidate = f"{base}-{suffix}"
        suffix += 1


async def _unique_app_slug(
    session: AsyncSession, platform: Platform, base: str, exclude_id: int | None
) -> str:
    candidate = base
    suffix = 2
    while True:
        stmt = select(App.id).where(App.platform == platform, App.slug == candidate)
        if exclude_id is not None:
            stmt = stmt.where(App.id != exclude_id)
        if await session.scalar(stmt) is None:
            return candidate
        candidate = f"{base}-{suffix}"
        suffix += 1


async def list_categories(
    session: AsyncSession, pagination: Pagination
) -> tuple[list[Category], int]:
    total = await session.scalar(select(func.count()).select_from(Category)) or 0
    rows = await session.scalars(
        select(Category).order_by(Category.name).offset(pagination.offset).limit(pagination.limit)
    )
    return list(rows), total


async def get_category(session: AsyncSession, category_id: int) -> Category:
    category = await session.get(Category, category_id)
    if category is None:
        raise NotFoundError("Category not found.")
    return category


async def create_category(session: AsyncSession, data: CategoryCreate) -> Category:
    existing = await session.scalar(select(Category.id).where(Category.name == data.name))
    if existing is not None:
        raise ConflictError("A category with this name already exists.", code="category_exists")
    slug = await _unique_category_slug(session, make_slug(data.name), None)
    category = Category(
        name=data.name, slug=slug, description=data.description, icon_url=data.icon_url
    )
    session.add(category)
    await session.commit()
    return category


async def update_category(
    session: AsyncSession, category_id: int, data: CategoryUpdate
) -> Category:
    category = await get_category(session, category_id)
    updates = data.model_dump(exclude_unset=True)
    new_name = updates.get("name", category.name)
    if "name" in updates and new_name != category.name:
        conflict = await session.scalar(
            select(Category.id).where(Category.name == new_name, Category.id != category_id)
        )
        if conflict is not None:
            raise ConflictError("A category with this name already exists.", code="category_exists")
        category.slug = await _unique_category_slug(session, make_slug(new_name), category_id)
    for key, value in updates.items():
        setattr(category, key, value)
    await session.commit()
    return category


async def delete_category(session: AsyncSession, category_id: int) -> None:
    category = await get_category(session, category_id)
    await session.delete(category)
    await session.commit()


async def list_apps(
    session: AsyncSession,
    pagination: Pagination,
    *,
    platform: Platform | None = None,
    category_id: int | None = None,
    query: str | None = None,
    active_only: bool = True,
) -> tuple[list[App], int]:
    conditions: list[ColumnElement[bool]] = []
    if active_only:
        conditions.append(App.is_active.is_(True))
    if platform is not None:
        conditions.append(App.platform == platform)
    if category_id is not None:
        conditions.append(App.category_id == category_id)
    if query:
        pattern = f"%{query.strip()}%"
        conditions.append(or_(App.name.ilike(pattern), App.summary.ilike(pattern)))

    total = (
        await session.scalar(select(func.count()).select_from(App).where(*conditions))
    ) or 0
    rows = await session.scalars(
        select(App)
        .where(*conditions)
        .order_by(App.name)
        .offset(pagination.offset)
        .limit(pagination.limit)
    )
    return list(rows), total


async def get_app(session: AsyncSession, app_id: int) -> App:
    app = await session.scalar(
        select(App).where(App.id == app_id).options(selectinload(App.package_refs))
    )
    if app is None:
        raise NotFoundError("App not found.")
    return app


async def get_apps_for_ids(
    session: AsyncSession, platform: Platform, app_ids: list[int]
) -> list[App]:
    if not app_ids:
        return []
    rows = await session.scalars(
        select(App)
        .where(App.platform == platform, App.id.in_(app_ids), App.is_active.is_(True))
        .options(selectinload(App.package_refs))
    )
    return list(rows)


def _ensure_unique_managers(refs: list[PackageReference]) -> None:
    managers = [ref.manager for ref in refs]
    if len(managers) != len(set(managers)):
        raise ConflictError("Duplicate package managers for one app.", code="duplicate_manager")


async def create_app(session: AsyncSession, data: AppCreate) -> App:
    if await session.get(Category, data.category_id) is None:
        raise NotFoundError("Category not found.")
    duplicate = await session.scalar(
        select(App.id).where(
            App.category_id == data.category_id,
            App.platform == data.platform,
            App.name == data.name,
        )
    )
    if duplicate is not None:
        raise ConflictError("An app with this name already exists here.", code="app_exists")

    slug = await _unique_app_slug(session, data.platform, make_slug(data.name), None)
    app = App(
        category_id=data.category_id,
        platform=data.platform,
        name=data.name,
        slug=slug,
        summary=data.summary,
        description=data.description,
        homepage_url=data.homepage_url,
        license=data.license,
    )
    app.package_refs = [
        PackageReference(
            manager=ref.manager,
            identifier=ref.identifier,
            install_args=ref.install_args,
            priority=ref.priority,
            extra=ref.extra,
        )
        for ref in data.package_refs
    ]
    _ensure_unique_managers(app.package_refs)
    session.add(app)
    await _adjust_count(session, data.category_id, data.platform, 1)
    await session.commit()
    return await get_app(session, app.id)


async def update_app(session: AsyncSession, app_id: int, data: AppUpdate) -> App:
    app = await get_app(session, app_id)
    updates = data.model_dump(exclude_unset=True)
    original_category_id = app.category_id
    new_category_id = updates.get("category_id", app.category_id)
    new_name = updates.get("name", app.name)

    if "category_id" in updates and new_category_id != original_category_id:
        if await session.get(Category, new_category_id) is None:
            raise NotFoundError("Category not found.")

    if new_name != app.name or new_category_id != original_category_id:
        duplicate = await session.scalar(
            select(App.id).where(
                App.category_id == new_category_id,
                App.platform == app.platform,
                App.name == new_name,
                App.id != app.id,
            )
        )
        if duplicate is not None:
            raise ConflictError("An app with this name already exists here.", code="app_exists")

    for key, value in updates.items():
        setattr(app, key, value)
    if "name" in updates:
        app.slug = await _unique_app_slug(
            session, app.platform, make_slug(new_name), exclude_id=app.id
        )
    if new_category_id != original_category_id:
        await _adjust_count(session, original_category_id, app.platform, -1)
        await _adjust_count(session, new_category_id, app.platform, 1)

    await session.commit()
    return await get_app(session, app.id)


async def delete_app(session: AsyncSession, app_id: int) -> None:
    app = await get_app(session, app_id)
    category_id, platform = app.category_id, app.platform
    await session.delete(app)
    await _adjust_count(session, category_id, platform, -1)
    await session.commit()


async def recompute_counts(session: AsyncSession) -> None:
    windows = (
        select(func.count())
        .where(App.category_id == Category.id, App.platform == Platform.WINDOWS)
        .scalar_subquery()
    )
    linux = (
        select(func.count())
        .where(App.category_id == Category.id, App.platform == Platform.LINUX)
        .scalar_subquery()
    )
    await session.execute(
        update(Category).values(windows_app_count=windows, linux_app_count=linux)
    )
    await session.commit()
