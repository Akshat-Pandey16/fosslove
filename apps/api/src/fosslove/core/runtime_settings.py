from __future__ import annotations

import time
from typing import Any

from sqlalchemy.exc import SQLAlchemyError

from fosslove.core.config import Settings
from fosslove.core.logging import get_logger
from fosslove.db.models.setting import AppSetting
from fosslove.db.session import get_sessionmaker

logger = get_logger(__name__)

SETTING_KEYS: tuple[str, ...] = (
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
)


class RuntimeSettings:
    def __init__(self, base: Settings, *, ttl_seconds: float = 10.0) -> None:
        self._base = base
        self._ttl = ttl_seconds
        self._overrides: dict[str, Any] = {}
        self._loaded_at = 0.0

    @property
    def base(self) -> Settings:
        return self._base

    def _default(self, key: str) -> Any:
        defaults: dict[str, Any] = {
            "registration_enabled": self._base.REGISTRATION_ENABLED,
            "email_enabled": self._base.EMAIL_ENABLED,
            "rate_limit_enabled": self._base.RATE_LIMIT_ENABLED,
            "rate_limit_default": self._base.RATE_LIMIT_DEFAULT,
            "rate_limit_auth": self._base.RATE_LIMIT_AUTH,
            "email_backend": self._base.EMAIL_BACKEND,
            "email_from": str(self._base.EMAIL_FROM),
            "smtp_host": self._base.SMTP_HOST,
            "smtp_port": self._base.SMTP_PORT,
            "smtp_user": self._base.SMTP_USER,
            "smtp_password": self._base.SMTP_PASSWORD.get_secret_value(),
            "smtp_use_tls": self._base.SMTP_USE_TLS,
            "project_name": self._base.PROJECT_NAME,
            "frontend_base_url": self._base.FRONTEND_BASE_URL,
        }
        return defaults[key]

    def _effective(self, key: str) -> Any:
        override = self._overrides.get(key)
        return self._default(key) if override is None else override

    async def load(self) -> None:
        factory = get_sessionmaker()
        try:
            async with factory() as session:
                row = await session.get(AppSetting, 1)
                self._overrides = (
                    {key: getattr(row, key) for key in SETTING_KEYS} if row is not None else {}
                )
        except SQLAlchemyError as exc:
            logger.warning("runtime_settings_load_failed", error=str(exc))
            self._overrides = {}
        self._loaded_at = time.monotonic()

    async def ensure_fresh(self) -> None:
        if time.monotonic() - self._loaded_at > self._ttl:
            await self.load()

    async def update(self, updates: dict[str, Any]) -> None:
        factory = get_sessionmaker()
        async with factory() as session:
            row = await session.get(AppSetting, 1)
            if row is None:
                row = AppSetting(id=1)
                session.add(row)
            for key, value in updates.items():
                if key in SETTING_KEYS:
                    setattr(row, key, value)
            await session.commit()
        await self.load()

    def as_dict(self) -> dict[str, Any]:
        return {key: self._effective(key) for key in SETTING_KEYS}

    @property
    def debug(self) -> bool:
        return self._base.DEBUG

    @property
    def is_production(self) -> bool:
        return self._base.is_production

    @property
    def registration_enabled(self) -> bool:
        return bool(self._effective("registration_enabled"))

    @property
    def email_enabled(self) -> bool:
        return bool(self._effective("email_enabled"))

    @property
    def rate_limit_enabled(self) -> bool:
        return bool(self._effective("rate_limit_enabled"))

    @property
    def rate_limit_default(self) -> str:
        return str(self._effective("rate_limit_default"))

    @property
    def rate_limit_auth(self) -> str:
        return str(self._effective("rate_limit_auth"))

    @property
    def email_backend(self) -> str:
        return str(self._effective("email_backend"))

    @property
    def email_from(self) -> str:
        return str(self._effective("email_from"))

    @property
    def smtp_host(self) -> str:
        return str(self._effective("smtp_host"))

    @property
    def smtp_port(self) -> int:
        return int(self._effective("smtp_port"))

    @property
    def smtp_user(self) -> str:
        return str(self._effective("smtp_user"))

    @property
    def smtp_password(self) -> str:
        return str(self._effective("smtp_password"))

    @property
    def smtp_use_tls(self) -> bool:
        return bool(self._effective("smtp_use_tls"))

    @property
    def project_name(self) -> str:
        return str(self._effective("project_name"))

    @property
    def frontend_base_url(self) -> str:
        return str(self._effective("frontend_base_url"))
