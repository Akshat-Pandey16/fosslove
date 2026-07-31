from __future__ import annotations

from typing import Any

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.forms import AdminPasswordChangeForm, UserChangeForm, UserCreationForm
from django.utils.translation import gettext_lazy as _

from fosslove.accounts.models import SessionMetadata, User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    form = UserChangeForm
    add_form = UserCreationForm
    change_password_form = AdminPasswordChangeForm
    ordering = ["-created_at"]
    list_display = ["email", "full_name", "is_staff", "is_active", "is_verified", "created_at"]
    list_filter = ["is_staff", "is_superuser", "is_active", "is_verified"]
    search_fields = ["email", "full_name"]
    readonly_fields = ["created_at", "updated_at", "last_login"]
    filter_horizontal = ["groups", "user_permissions"]
    fieldsets = (
        (None, {"fields": ("email", "password")}),
        (_("Personal info"), {"fields": ("full_name",)}),
        (
            _("Permissions"),
            {
                "fields": (
                    "is_active",
                    "is_verified",
                    "is_staff",
                    "is_superuser",
                    "groups",
                    "user_permissions",
                )
            },
        ),
        (_("Important dates"), {"fields": ("last_login", "created_at", "updated_at")}),
    )
    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": ("email", "full_name", "password1", "password2", "is_staff"),
            },
        ),
    )

    def get_queryset(self, request: Any) -> Any:
        return super().get_queryset(request).prefetch_related("groups")


@admin.register(SessionMetadata)
class SessionMetadataAdmin(admin.ModelAdmin):
    list_display = ["token", "client_ip", "last_used_at"]
    search_fields = ["client_ip", "user_agent"]
    readonly_fields = ["token", "user_agent", "client_ip", "last_used_at"]

    def has_add_permission(self, request: Any) -> bool:
        return False
