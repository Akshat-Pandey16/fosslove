from __future__ import annotations

import uuid

from sqladmin.authentication import AuthenticationBackend
from starlette.requests import Request

from fosslove.core.middleware import get_client_ip
from fosslove.core.ratelimit import RateLimiter
from fosslove.core.runtime_settings import RuntimeSettings
from fosslove.core.security import verify_password
from fosslove.db.models.enums import UserRole
from fosslove.db.session import get_sessionmaker
from fosslove.services import auth_service, user_service


async def _login_allowed(request: Request) -> bool:
    limiter: RateLimiter | None = getattr(request.app.state, "rate_limiter", None)
    runtime: RuntimeSettings | None = getattr(request.app.state, "runtime_settings", None)
    if limiter is None or runtime is None:
        return True
    await runtime.ensure_fresh()
    if not runtime.rate_limit_enabled:
        return True
    item = limiter.parse_spec(runtime.rate_limit_auth)
    result = await limiter.hit(f"admin-login:{get_client_ip(request)}", item, fail_open=False)
    return result.allowed


class AdminAuth(AuthenticationBackend):
    async def login(self, request: Request) -> bool:
        if not await _login_allowed(request):
            return False
        form = await request.form()
        email = str(form.get("username", ""))
        password = str(form.get("password", ""))
        factory = get_sessionmaker()
        async with factory() as session:
            user = await auth_service.get_user_by_email(session, email)
        if (
            user is not None
            and user.is_active
            and user.role is UserRole.ADMIN
            and verify_password(password, user.hashed_password)
        ):
            request.session.update({"admin_user": str(user.id)})
            return True
        return False

    async def logout(self, request: Request) -> bool:
        request.session.clear()
        return True

    async def authenticate(self, request: Request) -> bool:
        raw_id = request.session.get("admin_user")
        if not raw_id:
            return False
        try:
            user_id = uuid.UUID(str(raw_id))
        except ValueError:
            return False
        factory = get_sessionmaker()
        async with factory() as session:
            user = await user_service.get_user(session, user_id)
        return user is not None and user.is_active and user.role is UserRole.ADMIN
