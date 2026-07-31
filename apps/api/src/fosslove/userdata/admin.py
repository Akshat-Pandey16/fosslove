from __future__ import annotations

from typing import Any

from django.contrib import admin
from django.db.models import Count, QuerySet
from django.http import HttpRequest

from fosslove.userdata.models import Collection, ScriptRun


@admin.register(Collection)
class CollectionAdmin(admin.ModelAdmin):
    list_display = ["name", "user", "is_public", "item_total", "created_at"]
    list_filter = ["is_public"]
    search_fields = ["name", "slug", "user__email"]
    readonly_fields = ["slug", "created_at", "updated_at"]
    list_select_related = ["user"]

    def get_queryset(self, request: HttpRequest) -> QuerySet[Collection]:
        queryset: QuerySet[Collection] = super().get_queryset(request)
        return queryset.annotate(item_total=Count("items"))

    @admin.display(description="Apps", ordering="item_total")
    def item_total(self, obj: Any) -> int:
        return int(obj.item_total)


@admin.register(ScriptRun)
class ScriptRunAdmin(admin.ModelAdmin):
    list_display = ["id", "user", "platform", "app_count", "created_at"]
    list_filter = ["platform"]
    search_fields = ["user__email"]
    readonly_fields = ["user", "platform", "app_ids", "app_count", "client_ip", "created_at"]
    list_select_related = ["user"]

    def has_add_permission(self, request: HttpRequest) -> bool:
        return False

    def has_change_permission(self, request: HttpRequest, obj: Any = None) -> bool:
        return False
