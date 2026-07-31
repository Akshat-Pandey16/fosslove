from __future__ import annotations

from typing import Any

from django.contrib import admin
from django.http import HttpRequest

from fosslove.activity.models import ActivityLog


@admin.register(ActivityLog)
class ActivityLogAdmin(admin.ModelAdmin):
    list_display = [
        "created_at",
        "action",
        "status",
        "user",
        "target_type",
        "target_id",
        "client_ip",
    ]
    list_filter = ["status", "action", "target_type"]
    search_fields = ["action", "target_id", "client_ip", "request_id", "user__email"]
    readonly_fields = [field.name for field in ActivityLog._meta.fields]
    date_hierarchy = "created_at"
    list_select_related = ["user"]

    def has_add_permission(self, request: HttpRequest) -> bool:
        return False

    def has_change_permission(self, request: HttpRequest, obj: Any = None) -> bool:
        return False
