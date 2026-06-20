from __future__ import annotations

from dataclasses import dataclass

DEFAULT_PAGE_SIZE = 20
MAX_PAGE_SIZE = 100


@dataclass(frozen=True, slots=True)
class Pagination:
    page: int
    size: int

    @property
    def limit(self) -> int:
        return self.size

    @property
    def offset(self) -> int:
        return (self.page - 1) * self.size


def build_pagination(page: int, size: int) -> Pagination:
    page = max(1, page)
    size = min(max(1, size), MAX_PAGE_SIZE)
    return Pagination(page=page, size=size)
