from __future__ import annotations

import uuid
from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends, Query, status

from fosslove.api.deps import (
    ActivityDep,
    AdminUser,
    CacheDep,
    PaginationDep,
    RuntimeSettingsDep,
    SessionDep,
    require_admin,
)
from fosslove.api.http_cache import CATALOG_PREFIX
from fosslove.db.models.enums import Platform
from fosslove.schemas.activity import ActivityLogRead
from fosslove.schemas.catalog import (
    AppCreate,
    AppImport,
    AppListItem,
    AppRead,
    AppUpdate,
    CatalogExport,
    CategoryCreate,
    CategoryRead,
    CategoryUpdate,
)
from fosslove.schemas.common import Message, Page, TokenCleanupResult, paginate
from fosslove.schemas.settings import SettingsRead, SettingsUpdate
from fosslove.services import activity_service, catalog_service, maintenance, settings_service
from fosslove.services.activity_service import Action
from fosslove.services.mappers import (
    to_activity_read,
    to_app_list_item,
    to_app_read,
    to_category_read,
)

router = APIRouter(prefix="/admin", tags=["Admin"], dependencies=[Depends(require_admin)])


@router.post("/categories", response_model=CategoryRead, status_code=status.HTTP_201_CREATED)
async def create_category(
    data: CategoryCreate,
    session: SessionDep,
    cache: CacheDep,
    admin: AdminUser,
    activity: ActivityDep,
) -> CategoryRead:
    category = await catalog_service.create_category(session, data)
    await cache.delete_prefix(CATALOG_PREFIX)
    await activity.record(
        Action.CATEGORY_CREATE,
        actor_id=admin.id,
        target_type="category",
        target_id=str(category.id),
    )
    return to_category_read(category)


@router.patch("/categories/{category_id}", response_model=CategoryRead)
async def update_category(
    category_id: int,
    data: CategoryUpdate,
    session: SessionDep,
    cache: CacheDep,
    admin: AdminUser,
    activity: ActivityDep,
) -> CategoryRead:
    category = await catalog_service.update_category(session, category_id, data)
    await cache.delete_prefix(CATALOG_PREFIX)
    await activity.record(
        Action.CATEGORY_UPDATE,
        actor_id=admin.id,
        target_type="category",
        target_id=str(category_id),
    )
    return to_category_read(category)


@router.delete("/categories/{category_id}", response_model=Message)
async def delete_category(
    category_id: int, session: SessionDep, cache: CacheDep, admin: AdminUser, activity: ActivityDep
) -> Message:
    await catalog_service.delete_category(session, category_id)
    await cache.delete_prefix(CATALOG_PREFIX)
    await activity.record(
        Action.CATEGORY_DELETE,
        actor_id=admin.id,
        target_type="category",
        target_id=str(category_id),
    )
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


@router.get("/catalog/export", response_model=CatalogExport)
async def export_catalog(session: SessionDep) -> CatalogExport:
    categories = await catalog_service.export_categories(session)
    apps = await catalog_service.export_apps(session)
    return CatalogExport(
        categories=[to_category_read(c) for c in categories],
        apps=[to_app_read(a) for a in apps],
    )


@router.post("/apps/import", response_model=list[AppRead], status_code=status.HTTP_201_CREATED)
async def import_apps(
    data: AppImport, session: SessionDep, cache: CacheDep, admin: AdminUser, activity: ActivityDep
) -> list[AppRead]:
    apps = await catalog_service.import_apps(session, data.apps)
    await cache.delete_prefix(CATALOG_PREFIX)
    await activity.record(Action.APP_IMPORT, actor_id=admin.id, detail={"count": len(apps)})
    return [to_app_read(app) for app in apps]


@router.post("/apps", response_model=AppRead, status_code=status.HTTP_201_CREATED)
async def create_app(
    data: AppCreate, session: SessionDep, cache: CacheDep, admin: AdminUser, activity: ActivityDep
) -> AppRead:
    app = await catalog_service.create_app(session, data)
    await cache.delete_prefix(CATALOG_PREFIX)
    await activity.record(
        Action.APP_CREATE, actor_id=admin.id, target_type="app", target_id=str(app.id)
    )
    return to_app_read(app)


@router.patch("/apps/{app_id}", response_model=AppRead)
async def update_app(
    app_id: int,
    data: AppUpdate,
    session: SessionDep,
    cache: CacheDep,
    admin: AdminUser,
    activity: ActivityDep,
) -> AppRead:
    app = await catalog_service.update_app(session, app_id, data)
    await cache.delete_prefix(CATALOG_PREFIX)
    await activity.record(
        Action.APP_UPDATE, actor_id=admin.id, target_type="app", target_id=str(app_id)
    )
    return to_app_read(app)


@router.delete("/apps/{app_id}", response_model=Message)
async def delete_app(
    app_id: int, session: SessionDep, cache: CacheDep, admin: AdminUser, activity: ActivityDep
) -> Message:
    await catalog_service.delete_app(session, app_id)
    await cache.delete_prefix(CATALOG_PREFIX)
    await activity.record(
        Action.APP_DELETE, actor_id=admin.id, target_type="app", target_id=str(app_id)
    )
    return Message(message="App deleted.")


@router.post("/recompute-counts", response_model=Message)
async def recompute_counts(
    session: SessionDep, cache: CacheDep, admin: AdminUser, activity: ActivityDep
) -> Message:
    await catalog_service.recompute_counts(session)
    await cache.delete_prefix(CATALOG_PREFIX)
    await activity.record(Action.RECOMPUTE_COUNTS, actor_id=admin.id)
    return Message(message="Category counts recomputed.")


@router.post("/cleanup-tokens", response_model=TokenCleanupResult)
async def cleanup_tokens(
    session: SessionDep, admin: AdminUser, activity: ActivityDep
) -> TokenCleanupResult:
    counts = await maintenance.cleanup_expired_tokens(session)
    await activity.record(Action.CLEANUP_TOKENS, actor_id=admin.id, detail=counts)
    return TokenCleanupResult(**counts)


@router.get("/activity", response_model=Page[ActivityLogRead])
async def list_activity(
    pagination: PaginationDep,
    session: SessionDep,
    action: Annotated[str | None, Query(max_length=80)] = None,
    user_id: Annotated[uuid.UUID | None, Query()] = None,
    target_type: Annotated[str | None, Query(max_length=60)] = None,
    status_filter: Annotated[str | None, Query(alias="status", max_length=20)] = None,
    since: Annotated[datetime | None, Query()] = None,
    until: Annotated[datetime | None, Query()] = None,
) -> Page[ActivityLogRead]:
    logs, total = await activity_service.list_activity(
        session,
        pagination,
        action=action,
        user_id=user_id,
        target_type=target_type,
        status=status_filter,
        since=since,
        until=until,
    )
    return paginate([to_activity_read(log) for log in logs], total, pagination)


@router.get("/settings", response_model=SettingsRead)
async def get_runtime_settings(runtime: RuntimeSettingsDep) -> SettingsRead:
    await runtime.ensure_fresh()
    return settings_service.to_settings_read(runtime)


@router.patch("/settings", response_model=SettingsRead)
async def update_runtime_settings(
    data: SettingsUpdate, runtime: RuntimeSettingsDep, admin: AdminUser, activity: ActivityDep
) -> SettingsRead:
    await settings_service.update_settings(runtime, data)
    await activity.record(
        Action.SETTINGS_UPDATE,
        actor_id=admin.id,
        detail={"fields": sorted(data.model_dump(exclude_unset=True).keys())},
    )
    return settings_service.to_settings_read(runtime)
