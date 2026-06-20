from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import Field, field_validator

from fosslove.db.models.enums import PackageManager, Platform
from fosslove.schemas.common import APIModel, StrictModel


class PackageReferenceCreate(StrictModel):
    manager: PackageManager
    identifier: str = Field(min_length=1, max_length=500)
    install_args: str | None = Field(default=None, max_length=500)
    priority: int = Field(default=100, ge=0)
    extra: dict[str, Any] | None = None

    @field_validator("identifier")
    @classmethod
    def _strip(cls, value: str) -> str:
        return value.strip()


class PackageReferenceRead(APIModel):
    id: int
    manager: PackageManager
    identifier: str
    install_args: str | None
    priority: int
    extra: dict[str, Any] | None


class CategoryCreate(StrictModel):
    name: str = Field(min_length=1, max_length=100)
    description: str | None = Field(default=None, max_length=2000)
    icon_url: str | None = Field(default=None, max_length=500)

    @field_validator("name")
    @classmethod
    def _strip_name(cls, value: str) -> str:
        return value.strip()


class CategoryUpdate(StrictModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    description: str | None = Field(default=None, max_length=2000)
    icon_url: str | None = Field(default=None, max_length=500)


class CategoryRead(APIModel):
    id: int
    name: str
    slug: str
    description: str | None
    icon_url: str | None
    windows_app_count: int
    linux_app_count: int
    created_at: datetime


class AppCreate(StrictModel):
    category_id: int = Field(gt=0)
    platform: Platform
    name: str = Field(min_length=1, max_length=200)
    summary: str | None = Field(default=None, max_length=300)
    description: str | None = None
    homepage_url: str | None = Field(default=None, max_length=500)
    license: str | None = Field(default=None, max_length=100)
    package_refs: list[PackageReferenceCreate] = Field(default_factory=list)

    @field_validator("name")
    @classmethod
    def _strip_name(cls, value: str) -> str:
        return value.strip()


class AppUpdate(StrictModel):
    category_id: int | None = Field(default=None, gt=0)
    name: str | None = Field(default=None, min_length=1, max_length=200)
    summary: str | None = Field(default=None, max_length=300)
    description: str | None = None
    homepage_url: str | None = Field(default=None, max_length=500)
    license: str | None = Field(default=None, max_length=100)
    is_active: bool | None = None


class AppListItem(APIModel):
    id: int
    category_id: int
    category_name: str
    platform: Platform
    name: str
    slug: str
    summary: str | None
    homepage_url: str | None
    is_active: bool


class AppRead(AppListItem):
    description: str | None
    license: str | None
    package_refs: list[PackageReferenceRead]
    created_at: datetime
    updated_at: datetime
