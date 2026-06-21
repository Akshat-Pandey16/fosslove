from __future__ import annotations

from fastapi import APIRouter, status

from fosslove.api.deps import ActivityDep, PaginationDep, SessionDep, VerifiedUser
from fosslove.schemas.catalog import AppListItem
from fosslove.schemas.common import Page, paginate
from fosslove.services import favorite_service
from fosslove.services.activity_service import Action
from fosslove.services.mappers import to_app_list_item

router = APIRouter(prefix="/favorites", tags=["Favorites"])


@router.get("", response_model=Page[AppListItem])
async def list_favorites(
    user: VerifiedUser, pagination: PaginationDep, session: SessionDep
) -> Page[AppListItem]:
    apps, total = await favorite_service.list_favorites(session, user.id, pagination)
    return paginate([to_app_list_item(a) for a in apps], total, pagination)


@router.get("/ids", response_model=list[int])
async def list_favorite_ids(user: VerifiedUser, session: SessionDep) -> list[int]:
    return await favorite_service.favorite_ids(session, user.id)


@router.post("/{app_id}", status_code=status.HTTP_204_NO_CONTENT)
async def add_favorite(
    app_id: int, user: VerifiedUser, session: SessionDep, activity: ActivityDep
) -> None:
    await favorite_service.add_favorite(session, user.id, app_id)
    await activity.record(
        Action.FAVORITE_ADD, actor_id=user.id, target_type="app", target_id=str(app_id)
    )


@router.delete("/{app_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_favorite(
    app_id: int, user: VerifiedUser, session: SessionDep, activity: ActivityDep
) -> None:
    await favorite_service.remove_favorite(session, user.id, app_id)
    await activity.record(
        Action.FAVORITE_REMOVE, actor_id=user.id, target_type="app", target_id=str(app_id)
    )
