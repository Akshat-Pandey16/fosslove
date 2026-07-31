from __future__ import annotations

from django.conf import settings
from django.contrib.postgres.fields import ArrayField
from django.db import models
from django.db.models import Q
from django.utils.translation import gettext_lazy as _

from fosslove.catalog.enums import Platform
from fosslove.catalog.models import App
from fosslove.core.models import TimeStampedModel

MAX_COLLECTION_APPS = 500


class Collection(TimeStampedModel):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="collections",
        verbose_name=_("owner"),
    )
    name = models.CharField(_("name"), max_length=120)
    slug = models.SlugField(_("slug"), max_length=140)
    description = models.TextField(_("description"), blank=True)
    is_public = models.BooleanField(_("public"), default=False)

    class Meta:
        verbose_name = _("collection")
        verbose_name_plural = _("collections")
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(fields=["user", "slug"], name="uq_collection_user_slug"),
            models.UniqueConstraint(fields=["user", "name"], name="uq_collection_user_name"),
        ]
        indexes = [
            models.Index(
                fields=["-created_at"],
                condition=Q(is_public=True),
                name="ix_collection_public_created",
            ),
            models.Index(fields=["user", "-created_at"], name="ix_collection_user_created"),
        ]

    def __str__(self) -> str:
        return self.name


class CollectionApp(models.Model):
    pk = models.CompositePrimaryKey("collection", "app")
    collection = models.ForeignKey(
        Collection, on_delete=models.CASCADE, related_name="items", verbose_name=_("collection")
    )
    app = models.ForeignKey(
        App, on_delete=models.CASCADE, related_name="collection_links", verbose_name=_("app")
    )
    position = models.PositiveIntegerField(_("position"), default=0)
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _("collection app")
        verbose_name_plural = _("collection apps")
        ordering = ["position"]
        indexes = [
            models.Index(fields=["app"], name="ix_collection_app_app"),
            models.Index(fields=["collection", "position"], name="ix_collection_app_position"),
        ]

    def __str__(self) -> str:
        return f"{self.collection_id}:{self.app_id}"


class Favorite(models.Model):
    pk = models.CompositePrimaryKey("user", "app")
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="favorites",
        verbose_name=_("user"),
    )
    app = models.ForeignKey(
        App, on_delete=models.CASCADE, related_name="favorited_by", verbose_name=_("app")
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _("favorite")
        verbose_name_plural = _("favorites")
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["app"], name="ix_favorite_app"),
            models.Index(fields=["user", "-created_at"], name="ix_favorite_user_created"),
        ]

    def __str__(self) -> str:
        return f"{self.user_id}:{self.app_id}"


class ScriptRun(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="script_runs",
        verbose_name=_("user"),
    )
    platform = models.CharField(_("platform"), max_length=10, choices=Platform.choices)
    app_ids = ArrayField(models.BigIntegerField(), verbose_name=_("app IDs"))
    app_count = models.PositiveIntegerField(_("app count"))
    client_ip = models.CharField(_("client IP"), max_length=64, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        verbose_name = _("script run")
        verbose_name_plural = _("script runs")
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "-created_at"], name="ix_scriptrun_user_created"),
            models.Index(fields=["platform", "-created_at"], name="ix_scriptrun_plat_created"),
        ]

    def __str__(self) -> str:
        return f"ScriptRun({self.platform}, {self.app_count})"
