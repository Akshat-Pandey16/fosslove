from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import Field, field_validator

from fosslove.schemas.catalog import AppListItem
from fosslove.schemas.common import APIModel, StrictModel

MAX_COLLECTION_APPS = 500


def _dedupe_positive(values: list[int]) -> list[int]:
    seen: set[int] = set()
    result: list[int] = []
    for value in values:
        if value <= 0:
            raise ValueError("App IDs must be positive integers")
        if value not in seen:
            seen.add(value)
            result.append(value)
    if len(result) > MAX_COLLECTION_APPS:
        raise ValueError(f"A collection may contain at most {MAX_COLLECTION_APPS} apps")
    return result


class CollectionCreate(StrictModel):
    name: str = Field(min_length=1, max_length=120)
    description: str | None = Field(default=None, max_length=2000)
    is_public: bool = False
    app_ids: list[int] = Field(default_factory=list)

    @field_validator("name")
    @classmethod
    def _strip(cls, value: str) -> str:
        return value.strip()

    @field_validator("app_ids")
    @classmethod
    def _apps(cls, value: list[int]) -> list[int]:
        return _dedupe_positive(value)


class CollectionUpdate(StrictModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    description: str | None = Field(default=None, max_length=2000)
    is_public: bool | None = None


class CollectionSetApps(StrictModel):
    app_ids: list[int]

    @field_validator("app_ids")
    @classmethod
    def _apps(cls, value: list[int]) -> list[int]:
        return _dedupe_positive(value)


class CollectionItemRead(APIModel):
    app: AppListItem
    position: int


class CollectionRead(APIModel):
    id: int
    user_id: uuid.UUID
    name: str
    slug: str
    description: str | None
    is_public: bool
    item_count: int
    created_at: datetime
    updated_at: datetime


class CollectionDetail(CollectionRead):
    items: list[CollectionItemRead]
