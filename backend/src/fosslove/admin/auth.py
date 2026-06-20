from __future__ import annotations

from sqladmin.authentication import AuthenticationBackend
from starlette.requests import Request

from fosslove.core.security import verify_password
from fosslove.db.models.enums import UserRole
from fosslove.db.session import get_sessionmaker
from fosslove.services import auth_service


class AdminAuth(AuthenticationBackend):
    async def login(self, request: Request) -> bool:
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
        return "admin_user" in request.session
