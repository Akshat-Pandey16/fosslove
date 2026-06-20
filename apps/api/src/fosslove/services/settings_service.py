from __future__ import annotations

from typing import Any

from fosslove.core.exceptions import BadRequestError
from fosslove.core.runtime_settings import RuntimeSettings
from fosslove.schemas.settings import SettingsRead, SettingsUpdate


def to_settings_read(runtime: RuntimeSettings) -> SettingsRead:
    return SettingsRead(
        registration_enabled=runtime.registration_enabled,
        email_enabled=runtime.email_enabled,
        rate_limit_enabled=runtime.rate_limit_enabled,
        rate_limit_default=runtime.rate_limit_default,
        rate_limit_auth=runtime.rate_limit_auth,
        email_backend="smtp" if runtime.email_backend == "smtp" else "console",
        email_from=runtime.email_from,
        smtp_host=runtime.smtp_host,
        smtp_port=runtime.smtp_port,
        smtp_user=runtime.smtp_user,
        smtp_password_set=bool(runtime.smtp_password),
        smtp_use_tls=runtime.smtp_use_tls,
        project_name=runtime.project_name,
        frontend_base_url=runtime.frontend_base_url,
    )


def _guard_production_email(prospective: dict[str, Any]) -> None:
    if not prospective["email_enabled"]:
        return
    if prospective["email_backend"] != "smtp" or not prospective["smtp_host"]:
        raise BadRequestError(
            "Enabling email in production requires the SMTP backend and an SMTP host.",
            code="invalid_email_config",
        )
    if not prospective["smtp_use_tls"]:
        raise BadRequestError(
            "SMTP TLS must be enabled in production.", code="invalid_email_config"
        )
    if not str(prospective["frontend_base_url"]).startswith("https://"):
        raise BadRequestError(
            "Frontend base URL must use https in production.", code="invalid_email_config"
        )


async def update_settings(runtime: RuntimeSettings, data: SettingsUpdate) -> None:
    await runtime.ensure_fresh()
    updates: dict[str, Any] = data.model_dump(exclude_unset=True)
    if not updates:
        return
    if runtime.is_production:
        prospective = {**runtime.as_dict(), **updates}
        _guard_production_email(prospective)
    await runtime.update(updates)
