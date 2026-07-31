from __future__ import annotations

from django.db.models import Count, IntegerField, OuterRef, Q, Subquery
from django.db.models.functions import Coalesce

from fosslove.catalog.enums import Platform
from fosslove.catalog.models import App, Category


def _count_subquery(platform: str) -> Subquery:
    return Subquery(
        App.objects.filter(category=OuterRef("pk"), platform=platform, is_active=True)
        .order_by()
        .values("category")
        .annotate(total=Count("pk"))
        .values("total")[:1],
        output_field=IntegerField(),
    )


def recompute_category_counts() -> int:
    return Category.objects.update(
        windows_app_count=Coalesce(_count_subquery(Platform.WINDOWS), 0),
        linux_app_count=Coalesce(_count_subquery(Platform.LINUX), 0),
    )


def catalog_totals() -> dict[str, int]:
    return App.objects.aggregate(
        total=Count("pk"),
        active=Count("pk", filter=Q(is_active=True)),
        windows=Count("pk", filter=Q(platform=Platform.WINDOWS, is_active=True)),
        linux=Count("pk", filter=Q(platform=Platform.LINUX, is_active=True)),
    )
