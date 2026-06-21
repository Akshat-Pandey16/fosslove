from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Query, Request, Response

from fosslove.api.deps import CacheDep, PaginationDep, SessionDep
from fosslove.api.http_cache import CATALOG_PREFIX, cached_json
from fosslove.db.models.enums import Platform
from fosslove.schemas.catalog import AppListItem, AppRead, CategoryRead
from fosslove.schemas.common import Page, paginate
from fosslove.services import catalog_service
from fosslove.services.mappers import to_app_list_item, to_app_read, to_category_read

router = APIRouter(tags=["Catalog"])


@router.get("/categories", response_model=Page[CategoryRead])
async def list_categories(
    request: Request, pagination: PaginationDep, session: SessionDep, cache: CacheDep
) -> Response:
    key = f"{CATALOG_PREFIX}categories:{pagination.offset}:{pagination.limit}"

    async def produce() -> Page[CategoryRead]:
        categories, total = await catalog_service.list_categories(session, pagination)
        return paginate([to_category_read(c) for c in categories], total, pagination)

    return await cached_json(request, cache, key, produce)


@router.get("/categories/by-slug/{slug}", response_model=CategoryRead)
async def get_category_by_slug(
    slug: str, request: Request, session: SessionDep, cache: CacheDep
) -> Response:
    key = f"{CATALOG_PREFIX}category-slug:{slug}"

    async def produce() -> CategoryRead:
        return to_category_read(await catalog_service.get_category_by_slug(session, slug))

    return await cached_json(request, cache, key, produce)


@router.get("/categories/{category_id}", response_model=CategoryRead)
async def get_category(
    category_id: int, request: Request, session: SessionDep, cache: CacheDep
) -> Response:
    key = f"{CATALOG_PREFIX}category:{category_id}"

    async def produce() -> CategoryRead:
        return to_category_read(await catalog_service.get_category(session, category_id))

    return await cached_json(request, cache, key, produce)


@router.get("/apps", response_model=Page[AppListItem])
async def list_apps(
    request: Request,
    pagination: PaginationDep,
    session: SessionDep,
    cache: CacheDep,
    platform: Annotated[Platform | None, Query()] = None,
    category_id: Annotated[int | None, Query(gt=0)] = None,
    q: Annotated[str | None, Query(max_length=100)] = None,
) -> Response:
    key = (
        f"{CATALOG_PREFIX}apps:{platform.value if platform else ''}:{category_id or ''}"
        f":{q or ''}:{pagination.offset}:{pagination.limit}"
    )

    async def produce() -> Page[AppListItem]:
        apps, total = await catalog_service.list_apps(
            session, pagination, platform=platform, category_id=category_id, query=q
        )
        return paginate([to_app_list_item(a) for a in apps], total, pagination)

    return await cached_json(request, cache, key, produce)


@router.get("/apps/by-slug/{platform}/{slug}", response_model=AppRead)
async def get_app_by_slug(
    platform: Platform, slug: str, request: Request, session: SessionDep, cache: CacheDep
) -> Response:
    key = f"{CATALOG_PREFIX}app-slug:{platform.value}:{slug}"

    async def produce() -> AppRead:
        return to_app_read(await catalog_service.get_app_by_slug(session, platform, slug))

    return await cached_json(request, cache, key, produce)


@router.get("/apps/{app_id}", response_model=AppRead)
async def get_app(app_id: int, request: Request, session: SessionDep, cache: CacheDep) -> Response:
    key = f"{CATALOG_PREFIX}app:{app_id}"

    async def produce() -> AppRead:
        return to_app_read(await catalog_service.get_app(session, app_id))

    return await cached_json(request, cache, key, produce)
