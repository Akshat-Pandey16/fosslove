from __future__ import annotations

from pydantic import BaseModel, ConfigDict, HttpUrl, TypeAdapter

from fosslove.core.pagination import Pagination

_HTTP_URL_ADAPTER = TypeAdapter(HttpUrl)


def validate_http_url(value: str | None) -> str | None:
    if value is None:
        return None
    cleaned = value.strip()
    if not cleaned:
        return None
    _HTTP_URL_ADAPTER.validate_python(cleaned)
    return cleaned


class APIModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid")


class Message(BaseModel):
    message: str


class TokenCleanupResult(BaseModel):
    refresh_tokens: int
    verification_tokens: int


class PageMeta(BaseModel):
    page: int
    size: int
    total: int
    pages: int


class Page[T](BaseModel):
    items: list[T]
    meta: PageMeta


def paginate[T](items: list[T], total: int, pagination: Pagination) -> Page[T]:
    size = pagination.size or 1
    pages = (total + size - 1) // size
    meta = PageMeta(page=pagination.page, size=pagination.size, total=total, pages=pages)
    return Page(items=items, meta=meta)
