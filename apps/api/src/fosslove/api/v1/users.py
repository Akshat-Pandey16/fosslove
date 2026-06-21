from __future__ import annotations

import uuid

from fastapi import APIRouter, BackgroundTasks

from fosslove.api.deps import (
    ActivityDep,
    CurrentUser,
    EmailDep,
    RuntimeSettingsDep,
    SessionDep,
)
from fosslove.schemas.auth import ChangePasswordRequest, EmailChangeRequest
from fosslove.schemas.common import Message
from fosslove.schemas.user import SessionRead, UserDataExport, UserRead, UserUpdate
from fosslove.services import auth_service, user_service
from fosslove.services.activity_service import Action
from fosslove.services.mappers import to_session_read, to_user_read

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me", response_model=UserRead)
async def get_me(user: CurrentUser) -> UserRead:
    return to_user_read(user)


@router.patch("/me", response_model=UserRead)
async def update_me(
    data: UserUpdate, user: CurrentUser, session: SessionDep, activity: ActivityDep
) -> UserRead:
    updated = await user_service.update_profile(session, user, data)
    await activity.record(Action.PROFILE_UPDATE, actor_id=user.id)
    return to_user_read(updated)


@router.post("/me/change-password", response_model=Message)
async def change_password(
    data: ChangePasswordRequest, user: CurrentUser, session: SessionDep, activity: ActivityDep
) -> Message:
    await auth_service.change_password(session, user, data.current_password, data.new_password)
    await activity.record(Action.PASSWORD_CHANGE, actor_id=user.id)
    return Message(message="Password changed. Please log in again.")


@router.post("/me/email", response_model=Message)
async def request_email_change(
    data: EmailChangeRequest,
    background: BackgroundTasks,
    user: CurrentUser,
    session: SessionDep,
    email: EmailDep,
    runtime: RuntimeSettingsDep,
    activity: ActivityDep,
) -> Message:
    raw_token = await auth_service.request_email_change(
        session, user, data.new_email, runtime=runtime
    )
    if raw_token is not None:
        background.add_task(email.send_email_change, to=data.new_email, raw_token=raw_token)
    await activity.record(Action.EMAIL_CHANGE_REQUEST, actor_id=user.id, target_id=data.new_email)
    if raw_token is None:
        return Message(message="Email address updated.")
    return Message(message="Check your new email address to confirm the change.")


@router.get("/me/sessions", response_model=list[SessionRead])
async def list_sessions(user: CurrentUser, session: SessionDep) -> list[SessionRead]:
    tokens = await auth_service.list_sessions(session, user.id)
    return [to_session_read(token) for token in tokens]


@router.delete("/me/sessions/{token_id}", response_model=Message)
async def revoke_session(
    token_id: uuid.UUID, user: CurrentUser, session: SessionDep, activity: ActivityDep
) -> Message:
    await auth_service.revoke_session(session, user.id, token_id)
    await activity.record(
        Action.SESSION_REVOKE, actor_id=user.id, target_type="session", target_id=str(token_id)
    )
    return Message(message="Session revoked.")


@router.get("/me/export", response_model=UserDataExport)
async def export_my_data(
    user: CurrentUser, session: SessionDep, activity: ActivityDep
) -> UserDataExport:
    data = await user_service.export_data(session, user)
    await activity.record(Action.DATA_EXPORT, actor_id=user.id)
    return UserDataExport(user=to_user_read(user), **data)


@router.delete("/me", response_model=Message)
async def delete_me(user: CurrentUser, session: SessionDep, activity: ActivityDep) -> Message:
    user_id = user.id
    await user_service.delete_account(session, user)
    await activity.record(
        Action.ACCOUNT_DELETE, actor_id=None, target_type="user", target_id=str(user_id)
    )
    return Message(message="Account deleted.")
