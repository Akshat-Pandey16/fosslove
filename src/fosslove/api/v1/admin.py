from __future__ import annotations

from fastapi import APIRouter, Depends, status

from fosslove.api.deps import SessionDep, require_admin
from fosslove.schemas.catalog import (
    AppCreate,
    AppRead,
    AppUpdate,
    CategoryCreate,
    CategoryRead,
    CategoryUpdate,
)
from fosslove.schemas.common import Message
from fosslove.services import catalog_service, maintenance
from fosslove.services.mappers import to_app_read, to_category_read

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
