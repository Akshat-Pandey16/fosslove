from __future__ import annotations

import secrets
from enum import StrEnum
from functools import lru_cache
from typing import Annotated, Literal

from pydantic import (
    EmailStr,
    Field,
    RedisDsn,
    SecretStr,
    field_validator,
    model_validator,
)
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict
from sqlalchemy import URL

_PLACEHOLDER_SECRET = "change-me-to-a-long-random-secret-value-please"
_DEFAULT_DB_PASSWORD = "fosslove"
_MIN_SECRET_LENGTH = 43


class Environment(StrEnum):
    LOCAL = "local"
    STAGING = "staging"
    PRODUCTION = "production"


CommaList = Annotated[list[str], NoDecode]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_prefix="FOSSLOVE_",
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    ENV: Environment = Environment.LOCAL
    DEBUG: bool = True
    PROJECT_NAME: str = "FOSSLove"
    VERSION: str = "1.0.0"
    API_V1_PREFIX: str = "/api/v1"
    LOG_LEVEL: str = "INFO"
    LOG_JSON: bool = False

    SECRET_KEY: SecretStr = SecretStr(_PLACEHOLDER_SECRET)
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_TTL_SECONDS: int = Field(default=900, gt=0)
    REFRESH_TOKEN_TTL_SECONDS: int = Field(default=1_209_600, gt=0)
    EMAIL_TOKEN_TTL_SECONDS: int = Field(default=86_400, gt=0)

    CORS_ORIGINS: CommaList = Field(default_factory=lambda: ["http://localhost:3000"])
    ALLOWED_HOSTS: CommaList = Field(default_factory=lambda: ["*"])
    TRUSTED_PROXY_COUNT: int = Field(default=0, ge=0)

    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_USER: str = "fosslove"
    POSTGRES_PASSWORD: SecretStr = SecretStr("fosslove")
    POSTGRES_DB: str = "fosslove"
    DB_POOL_SIZE: int = Field(default=10, ge=1)
    DB_MAX_OVERFLOW: int = Field(default=20, ge=0)
    DB_POOL_TIMEOUT: int = Field(default=30, ge=1)
    DB_POOL_RECYCLE: int = Field(default=1800, ge=0)
    DB_CONNECT_TIMEOUT: int = Field(default=10, ge=1)
    DB_STATEMENT_TIMEOUT_MS: int = Field(default=30_000, ge=0)
    DB_ECHO: bool = False

    REDIS_URL: RedisDsn | None = None

    RATE_LIMIT_ENABLED: bool = True
    RATE_LIMIT_DEFAULT: str = "200/minute"
    RATE_LIMIT_AUTH: str = "10/minute"

    REGISTRATION_ENABLED: bool = True

    EMAIL_ENABLED: bool = False
    EMAIL_BACKEND: Literal["console", "smtp"] = "console"
    EMAIL_FROM: EmailStr = "no-reply@fosslove.dev"
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: SecretStr = SecretStr("")
    SMTP_USE_TLS: bool = True

    FRONTEND_BASE_URL: str = "http://localhost:3000"

    FIRST_ADMIN_EMAIL: EmailStr | None = None
    FIRST_ADMIN_PASSWORD: SecretStr | None = None

    @field_validator("CORS_ORIGINS", "ALLOWED_HOSTS", mode="before")
    @classmethod
    def _split_csv(cls, value: object) -> object:
        if isinstance(value, str):
            return [item.strip() for item in value.split(",") if item.strip()]
        return value

    @field_validator("REDIS_URL", mode="before")
    @classmethod
    def _empty_redis_is_none(cls, value: object) -> object:
        if isinstance(value, str) and not value.strip():
            return None
        return value

    @model_validator(mode="after")
    def _enforce_production_safety(self) -> Settings:
        if self.ENV is Environment.PRODUCTION:
            secret = self.SECRET_KEY.get_secret_value()
            if secret == _PLACEHOLDER_SECRET:
                raise ValueError("FOSSLOVE_SECRET_KEY must be set to a strong value in production")
            if len(secret) < _MIN_SECRET_LENGTH:
                raise ValueError(
                    f"FOSSLOVE_SECRET_KEY must be at least {_MIN_SECRET_LENGTH} characters "
                    "in production"
                )
            if self.POSTGRES_PASSWORD.get_secret_value() == _DEFAULT_DB_PASSWORD:
                raise ValueError("FOSSLOVE_POSTGRES_PASSWORD must not be the default in production")
            if self.DEBUG:
                raise ValueError("FOSSLOVE_DEBUG must be false in production")
            if "*" in self.ALLOWED_HOSTS:
                raise ValueError("FOSSLOVE_ALLOWED_HOSTS must not be '*' in production")
            if self.EMAIL_ENABLED:
                if self.EMAIL_BACKEND != "smtp":
                    raise ValueError("FOSSLOVE_EMAIL_BACKEND must be 'smtp' in production")
                if not self.SMTP_HOST:
                    raise ValueError("FOSSLOVE_SMTP_HOST is required when EMAIL_BACKEND=smtp")
                if not self.SMTP_USE_TLS:
                    raise ValueError("FOSSLOVE_SMTP_USE_TLS must be true in production")
                if not self.FRONTEND_BASE_URL.startswith("https://"):
                    raise ValueError("FOSSLOVE_FRONTEND_BASE_URL must use https:// in production")
        if self.REFRESH_TOKEN_TTL_SECONDS <= self.ACCESS_TOKEN_TTL_SECONDS:
            raise ValueError("REFRESH_TOKEN_TTL_SECONDS must exceed ACCESS_TOKEN_TTL_SECONDS")
        return self

    @property
    def is_production(self) -> bool:
        return self.ENV is Environment.PRODUCTION

    def _build_url(self, driver: str) -> URL:
        return URL.create(
            drivername=driver,
            username=self.POSTGRES_USER,
            password=self.POSTGRES_PASSWORD.get_secret_value(),
            host=self.POSTGRES_HOST,
            port=self.POSTGRES_PORT,
            database=self.POSTGRES_DB,
        )

    @property
    def database_url(self) -> str:
        return self._build_url("postgresql+asyncpg").render_as_string(hide_password=False)

    @property
    def database_url_safe(self) -> str:
        return self._build_url("postgresql+asyncpg").render_as_string(hide_password=True)

    @property
    def redis_dsn(self) -> str | None:
        return str(self.REDIS_URL) if self.REDIS_URL else None


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()


def generate_secret_key() -> str:
    return secrets.token_urlsafe(64)
