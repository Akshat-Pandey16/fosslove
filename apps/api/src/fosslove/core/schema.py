from __future__ import annotations

from typing import Any

from drf_spectacular.utils import OpenApiParameter, inline_serializer
from rest_framework import serializers


class PageMetaSerializer(serializers.Serializer[Any]):
    page = serializers.IntegerField(read_only=True)
    size = serializers.IntegerField(read_only=True)
    total = serializers.IntegerField(read_only=True)
    pages = serializers.IntegerField(read_only=True)


def paginated(serializer_class: type[serializers.BaseSerializer[Any]], name: str) -> Any:
    return inline_serializer(
        name=name,
        fields={
            "items": serializer_class(many=True, read_only=True),
            "meta": PageMetaSerializer(read_only=True),
        },
    )


def query_parameter(name: str, schema: Any, **kwargs: Any) -> OpenApiParameter:
    return OpenApiParameter(name, schema, OpenApiParameter.QUERY, **kwargs)


def page_parameters(*extra: OpenApiParameter) -> list[OpenApiParameter]:
    return [
        query_parameter("page", int),
        query_parameter("size", int),
        *extra,
    ]
