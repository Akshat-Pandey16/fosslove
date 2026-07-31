from __future__ import annotations

import django_filters

from fosslove.activity.models import ActivityLog


class ActivityLogFilter(django_filters.FilterSet):
    action = django_filters.CharFilter(field_name="action", lookup_expr="iexact", max_length=80)
    status = django_filters.CharFilter(field_name="status", lookup_expr="iexact", max_length=20)
    target_type = django_filters.CharFilter(
        field_name="target_type", lookup_expr="iexact", max_length=60
    )
    user_id = django_filters.UUIDFilter(field_name="user_id")
    since = django_filters.IsoDateTimeFilter(field_name="created_at", lookup_expr="gte")
    until = django_filters.IsoDateTimeFilter(field_name="created_at", lookup_expr="lte")

    class Meta:
        model = ActivityLog
        fields: list[str] = []
