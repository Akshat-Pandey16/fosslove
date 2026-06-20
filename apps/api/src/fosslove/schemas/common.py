from __future__ import annotations

from pydantic import BaseModel, ConfigDict

from fosslove.core.pagination import Pagination


class APIModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid")


class Message(BaseModel):
    message: str


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
