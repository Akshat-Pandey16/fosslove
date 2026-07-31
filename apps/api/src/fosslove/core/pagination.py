from __future__ import annotations

from collections import OrderedDict
from typing import Any, cast

from django.core.paginator import Page
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response

MAX_PAGE_SIZE = 100


class PageNumberMetaPagination(PageNumberPagination):
    page_size_query_param = "size"
    page_query_param = "page"
    max_page_size = MAX_PAGE_SIZE

    def get_paginated_response(self, data: Any) -> Response:
        page = cast("Page[Any]", self.page)
        return Response(
            OrderedDict(
                [
                    ("items", data),
                    (
                        "meta",
                        OrderedDict(
                            [
                                ("page", page.number),
                                ("size", page.paginator.per_page),
                                ("total", page.paginator.count),
                                ("pages", page.paginator.num_pages),
                            ]
                        ),
                    ),
                ]
            )
        )

    def get_paginated_response_schema(self, schema: Any) -> dict[str, Any]:
        return {
            "type": "object",
            "required": ["items", "meta"],
            "properties": {
                "items": schema,
                "meta": {
                    "type": "object",
                    "required": ["page", "size", "total", "pages"],
                    "properties": {
                        "page": {"type": "integer"},
                        "size": {"type": "integer"},
                        "total": {"type": "integer"},
                        "pages": {"type": "integer"},
                    },
                },
            },
        }
