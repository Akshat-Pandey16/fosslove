from __future__ import annotations

from typing import Any

from sqladmin import ModelView
from starlette.requests import Request

from fosslove.db.models.catalog import App, Category, PackageReference
from fosslove.db.models.user import User
from fosslove.db.models.userdata import Collection, ScriptRun
from fosslove.utils import make_slug


class CategoryAdmin(ModelView, model=Category):
    name = "Category"
    name_plural = "Categories"
    icon = "fa-solid fa-folder"
    column_list = ["id", "name", "slug", "windows_app_count", "linux_app_count"]
    column_searchable_list = ["name"]
    column_sortable_list = ["id", "name"]
    form_excluded_columns = [
        "apps",
        "slug",
        "windows_app_count",
        "linux_app_count",
        "created_at",
        "updated_at",
    ]

    async def on_model_change(
        self, data: dict[str, Any], model: Any, is_created: bool, request: Request
    ) -> None:
        if data.get("name"):
            data["slug"] = make_slug(str(data["name"]))


class AppAdmin(ModelView, model=App):
    name = "App"
    name_plural = "Apps"
    icon = "fa-solid fa-box"
    column_list = ["id", "name", "platform", "category", "is_active"]
    column_searchable_list = ["name"]
    column_sortable_list = ["id", "name", "platform"]
    form_excluded_columns = [
        "slug",
        "package_refs",
        "collection_links",
        "favorited_by",
        "created_at",
        "updated_at",
    ]

    async def on_model_change(
        self, data: dict[str, Any], model: Any, is_created: bool, request: Request
    ) -> None:
        if data.get("name"):
            data["slug"] = make_slug(str(data["name"]))


class PackageReferenceAdmin(ModelView, model=PackageReference):
    name = "Package Reference"
    name_plural = "Package References"
    icon = "fa-solid fa-cube"
    column_list = ["id", "app", "manager", "identifier", "priority"]
    column_searchable_list = ["identifier"]
    form_excluded_columns = ["created_at", "updated_at"]


class UserAdmin(ModelView, model=User):
    name = "User"
    name_plural = "Users"
    icon = "fa-solid fa-user"
    column_list = ["id", "email", "role", "is_active", "is_verified", "created_at"]
    column_searchable_list = ["email"]
    column_details_exclude_list = ["hashed_password"]
    form_columns = ["full_name", "role", "is_active", "is_verified"]
    can_create = False


class CollectionAdmin(ModelView, model=Collection):
    name = "Collection"
    name_plural = "Collections"
    icon = "fa-solid fa-layer-group"
    column_list = ["id", "name", "user", "is_public", "created_at"]
    can_create = False
    can_edit = False


class ScriptRunAdmin(ModelView, model=ScriptRun):
    name = "Script Run"
    name_plural = "Script Runs"
    icon = "fa-solid fa-scroll"
    column_list = ["id", "user", "platform", "app_count", "created_at"]
    can_create = False
    can_edit = False
