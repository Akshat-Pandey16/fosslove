from __future__ import annotations

import uuid
from typing import Annotated, Any

from fastapi import Depends, Query, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from fosslove.core.cache import Cache
from fosslove.core.config import Settings, get_settings
from fosslove.core.exceptions import AuthenticationError, PermissionDeniedError, RateLimitError
from fosslove.core.middleware import get_client_ip
from fosslove.core.pagination import DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, Pagination, build_pagination
from fosslove.core.ratelimit import RateLimiter
from fosslove.core.runtime_settings import RuntimeSettings
from fosslove.core.security import TokenType, decode_token
from fosslove.db.models.enums import UserRole
from fosslove.db.models.user import User
from fosslove.db.session import get_session
from fosslove.services import activity_service, user_service
from fosslove.services.email import EmailSender


class ActivityRecorder:
    def __init__(self, request: Request) -> None:
        self._request = request

    async def record(
        self,
        action: str,
        *,
        actor_id: uuid.UUID | None = None,
        status: str = "ok",
        target_type: str | None = None,
        target_id: str | None = None,
        detail: dict[str, Any] | None = None,
    ) -> None:
        await activity_service.record(
            action=action,
            user_id=actor_id,
            status=status,
            target_type=target_type,
            target_id=target_id,
            client_ip=get_client_ip(self._request),
            request_id=getattr(self._request.state, "request_id", None),
            user_agent=self._request.headers.get("user-agent"),
            detail=detail,
        )


def get_activity_recorder(request: Request) -> ActivityRecorder:
    return ActivityRecorder(request)


ActivityDep = Annotated[ActivityRecorder, Depends(get_activity_recorder)]

_bearer = HTTPBearer(auto_error=False)

SessionDep = Annotated[AsyncSession, Depends(get_session)]
SettingsDep = Annotated[Settings, Depends(get_settings)]


def get_email_sender(request: Request) -> EmailSender:
    sender: EmailSender = request.app.state.email_sender
    return sender


EmailDep = Annotated[EmailSender, Depends(get_email_sender)]


def get_cache(request: Request) -> Cache:
    cache: Cache = request.app.state.cache
    return cache


CacheDep = Annotated[Cache, Depends(get_cache)]


def get_runtime_settings(request: Request) -> RuntimeSettings:
    runtime: RuntimeSettings = request.app.state.runtime_settings
    return runtime


RuntimeSettingsDep = Annotated[RuntimeSettings, Depends(get_runtime_settings)]


def pagination_params(
    page: Annotated[int, Query(ge=1)] = 1,
    size: Annotated[int, Query(ge=1, le=MAX_PAGE_SIZE)] = DEFAULT_PAGE_SIZE,
) -> Pagination:
    return build_pagination(page, size)


PaginationDep = Annotated[Pagination, Depends(pagination_params)]


async def get_current_user_optional(
    session: SessionDep,
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer)],
) -> User | None:
    if credentials is None:
        return None
    payload = decode_token(credentials.credentials, expected_type=TokenType.ACCESS)
    user = await user_service.get_user(session, uuid.UUID(payload["sub"]))
    if user is None or not user.is_active:
        raise AuthenticationError("Account is unavailable.", code="account_disabled")
    return user


OptionalUser = Annotated[User | None, Depends(get_current_user_optional)]


async def get_current_user(
    user: Annotated[User | None, Depends(get_current_user_optional)],
) -> User:
    if user is None:
        raise AuthenticationError("Authentication required.")
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


async def require_verified(user: CurrentUser) -> User:
    if not user.is_verified:
        raise PermissionDeniedError(
            "Please verify your email address to use this feature.", code="email_unverified"
        )
    return user


VerifiedUser = Annotated[User, Depends(require_verified)]


async def require_admin(user: CurrentUser) -> User:
    if user.role is not UserRole.ADMIN:
        raise PermissionDeniedError()
    return user


AdminUser = Annotated[User, Depends(require_admin)]


async def enforce_auth_rate_limit(request: Request) -> None:
    limiter: RateLimiter | None = getattr(request.app.state, "rate_limiter", None)
    runtime: RuntimeSettings | None = getattr(request.app.state, "runtime_settings", None)
    if limiter is None or runtime is None:
        return
    await runtime.ensure_fresh()
    if not runtime.rate_limit_enabled:
        return
    item = limiter.parse_spec(runtime.rate_limit_auth)
    result = await limiter.hit(f"auth:{get_client_ip(request)}", item, fail_open=False)
    if not result.allowed:
        raise RateLimitError(
            "Too many authentication attempts. Please wait.",
            details={"retry_after": result.reset_after},
        )
