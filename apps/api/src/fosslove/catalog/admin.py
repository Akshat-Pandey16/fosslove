from __future__ import annotations

from typing import Any

from django.contrib import admin
from django.db.models import QuerySet
from django.http import HttpRequest

from fosslove.catalog.models import App, Category, PackageReference
from fosslove.catalog.services import recompute_category_counts
from fosslove.core.cache import bump_catalog_version
from fosslove.core.slugs import model_unique_slug


class PackageReferenceInline(admin.TabularInline):
    model = PackageReference
    extra = 1
    fields = ["manager", "identifier", "install_args", "priority", "extra"]


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ["name", "slug", "windows_app_count", "linux_app_count", "created_at"]
    search_fields = ["name", "slug"]
    readonly_fields = ["slug", "windows_app_count", "linux_app_count", "created_at", "updated_at"]
    fields = ["name", "slug", "description", "icon_url", "windows_app_count", "linux_app_count"]
    actions = ["recompute_counts"]

    def save_model(self, request: HttpRequest, obj: Category, form: Any, change: bool) -> None:
        if not obj.slug or "name" in form.changed_data:
            obj.slug = model_unique_slug(Category, obj.name, exclude_pk=obj.pk)
        super().save_model(request, obj, form, change)
        bump_catalog_version()

    @admin.action(description="Recompute app counts")
    def recompute_counts(self, request: HttpRequest, queryset: QuerySet[Category]) -> None:
        recompute_category_counts()
        bump_catalog_version()
        self.message_user(request, "Category counts recomputed.")


@admin.register(App)
class AppAdmin(admin.ModelAdmin):
    list_display = ["name", "platform", "category", "is_active", "updated_at"]
    list_filter = ["platform", "is_active", "category"]
    search_fields = ["name", "slug", "summary"]
    autocomplete_fields = ["category"]
    readonly_fields = ["slug", "created_at", "updated_at"]
    inlines = [PackageReferenceInline]
    list_select_related = ["category"]

    def save_model(self, request: HttpRequest, obj: App, form: Any, change: bool) -> None:
        if not obj.slug or "name" in form.changed_data:
            obj.slug = model_unique_slug(
                App, obj.name, max_length=220, exclude_pk=obj.pk, scope={"platform": obj.platform}
            )
        super().save_model(request, obj, form, change)
        bump_catalog_version()

    def delete_model(self, request: HttpRequest, obj: App) -> None:
        super().delete_model(request, obj)
        bump_catalog_version()


@admin.register(PackageReference)
class PackageReferenceAdmin(admin.ModelAdmin):
    list_display = ["app", "manager", "identifier", "priority"]
    list_filter = ["manager"]
    search_fields = ["identifier", "app__name"]
    autocomplete_fields = ["app"]
    list_select_related = ["app"]
