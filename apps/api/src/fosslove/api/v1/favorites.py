from __future__ import annotations

from fastapi import APIRouter

from fosslove.api.deps import ActivityDep, CurrentUser, PaginationDep, SessionDep
from fosslove.schemas.catalog import AppListItem
from fosslove.schemas.common import Message, Page, paginate
from fosslove.services import favorite_service
from fosslove.services.activity_service import Action
from fosslove.services.mappers import to_app_list_item

router = APIRouter(prefix="/favorites", tags=["Favorites"])


@router.get("", response_model=Page[AppListItem])
async def list_favorites(
    user: CurrentUser, pagination: PaginationDep, session: SessionDep
) -> Page[AppListItem]:
    apps, total = await favorite_service.list_favorites(session, user.id, pagination)
    return paginate([to_app_list_item(a) for a in apps], total, pagination)


@router.put("/{app_id}", response_model=Message)
async def add_favorite(
    app_id: int, user: CurrentUser, session: SessionDep, activity: ActivityDep
) -> Message:
    await favorite_service.add_favorite(session, user.id, app_id)
    await activity.record(
        Action.FAVORITE_ADD, actor_id=user.id, target_type="app", target_id=str(app_id)
    )
    return Message(message="Added to favorites.")


@router.delete("/{app_id}", response_model=Message)
async def remove_favorite(
    app_id: int, user: CurrentUser, session: SessionDep, activity: ActivityDep
) -> Message:
    await favorite_service.remove_favorite(session, user.id, app_id)
    await activity.record(
        Action.FAVORITE_REMOVE, actor_id=user.id, target_type="app", target_id=str(app_id)
    )
    return Message(message="Removed from favorites.")
