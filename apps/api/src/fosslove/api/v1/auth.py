from __future__ import annotations

from fastapi import APIRouter, BackgroundTasks, Depends, Request, status

from fosslove.api.deps import (
    ActivityDep,
    EmailDep,
    RuntimeSettingsDep,
    SessionDep,
    enforce_auth_rate_limit,
)
from fosslove.core.exceptions import AuthenticationError
from fosslove.core.middleware import get_client_ip
from fosslove.schemas.auth import (
    EmailChangeConfirm,
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
from fosslove.services.activity_service import Action
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
    runtime: RuntimeSettingsDep,
    activity: ActivityDep,
) -> UserRead:
    user, raw_token = await auth_service.register(session, data, runtime=runtime)
    if raw_token is not None:
        background.add_task(email.send_verification, to=user.email, raw_token=raw_token)
    await activity.record(
        Action.REGISTER, actor_id=user.id, target_type="user", target_id=str(user.id)
    )
    return to_user_read(user)


@router.post("/login", response_model=TokenPair)
async def login(
    data: LoginRequest, request: Request, session: SessionDep, activity: ActivityDep
) -> TokenPair:
    try:
        tokens = await auth_service.login(
            session,
            data,
            user_agent=request.headers.get("user-agent"),
            client_ip=get_client_ip(request),
        )
    except AuthenticationError:
        await activity.record(
            Action.LOGIN_FAILED, status="failure", target_type="email", target_id=data.email
        )
        raise
    await activity.record(Action.LOGIN, target_type="email", target_id=data.email)
    return tokens


@router.post("/refresh", response_model=TokenPair)
async def refresh(
    data: RefreshRequest, request: Request, session: SessionDep, activity: ActivityDep
) -> TokenPair:
    tokens = await auth_service.refresh(
        session,
        data.refresh_token,
        user_agent=request.headers.get("user-agent"),
        client_ip=get_client_ip(request),
    )
    await activity.record(Action.TOKEN_REFRESH)
    return tokens


@router.post("/logout", response_model=Message)
async def logout(data: LogoutRequest, session: SessionDep, activity: ActivityDep) -> Message:
    await auth_service.logout(session, data.refresh_token)
    await activity.record(Action.LOGOUT)
    return Message(message="Logged out.")


@router.post("/verify-email", response_model=Message)
async def verify_email(
    data: VerifyEmailRequest, session: SessionDep, activity: ActivityDep
) -> Message:
    await auth_service.verify_email(session, data.token)
    await activity.record(Action.EMAIL_VERIFY)
    return Message(message="Email verified.")


@router.post("/resend-verification", response_model=Message)
async def resend_verification(
    data: EmailRequest,
    background: BackgroundTasks,
    session: SessionDep,
    email: EmailDep,
    runtime: RuntimeSettingsDep,
) -> Message:
    raw_token = await auth_service.resend_verification(session, data.email, runtime=runtime)
    if raw_token is not None:
        background.add_task(email.send_verification, to=data.email, raw_token=raw_token)
    return Message(message="If the account exists and is unverified, an email has been sent.")


@router.post("/password-reset", response_model=Message)
async def request_password_reset(
    data: EmailRequest,
    background: BackgroundTasks,
    session: SessionDep,
    email: EmailDep,
    runtime: RuntimeSettingsDep,
    activity: ActivityDep,
) -> Message:
    raw_token = await auth_service.request_password_reset(session, data.email, runtime=runtime)
    if raw_token is not None:
        background.add_task(email.send_password_reset, to=data.email, raw_token=raw_token)
    await activity.record(Action.PASSWORD_RESET_REQUEST, target_type="email", target_id=data.email)
    return Message(message="If the account exists, a reset email has been sent.")


@router.post("/password-reset/confirm", response_model=Message)
async def confirm_password_reset(
    data: PasswordResetConfirm, session: SessionDep, activity: ActivityDep
) -> Message:
    await auth_service.reset_password(session, data.token, data.new_password)
    await activity.record(Action.PASSWORD_RESET)
    return Message(message="Password updated. Please log in.")


@router.post("/email-change/confirm", response_model=Message)
async def confirm_email_change(
    data: EmailChangeConfirm, session: SessionDep, activity: ActivityDep
) -> Message:
    await auth_service.confirm_email_change(session, data.token)
    await activity.record(Action.EMAIL_CHANGE)
    return Message(message="Email address updated. Please log in again.")
