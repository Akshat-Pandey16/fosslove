from __future__ import annotations

from typing import Any

from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _


class ActivityStatus(models.TextChoices):
    OK = "ok", _("OK")
    FAILURE = "failure", _("Failure")


class ActivityLog(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="activity_logs",
        verbose_name=_("user"),
    )
    action = models.CharField(_("action"), max_length=80)
    status = models.CharField(
        _("status"), max_length=20, choices=ActivityStatus.choices, default=ActivityStatus.OK
    )
    target_type = models.CharField(_("target type"), max_length=60, blank=True)
    target_id = models.CharField(_("target ID"), max_length=80, blank=True)
    client_ip = models.CharField(_("client IP"), max_length=64, blank=True)
    request_id = models.CharField(_("request ID"), max_length=64, blank=True)
    user_agent = models.CharField(_("user agent"), max_length=400, blank=True)
    detail: models.JSONField[Any] = models.JSONField(_("detail"), null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        verbose_name = _("activity log")
        verbose_name_plural = _("activity logs")
        ordering = ["-created_at", "-id"]
        indexes = [
            models.Index(fields=["action", "-created_at"], name="ix_activity_action_created"),
            models.Index(fields=["user", "-created_at"], name="ix_activity_user_created"),
            models.Index(fields=["target_type", "target_id"], name="ix_activity_target"),
            models.Index(fields=["status", "-created_at"], name="ix_activity_status_created"),
        ]

    def __str__(self) -> str:
        return f"{self.action}@{self.created_at:%Y-%m-%d %H:%M:%S}"
