from __future__ import annotations

from fastapi import APIRouter

from fosslove.api.deps import CurrentUser, SessionDep
from fosslove.schemas.auth import ChangePasswordRequest
from fosslove.schemas.common import Message
from fosslove.schemas.user import UserRead, UserUpdate
from fosslove.services import auth_service, user_service
from fosslove.services.mappers import to_user_read

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me", response_model=UserRead)
async def get_me(user: CurrentUser) -> UserRead:
    return to_user_read(user)


@router.patch("/me", response_model=UserRead)
async def update_me(data: UserUpdate, user: CurrentUser, session: SessionDep) -> UserRead:
    updated = await user_service.update_profile(session, user, data)
    return to_user_read(updated)


@router.post("/me/change-password", response_model=Message)
async def change_password(
    data: ChangePasswordRequest, user: CurrentUser, session: SessionDep
) -> Message:
    await auth_service.change_password(session, user, data.current_password, data.new_password)
    return Message(message="Password changed. Please log in again.")


@router.delete("/me", response_model=Message)
async def delete_me(user: CurrentUser, session: SessionDep) -> Message:
    await user_service.delete_account(session, user)
    return Message(message="Account deleted.")
