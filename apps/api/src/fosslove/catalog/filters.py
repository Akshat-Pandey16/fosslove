from __future__ import annotations

from typing import Any

import django_filters
from django.contrib.postgres.search import TrigramWordSimilarity
from django.db.models import Q, QuerySet
from django.db.models.functions import Greatest

from fosslove.catalog.enums import Platform
from fosslove.catalog.models import App

SIMILARITY_THRESHOLD = 0.25


class AppFilter(django_filters.FilterSet):
    platform = django_filters.ChoiceFilter(choices=Platform.choices)
    category_id = django_filters.NumberFilter(field_name="category_id")
    q = django_filters.CharFilter(method="search", max_length=100)

    class Meta:
        model = App
        fields: list[str] = []

    def search(self, queryset: QuerySet[App], name: str, value: str) -> QuerySet[App]:
        term = value.strip()
        if not term:
            return queryset
        return (
            queryset.annotate(
                rank=Greatest(
                    TrigramWordSimilarity(term, "name"),
                    TrigramWordSimilarity(term, "summary"),
                )
            )
            .filter(
                Q(rank__gte=SIMILARITY_THRESHOLD)
                | Q(name__icontains=term)
                | Q(summary__icontains=term)
            )
            .order_by("-rank", "name", "pk")
        )


class ActivityLogFilterMixin:
    @staticmethod
    def normalized(params: dict[str, Any], key: str) -> str | None:
        value = params.get(key)
        return value.strip() if isinstance(value, str) and value.strip() else None
