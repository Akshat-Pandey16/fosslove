from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Query, status

from fosslove.api.deps import PaginationDep, RuntimeSettingsDep, SessionDep, require_admin
from fosslove.db.models.enums import Platform
from fosslove.schemas.catalog import (
    AppCreate,
    AppListItem,
    AppRead,
    AppUpdate,
    CategoryCreate,
    CategoryRead,
    CategoryUpdate,
)
from fosslove.schemas.common import Message, Page, paginate
from fosslove.schemas.settings import SettingsRead, SettingsUpdate
from fosslove.services import catalog_service, maintenance, settings_service
from fosslove.services.mappers import to_app_list_item, to_app_read, to_category_read

router = APIRouter(prefix="/admin", tags=["Admin"], dependencies=[Depends(require_admin)])


@router.post("/categories", response_model=CategoryRead, status_code=status.HTTP_201_CREATED)
async def create_category(data: CategoryCreate, session: SessionDep) -> CategoryRead:
    return to_category_read(await catalog_service.create_category(session, data))


@router.patch("/categories/{category_id}", response_model=CategoryRead)
async def update_category(
    category_id: int, data: CategoryUpdate, session: SessionDep
) -> CategoryRead:
    return to_category_read(await catalog_service.update_category(session, category_id, data))


@router.delete("/categories/{category_id}", response_model=Message)
async def delete_category(category_id: int, session: SessionDep) -> Message:
    await catalog_service.delete_category(session, category_id)
    return Message(message="Category deleted.")


@router.get("/apps", response_model=Page[AppListItem])
async def list_all_apps(
    pagination: PaginationDep,
    session: SessionDep,
    platform: Annotated[Platform | None, Query()] = None,
    category_id: Annotated[int | None, Query(gt=0)] = None,
    q: Annotated[str | None, Query(max_length=100)] = None,
) -> Page[AppListItem]:
    apps, total = await catalog_service.list_apps(
        session,
        pagination,
        platform=platform,
        category_id=category_id,
        query=q,
        active_only=False,
    )
    return paginate([to_app_list_item(a) for a in apps], total, pagination)


@router.post("/apps", response_model=AppRead, status_code=status.HTTP_201_CREATED)
async def create_app(data: AppCreate, session: SessionDep) -> AppRead:
    return to_app_read(await catalog_service.create_app(session, data))


@router.patch("/apps/{app_id}", response_model=AppRead)
async def update_app(app_id: int, data: AppUpdate, session: SessionDep) -> AppRead:
    return to_app_read(await catalog_service.update_app(session, app_id, data))


@router.delete("/apps/{app_id}", response_model=Message)
async def delete_app(app_id: int, session: SessionDep) -> Message:
    await catalog_service.delete_app(session, app_id)
    return Message(message="App deleted.")


@router.post("/recompute-counts", response_model=Message)
async def recompute_counts(session: SessionDep) -> Message:
    await catalog_service.recompute_counts(session)
    return Message(message="Category counts recomputed.")


@router.post("/cleanup-tokens", response_model=dict[str, int])
async def cleanup_tokens(session: SessionDep) -> dict[str, int]:
    return await maintenance.cleanup_expired_tokens(session)


@router.get("/settings", response_model=SettingsRead)
async def get_runtime_settings(runtime: RuntimeSettingsDep) -> SettingsRead:
    await runtime.ensure_fresh()
    return settings_service.to_settings_read(runtime)


@router.patch("/settings", response_model=SettingsRead)
async def update_runtime_settings(
    data: SettingsUpdate, runtime: RuntimeSettingsDep
) -> SettingsRead:
    await settings_service.update_settings(runtime, data)
    return settings_service.to_settings_read(runtime)
