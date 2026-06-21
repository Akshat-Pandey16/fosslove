from __future__ import annotations

from fastapi import APIRouter, status

from fosslove.api.deps import ActivityDep, OptionalUser, PaginationDep, SessionDep, VerifiedUser
from fosslove.schemas.collection import (
    CollectionCreate,
    CollectionDetail,
    CollectionRead,
    CollectionSetApps,
    CollectionUpdate,
)
from fosslove.schemas.common import Page, paginate
from fosslove.services import collection_service
from fosslove.services.activity_service import Action
from fosslove.services.mappers import to_collection_detail, to_collection_read

router = APIRouter(prefix="/collections", tags=["Collections"])


@router.get("", response_model=Page[CollectionRead])
async def list_my_collections(
    user: VerifiedUser, pagination: PaginationDep, session: SessionDep
) -> Page[CollectionRead]:
    rows, total = await collection_service.list_user_collections(session, user.id, pagination)
    return paginate([to_collection_read(c, count) for c, count in rows], total, pagination)


@router.get("/public", response_model=Page[CollectionRead])
async def list_public_collections(
    pagination: PaginationDep, session: SessionDep
) -> Page[CollectionRead]:
    rows, total = await collection_service.list_public_collections(session, pagination)
    return paginate([to_collection_read(c, count) for c, count in rows], total, pagination)


@router.post("", response_model=CollectionDetail, status_code=status.HTTP_201_CREATED)
async def create_collection(
    data: CollectionCreate, user: VerifiedUser, session: SessionDep, activity: ActivityDep
) -> CollectionDetail:
    collection = await collection_service.create_collection(session, user.id, data)
    await activity.record(
        Action.COLLECTION_CREATE,
        actor_id=user.id,
        target_type="collection",
        target_id=str(collection.id),
    )
    return to_collection_detail(collection)


@router.get("/{collection_id}", response_model=CollectionDetail)
async def get_collection(
    collection_id: int, session: SessionDep, user: OptionalUser
) -> CollectionDetail:
    viewer_id = user.id if user else None
    collection = await collection_service.get_viewable_collection(session, collection_id, viewer_id)
    return to_collection_detail(collection)


@router.patch("/{collection_id}", response_model=CollectionDetail)
async def update_collection(
    collection_id: int,
    data: CollectionUpdate,
    user: VerifiedUser,
    session: SessionDep,
    activity: ActivityDep,
) -> CollectionDetail:
    collection = await collection_service.get_owned_collection(session, collection_id, user.id)
    collection = await collection_service.update_collection(session, collection, data)
    await activity.record(
        Action.COLLECTION_UPDATE,
        actor_id=user.id,
        target_type="collection",
        target_id=str(collection_id),
    )
    return to_collection_detail(collection)


@router.patch("/{collection_id}/apps", response_model=CollectionDetail)
async def set_collection_apps(
    collection_id: int,
    data: CollectionSetApps,
    user: VerifiedUser,
    session: SessionDep,
    activity: ActivityDep,
) -> CollectionDetail:
    collection = await collection_service.get_owned_collection(session, collection_id, user.id)
    collection = await collection_service.set_apps(session, collection, data.app_ids)
    await activity.record(
        Action.COLLECTION_SET_APPS,
        actor_id=user.id,
        target_type="collection",
        target_id=str(collection_id),
    )
    return to_collection_detail(collection)


@router.delete("/{collection_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_collection(
    collection_id: int, user: VerifiedUser, session: SessionDep, activity: ActivityDep
) -> None:
    collection = await collection_service.get_owned_collection(session, collection_id, user.id)
    await collection_service.delete_collection(session, collection)
    await activity.record(
        Action.COLLECTION_DELETE,
        actor_id=user.id,
        target_type="collection",
        target_id=str(collection_id),
    )
