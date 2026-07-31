from __future__ import annotations

from typing import Any

from django.conf import settings
from rest_framework import serializers

from fosslove.siteconfig.models import EmailBackendChoice, SiteConfiguration
from fosslove.siteconfig.validators import rate_limit_validator


class SiteConfigurationReadSerializer(serializers.Serializer[Any]):
    registration_enabled = serializers.BooleanField(source="effective_registration_enabled")
    email_enabled = serializers.BooleanField(source="effective_email_enabled")
    rate_limit_enabled = serializers.BooleanField(source="effective_rate_limit_enabled")
    rate_limit_default = serializers.CharField(source="effective_rate_limit_default")
    rate_limit_auth = serializers.CharField(source="effective_rate_limit_auth")
    email_backend = serializers.CharField(source="effective_email_backend")
    email_from = serializers.CharField(source="effective_email_from")
    smtp_host = serializers.CharField(source="effective_smtp_host")
    smtp_port = serializers.IntegerField(source="effective_smtp_port")
    smtp_user = serializers.CharField(source="effective_smtp_user")
    smtp_password_set = serializers.BooleanField()
    smtp_use_tls = serializers.BooleanField(source="effective_smtp_use_tls")
    project_name = serializers.CharField(source="effective_project_name")
    frontend_base_url = serializers.CharField(source="effective_frontend_base_url")


class SiteConfigurationUpdateSerializer(serializers.ModelSerializer[SiteConfiguration]):
    rate_limit_default = serializers.CharField(
        required=False, validators=[rate_limit_validator], max_length=50
    )
    rate_limit_auth = serializers.CharField(
        required=False, validators=[rate_limit_validator], max_length=50
    )
    email_backend = serializers.ChoiceField(choices=EmailBackendChoice.choices, required=False)

    class Meta:
        model = SiteConfiguration
        fields = [
            "registration_enabled",
            "email_enabled",
            "rate_limit_enabled",
            "rate_limit_default",
            "rate_limit_auth",
            "email_backend",
            "email_from",
            "smtp_host",
            "smtp_port",
            "smtp_user",
            "smtp_password",
            "smtp_use_tls",
            "project_name",
            "frontend_base_url",
        ]
        extra_kwargs = {"smtp_password": {"write_only": True, "required": False}}

    def validate(self, attrs: dict[str, Any]) -> dict[str, Any]:
        if not settings.IS_PRODUCTION:
            return attrs
        instance = self.instance
        prospective_enabled = attrs.get(
            "email_enabled", instance.effective_email_enabled if instance else False
        )
        if not prospective_enabled:
            return attrs
        backend = attrs.get(
            "email_backend", instance.effective_email_backend if instance else "console"
        )
        host = attrs.get("smtp_host", instance.effective_smtp_host if instance else "")
        use_tls = attrs.get("smtp_use_tls", instance.effective_smtp_use_tls if instance else True)
        base_url = attrs.get(
            "frontend_base_url", instance.effective_frontend_base_url if instance else ""
        )
        if backend != EmailBackendChoice.SMTP or not host:
            raise serializers.ValidationError(
                "Enabling email in production requires the SMTP backend and an SMTP host.",
                code="invalid_email_config",
            )
        if not use_tls:
            raise serializers.ValidationError(
                "SMTP TLS must be enabled in production.", code="invalid_email_config"
            )
        if not str(base_url).startswith("https://"):
            raise serializers.ValidationError(
                "Frontend base URL must use https in production.", code="invalid_email_config"
            )
        return attrs
