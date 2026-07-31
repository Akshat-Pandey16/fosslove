from __future__ import annotations

import uuid
from typing import ClassVar

from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.db import models
from django.db.models.functions import Lower
from django.utils.translation import gettext_lazy as _

from fosslove.accounts.managers import UserManager


class User(AbstractBaseUser, PermissionsMixin):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(_("email address"), max_length=320, unique=True)
    full_name = models.CharField(_("full name"), max_length=200, blank=True)
    is_active = models.BooleanField(_("active"), default=True)
    is_staff = models.BooleanField(_("staff status"), default=False)
    is_verified = models.BooleanField(_("email verified"), default=False)
    created_at = models.DateTimeField(_("date joined"), auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = UserManager()

    USERNAME_FIELD = "email"
    EMAIL_FIELD = "email"
    REQUIRED_FIELDS: ClassVar[list[str]] = []

    class Meta:
        verbose_name = _("user")
        verbose_name_plural = _("users")
        constraints = [
            models.UniqueConstraint(Lower("email"), name="uq_users_email_ci"),
        ]
        indexes = [
            models.Index(fields=["is_active", "created_at"], name="ix_users_active_created"),
        ]

    def __str__(self) -> str:
        return self.email

    @property
    def role(self) -> str:
        return "admin" if self.is_staff else "user"

    def get_full_name(self) -> str:
        return self.full_name or self.email

    def get_short_name(self) -> str:
        return self.full_name.split(" ")[0] if self.full_name else self.email


class SessionMetadata(models.Model):
    token = models.OneToOneField(
        "token_blacklist.OutstandingToken",
        on_delete=models.CASCADE,
        related_name="metadata",
    )
    user_agent = models.CharField(max_length=400, blank=True)
    client_ip = models.CharField(max_length=64, blank=True)
    last_used_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = _("session metadata")
        verbose_name_plural = _("session metadata")
        indexes = [
            models.Index(fields=["last_used_at"], name="ix_session_meta_last_used"),
        ]

    def __str__(self) -> str:
        return f"SessionMetadata(token={self.token_id})"
