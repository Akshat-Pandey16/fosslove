from __future__ import annotations

from fastapi import APIRouter, BackgroundTasks, Depends, status

from fosslove.api.deps import EmailDep, SessionDep, enforce_auth_rate_limit
from fosslove.schemas.auth import (
    EmailRequest,
    LoginRequest,
    LogoutRequest,
    PasswordResetConfirm,
    RefreshRequest,
    RegisterRequest,
    TokenPair,
    VerifyEmailRequest,
)
from fosslove.schemas.common import Message
from fosslove.schemas.user import UserRead
from fosslove.services import auth_service
from fosslove.services.mappers import to_user_read

router = APIRouter(
    prefix="/auth",
    tags=["Auth"],
    dependencies=[Depends(enforce_auth_rate_limit)],
)


@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
async def register(
    data: RegisterRequest,
    background: BackgroundTasks,
    session: SessionDep,
    email: EmailDep,
) -> UserRead:
    user, raw_token = await auth_service.register(session, data)
    background.add_task(email.send_verification, to=user.email, raw_token=raw_token)
    return to_user_read(user)


@router.post("/login", response_model=TokenPair)
async def login(data: LoginRequest, session: SessionDep) -> TokenPair:
    return await auth_service.login(session, data)


@router.post("/refresh", response_model=TokenPair)
async def refresh(data: RefreshRequest, session: SessionDep) -> TokenPair:
    return await auth_service.refresh(session, data.refresh_token)


@router.post("/logout", response_model=Message)
async def logout(data: LogoutRequest, session: SessionDep) -> Message:
    await auth_service.logout(session, data.refresh_token)
    return Message(message="Logged out.")


@router.post("/verify-email", response_model=Message)
async def verify_email(data: VerifyEmailRequest, session: SessionDep) -> Message:
    await auth_service.verify_email(session, data.token)
    return Message(message="Email verified.")


@router.post("/resend-verification", response_model=Message)
async def resend_verification(
    data: EmailRequest,
    background: BackgroundTasks,
    session: SessionDep,
    email: EmailDep,
) -> Message:
    raw_token = await auth_service.resend_verification(session, data.email)
    if raw_token is not None:
        background.add_task(email.send_verification, to=data.email, raw_token=raw_token)
    return Message(message="If the account exists and is unverified, an email has been sent.")


@router.post("/password-reset", response_model=Message)
async def request_password_reset(
    data: EmailRequest,
    background: BackgroundTasks,
    session: SessionDep,
    email: EmailDep,
) -> Message:
    raw_token = await auth_service.request_password_reset(session, data.email)
    if raw_token is not None:
        background.add_task(email.send_password_reset, to=data.email, raw_token=raw_token)
    return Message(message="If the account exists, a reset email has been sent.")


@router.post("/password-reset/confirm", response_model=Message)
async def confirm_password_reset(data: PasswordResetConfirm, session: SessionDep) -> Message:
    await auth_service.reset_password(session, data.token, data.new_password)
    return Message(message="Password updated. Please log in.")
