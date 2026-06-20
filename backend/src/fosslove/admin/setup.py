from __future__ import annotations

from fastapi import FastAPI
from sqladmin import Admin
from sqlalchemy.ext.asyncio import AsyncEngine

from fosslove.admin.auth import AdminAuth
from fosslove.admin.views import (
    AppAdmin,
    CategoryAdmin,
    CollectionAdmin,
    PackageReferenceAdmin,
    ScriptRunAdmin,
    UserAdmin,
)
from fosslove.core.config import get_settings


def setup_admin(app: FastAPI, engine: AsyncEngine) -> Admin:
    settings = get_settings()
    backend = AdminAuth(secret_key=settings.SECRET_KEY.get_secret_value())
    admin = Admin(app, engine, authentication_backend=backend, title="FOSSLove Admin")
    for view in (
        CategoryAdmin,
        AppAdmin,
        PackageReferenceAdmin,
        UserAdmin,
        CollectionAdmin,
        ScriptRunAdmin,
    ):
        admin.add_view(view)
    return admin
