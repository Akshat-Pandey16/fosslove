from __future__ import annotations

from typing import TypeVar, cast

from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator, URLValidator
from django.db import models
from django.utils.translation import gettext_lazy as _
from solo.models import SingletonModel

from fosslove.siteconfig.validators import rate_limit_validator

T = TypeVar("T")


class EmailBackendChoice(models.TextChoices):
    CONSOLE = "console", _("Console")
    SMTP = "smtp", _("SMTP")


class SiteConfiguration(SingletonModel):
    registration_enabled = models.BooleanField(null=True, blank=True)
    email_enabled = models.BooleanField(null=True, blank=True)
    rate_limit_enabled = models.BooleanField(null=True, blank=True)
    rate_limit_default = models.CharField(
        max_length=50, null=True, blank=True, validators=[rate_limit_validator]
    )
    rate_limit_auth = models.CharField(
        max_length=50, null=True, blank=True, validators=[rate_limit_validator]
    )
    email_backend = models.CharField(
        max_length=10, null=True, blank=True, choices=EmailBackendChoice.choices
    )
    email_from = models.EmailField(max_length=255, null=True, blank=True)
    smtp_host = models.CharField(max_length=255, null=True, blank=True)
    smtp_port = models.PositiveIntegerField(
        null=True, blank=True, validators=[MinValueValidator(1), MaxValueValidator(65535)]
    )
    smtp_user = models.CharField(max_length=255, null=True, blank=True)
    smtp_password = models.CharField(max_length=500, null=True, blank=True)
    smtp_use_tls = models.BooleanField(null=True, blank=True)
    project_name = models.CharField(max_length=100, null=True, blank=True)
    frontend_base_url = models.URLField(
        max_length=500, null=True, blank=True, validators=[URLValidator(schemes=["http", "https"])]
    )
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _("site configuration")
        constraints = [
            models.CheckConstraint(
                condition=models.Q(smtp_port__isnull=True)
                | models.Q(smtp_port__gte=1, smtp_port__lte=65535),
                name="ck_siteconfig_smtp_port_range",
            ),
            models.CheckConstraint(
                condition=models.Q(email_backend__isnull=True)
                | models.Q(email_backend__in=["console", "smtp"]),
                name="ck_siteconfig_email_backend_valid",
            ),
        ]

    def __str__(self) -> str:
        return str(_("Site configuration"))

    def _effective(self, field: str, fallback: T) -> T:
        value = getattr(self, field)
        return fallback if value is None or value == "" else cast("T", value)

    @property
    def effective_registration_enabled(self) -> bool:
        return self._effective("registration_enabled", bool(settings.REGISTRATION_ENABLED))

    @property
    def effective_email_enabled(self) -> bool:
        return self._effective("email_enabled", bool(settings.EMAIL_ENABLED))

    @property
    def effective_rate_limit_enabled(self) -> bool:
        return self._effective("rate_limit_enabled", bool(settings.RATE_LIMIT_ENABLED))

    @property
    def effective_rate_limit_default(self) -> str:
        return self._effective("rate_limit_default", str(settings.RATE_LIMIT_DEFAULT))

    @property
    def effective_rate_limit_auth(self) -> str:
        return self._effective("rate_limit_auth", str(settings.RATE_LIMIT_AUTH))

    @property
    def effective_email_backend(self) -> str:
        return self._effective("email_backend", str(settings.EMAIL_BACKEND_NAME))

    @property
    def effective_email_from(self) -> str:
        return self._effective("email_from", str(settings.DEFAULT_FROM_EMAIL))

    @property
    def effective_smtp_host(self) -> str:
        return self._effective("smtp_host", str(settings.EMAIL_HOST))

    @property
    def effective_smtp_port(self) -> int:
        return self._effective("smtp_port", int(settings.EMAIL_PORT))

    @property
    def effective_smtp_user(self) -> str:
        return self._effective("smtp_user", str(settings.EMAIL_HOST_USER))

    @property
    def effective_smtp_use_tls(self) -> bool:
        return self._effective("smtp_use_tls", bool(settings.EMAIL_USE_TLS))

    @property
    def effective_project_name(self) -> str:
        return self._effective("project_name", str(settings.PROJECT_NAME))

    @property
    def effective_frontend_base_url(self) -> str:
        return self._effective("frontend_base_url", str(settings.FRONTEND_BASE_URL))

    @property
    def smtp_password_set(self) -> bool:
        return bool(self.smtp_password or settings.EMAIL_HOST_PASSWORD)

    def rate_for(self, scope: str) -> str:
        if scope == "auth":
            return self.effective_rate_limit_auth
        return self.effective_rate_limit_default
