from __future__ import annotations

from typing import Any

import pgtrigger
from django.contrib.postgres.indexes import GinIndex, OpClass
from django.db import models
from django.db.models import F, Q
from django.utils.translation import gettext_lazy as _

from fosslove.catalog.enums import PackageManager, Platform
from fosslove.catalog.triggers import APP_COUNT_TRIGGERS
from fosslove.core.models import TimeStampedModel


class Category(TimeStampedModel):
    name = models.CharField(_("name"), max_length=100, unique=True)
    slug = models.SlugField(_("slug"), max_length=120, unique=True)
    description = models.TextField(_("description"), blank=True)
    icon_url = models.URLField(_("icon URL"), max_length=500, blank=True)
    windows_app_count = models.PositiveIntegerField(default=0, editable=False)
    linux_app_count = models.PositiveIntegerField(default=0, editable=False)

    class Meta:
        verbose_name = _("category")
        verbose_name_plural = _("categories")
        ordering = ["name"]
        constraints = [
            models.CheckConstraint(
                condition=Q(windows_app_count__gte=0), name="ck_category_windows_count_nonneg"
            ),
            models.CheckConstraint(
                condition=Q(linux_app_count__gte=0), name="ck_category_linux_count_nonneg"
            ),
        ]

    def __str__(self) -> str:
        return self.name

    @property
    def total_app_count(self) -> int:
        return self.windows_app_count + self.linux_app_count


@pgtrigger.register(*APP_COUNT_TRIGGERS)
class App(TimeStampedModel):
    category = models.ForeignKey(
        Category, on_delete=models.CASCADE, related_name="apps", verbose_name=_("category")
    )
    platform = models.CharField(_("platform"), max_length=10, choices=Platform.choices)
    name = models.CharField(_("name"), max_length=200)
    slug = models.SlugField(_("slug"), max_length=220)
    summary = models.CharField(_("summary"), max_length=300, blank=True)
    description = models.TextField(_("description"), blank=True)
    homepage_url = models.URLField(_("homepage URL"), max_length=500, blank=True)
    license = models.CharField(_("license"), max_length=100, blank=True)
    is_active = models.BooleanField(_("active"), default=True)

    class Meta:
        verbose_name = _("app")
        verbose_name_plural = _("apps")
        ordering = ["name"]
        constraints = [
            models.UniqueConstraint(
                fields=["category", "platform", "name"], name="uq_app_category_platform_name"
            ),
            models.UniqueConstraint(fields=["platform", "slug"], name="uq_app_platform_slug"),
        ]
        indexes = [
            models.Index(fields=["platform", "name"], name="ix_app_platform_name"),
            models.Index(fields=["platform", "category", "name"], name="ix_app_platform_cat_name"),
            models.Index(
                fields=["platform", "category", "name"],
                condition=Q(is_active=True),
                name="ix_app_active_plat_cat_name",
            ),
            GinIndex(OpClass(F("name"), name="gin_trgm_ops"), name="ix_app_name_trgm"),
            GinIndex(OpClass(F("summary"), name="gin_trgm_ops"), name="ix_app_summary_trgm"),
        ]

    def __str__(self) -> str:
        return f"{self.name} ({self.platform})"


class PackageReference(TimeStampedModel):
    app = models.ForeignKey(
        App, on_delete=models.CASCADE, related_name="package_refs", verbose_name=_("app")
    )
    manager = models.CharField(_("manager"), max_length=10, choices=PackageManager.choices)
    identifier = models.CharField(_("identifier"), max_length=500)
    install_args = models.CharField(_("install args"), max_length=500, blank=True)
    priority = models.PositiveIntegerField(_("priority"), default=100)
    extra: models.JSONField[Any] = models.JSONField(_("extra"), null=True, blank=True)

    class Meta:
        verbose_name = _("package reference")
        verbose_name_plural = _("package references")
        ordering = ["priority", "manager"]
        constraints = [
            models.UniqueConstraint(fields=["app", "manager"], name="uq_package_app_manager"),
            models.CheckConstraint(condition=Q(priority__gte=0), name="ck_package_priority_nonneg"),
        ]
        indexes = [
            models.Index(fields=["app", "priority"], name="ix_package_app_priority"),
        ]

    def __str__(self) -> str:
        return f"{self.manager}:{self.identifier}"
