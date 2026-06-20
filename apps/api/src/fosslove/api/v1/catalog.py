from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Query

from fosslove.api.deps import PaginationDep, SessionDep
from fosslove.db.models.enums import Platform
from fosslove.schemas.catalog import AppListItem, AppRead, CategoryRead
from fosslove.schemas.common import Page, paginate
from fosslove.services import catalog_service
from fosslove.services.mappers import to_app_list_item, to_app_read, to_category_read

router = APIRouter(tags=["Catalog"])


@router.get("/categories", response_model=Page[CategoryRead])
async def list_categories(pagination: PaginationDep, session: SessionDep) -> Page[CategoryRead]:
    categories, total = await catalog_service.list_categories(session, pagination)
    return paginate([to_category_read(c) for c in categories], total, pagination)


@router.get("/categories/{category_id}", response_model=CategoryRead)
async def get_category(category_id: int, session: SessionDep) -> CategoryRead:
    return to_category_read(await catalog_service.get_category(session, category_id))


@router.get("/apps", response_model=Page[AppListItem])
async def list_apps(
    pagination: PaginationDep,
    session: SessionDep,
    platform: Annotated[Platform | None, Query()] = None,
    category_id: Annotated[int | None, Query(gt=0)] = None,
    q: Annotated[str | None, Query(max_length=100)] = None,
) -> Page[AppListItem]:
    apps, total = await catalog_service.list_apps(
        session, pagination, platform=platform, category_id=category_id, query=q
    )
    return paginate([to_app_list_item(a) for a in apps], total, pagination)


@router.get("/apps/{app_id}", response_model=AppRead)
async def get_app(app_id: int, session: SessionDep) -> AppRead:
    return to_app_read(await catalog_service.get_app(session, app_id))
