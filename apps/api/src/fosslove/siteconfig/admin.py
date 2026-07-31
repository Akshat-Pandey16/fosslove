from __future__ import annotations

from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from solo.admin import SingletonModelAdmin

from fosslove.siteconfig.models import SiteConfiguration


@admin.register(SiteConfiguration)
class SiteConfigurationAdmin(SingletonModelAdmin):
    fieldsets = (
        (_("Feature flags"), {"fields": ("registration_enabled", "email_enabled")}),
        (
            _("Rate limiting"),
            {"fields": ("rate_limit_enabled", "rate_limit_default", "rate_limit_auth")},
        ),
        (
            _("Email"),
            {
                "fields": (
                    "email_backend",
                    "email_from",
                    "smtp_host",
                    "smtp_port",
                    "smtp_user",
                    "smtp_password",
                    "smtp_use_tls",
                )
            },
        ),
        (_("Branding"), {"fields": ("project_name", "frontend_base_url")}),
    )
