from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import Field, field_validator, model_validator

from fosslove.db.models.enums import PackageManager, Platform
from fosslove.schemas.common import APIModel, StrictModel, validate_http_url


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

    @model_validator(mode="after")
    def _validate_direct_url(self) -> PackageReferenceCreate:
        if self.manager is PackageManager.DIRECT:
            validate_http_url(self.identifier)
        return self


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

    _validate_icon = field_validator("icon_url")(validate_http_url)


class CategoryUpdate(StrictModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    description: str | None = Field(default=None, max_length=2000)
    icon_url: str | None = Field(default=None, max_length=500)

    @field_validator("name")
    @classmethod
    def _strip_name(cls, value: str | None) -> str | None:
        return value.strip() if value else None

    _validate_icon = field_validator("icon_url")(validate_http_url)


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

    _validate_homepage = field_validator("homepage_url")(validate_http_url)


class AppUpdate(StrictModel):
    category_id: int | None = Field(default=None, gt=0)
    name: str | None = Field(default=None, min_length=1, max_length=200)
    summary: str | None = Field(default=None, max_length=300)
    description: str | None = None
    homepage_url: str | None = Field(default=None, max_length=500)
    license: str | None = Field(default=None, max_length=100)
    is_active: bool | None = None
    package_refs: list[PackageReferenceCreate] | None = None

    @field_validator("name")
    @classmethod
    def _strip_name(cls, value: str | None) -> str | None:
        return value.strip() if value else None

    _validate_homepage = field_validator("homepage_url")(validate_http_url)


class AppListItem(APIModel):
    id: int
    category_id: int
    category_name: str
    category_slug: str
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


MAX_IMPORT_APPS = 500


class AppImport(StrictModel):
    apps: list[AppCreate] = Field(min_length=1, max_length=MAX_IMPORT_APPS)


class CatalogExport(APIModel):
    categories: list[CategoryRead]
    apps: list[AppRead]
