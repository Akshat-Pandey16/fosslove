from __future__ import annotations

from fastapi import APIRouter

from fosslove.api.deps import CurrentUser, PaginationDep, SessionDep
from fosslove.schemas.catalog import AppListItem
from fosslove.schemas.common import Message, Page, paginate
from fosslove.services import favorite_service
from fosslove.services.mappers import to_app_list_item

router = APIRouter(prefix="/favorites", tags=["Favorites"])


@router.get("", response_model=Page[AppListItem])
async def list_favorites(
    user: CurrentUser, pagination: PaginationDep, session: SessionDep
) -> Page[AppListItem]:
    apps, total = await favorite_service.list_favorites(session, user.id, pagination)
    return paginate([to_app_list_item(a) for a in apps], total, pagination)


@router.patch("/{app_id}", response_model=Message)
async def add_favorite(app_id: int, user: CurrentUser, session: SessionDep) -> Message:
    await favorite_service.add_favorite(session, user.id, app_id)
    return Message(message="Added to favorites.")


@router.delete("/{app_id}", response_model=Message)
async def remove_favorite(app_id: int, user: CurrentUser, session: SessionDep) -> Message:
    await favorite_service.remove_favorite(session, user.id, app_id)
    return Message(message="Removed from favorites.")
