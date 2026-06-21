from __future__ import annotations

from dataclasses import dataclass

DEFAULT_PAGE_SIZE = 20
MAX_PAGE_SIZE = 100
MAX_RESULT_WINDOW = 50_000


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
    size = min(max(1, size), MAX_PAGE_SIZE)
    max_page = MAX_RESULT_WINDOW // size + 1
    page = min(max(1, page), max_page)
    return Pagination(page=page, size=size)
