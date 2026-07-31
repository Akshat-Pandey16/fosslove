from __future__ import annotations

from datetime import timedelta
from pathlib import Path

import environ

BASE_DIR = Path(__file__).resolve().parents[3]

env = environ.Env()
environ.Env.read_env(BASE_DIR / ".env")

PLACEHOLDER_SECRET = "change-me-to-a-long-random-secret-value-please"
MIN_SECRET_LENGTH = 43

ENVIRONMENT = env.str("FOSSLOVE_ENV", default="local")
IS_PRODUCTION = ENVIRONMENT == "production"

SECRET_KEY = env.str("FOSSLOVE_SECRET_KEY", default=PLACEHOLDER_SECRET)
DEBUG = env.bool("FOSSLOVE_DEBUG", default=not IS_PRODUCTION)
ALLOWED_HOSTS = env.list("FOSSLOVE_ALLOWED_HOSTS", default=["*"])

PROJECT_NAME = env.str("FOSSLOVE_PROJECT_NAME", default="FOSSLove")
API_V1_PREFIX = "api/v1"
FRONTEND_BASE_URL = env.str("FOSSLOVE_FRONTEND_BASE_URL", default="http://localhost:3000")

DJANGO_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "django.contrib.postgres",
]

THIRD_PARTY_APPS = [
    "rest_framework",
    "rest_framework_simplejwt",
    "rest_framework_simplejwt.token_blacklist",
    "django_filters",
    "corsheaders",
    "drf_spectacular",
    "pgtrigger",
    "solo",
    "django_prometheus",
]

LOCAL_APPS = [
    "fosslove.core",
    "fosslove.accounts",
    "fosslove.catalog",
    "fosslove.userdata",
    "fosslove.siteconfig",
    "fosslove.activity",
]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS

MIDDLEWARE = [
    "django_prometheus.middleware.PrometheusBeforeMiddleware",
    "fosslove.core.middleware.RequestContextMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.gzip.GZipMiddleware",
    "django.middleware.http.ConditionalGetMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "django_prometheus.middleware.PrometheusAfterMiddleware",
]

ROOT_URLCONF = "fosslove.conf.urls"
WSGI_APPLICATION = "fosslove.conf.wsgi.application"
ASGI_APPLICATION = "fosslove.conf.asgi.application"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

DB_STATEMENT_TIMEOUT_MS = env.int("FOSSLOVE_DB_STATEMENT_TIMEOUT_MS", default=30000)

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": env.str("FOSSLOVE_POSTGRES_DB", default="fosslove"),
        "USER": env.str("FOSSLOVE_POSTGRES_USER", default="fosslove"),
        "PASSWORD": env.str("FOSSLOVE_POSTGRES_PASSWORD", default="fosslove"),
        "HOST": env.str("FOSSLOVE_POSTGRES_HOST", default="localhost"),
        "PORT": env.int("FOSSLOVE_POSTGRES_PORT", default=5432),
        "CONN_MAX_AGE": 0,
        "OPTIONS": {
            "pool": {
                "min_size": env.int("FOSSLOVE_DB_POOL_MIN", default=2),
                "max_size": env.int("FOSSLOVE_DB_POOL_MAX", default=10),
                "timeout": env.int("FOSSLOVE_DB_POOL_TIMEOUT", default=30),
            },
            "connect_timeout": env.int("FOSSLOVE_DB_CONNECT_TIMEOUT", default=10),
            "options": f"-c statement_timeout={DB_STATEMENT_TIMEOUT_MS} -c idle_in_transaction_session_timeout={DB_STATEMENT_TIMEOUT_MS}",
        },
        "TEST": {"NAME": env.str("FOSSLOVE_TEST_DB", default="fosslove_test")},
    }
}

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
AUTH_USER_MODEL = "accounts.User"

REDIS_URL = env.str("FOSSLOVE_REDIS_URL", default="")

CACHES = {
    "default": (
        {
            "BACKEND": "django.core.cache.backends.redis.RedisCache",
            "LOCATION": REDIS_URL,
            "OPTIONS": {"socket_connect_timeout": 2, "socket_timeout": 2},
        }
        if REDIS_URL
        else {
            "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
            "LOCATION": "fosslove",
        }
    )
}

PASSWORD_HASHERS = [
    "django.contrib.auth.hashers.Argon2PasswordHasher",
    "django.contrib.auth.hashers.PBKDF2PasswordHasher",
]

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
        "OPTIONS": {"min_length": 8},
    },
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "fosslove.accounts.validators.LetterAndDigitValidator"},
]

LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STORAGES = {
    "default": {"BACKEND": "django.core.files.storage.FileSystemStorage"},
    "staticfiles": {"BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage"},
}

ACCESS_TOKEN_TTL_SECONDS = env.int("FOSSLOVE_ACCESS_TOKEN_TTL_SECONDS", default=900)
REFRESH_TOKEN_TTL_SECONDS = env.int("FOSSLOVE_REFRESH_TOKEN_TTL_SECONDS", default=1209600)
EMAIL_TOKEN_TTL_SECONDS = env.int("FOSSLOVE_EMAIL_TOKEN_TTL_SECONDS", default=86400)
PASSWORD_RESET_TIMEOUT = EMAIL_TOKEN_TTL_SECONDS

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(seconds=ACCESS_TOKEN_TTL_SECONDS),
    "REFRESH_TOKEN_LIFETIME": timedelta(seconds=REFRESH_TOKEN_TTL_SECONDS),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "UPDATE_LAST_LOGIN": True,
    "ALGORITHM": "HS256",
    "SIGNING_KEY": SECRET_KEY,
    "AUTH_HEADER_TYPES": ("Bearer",),
    "USER_ID_FIELD": "id",
    "USER_ID_CLAIM": "user_id",
    "TOKEN_TYPE_CLAIM": "token_type",
    "JTI_CLAIM": "jti",
}

RATE_LIMIT_DEFAULT = env.str("FOSSLOVE_RATE_LIMIT_DEFAULT", default="200/minute")
RATE_LIMIT_AUTH = env.str("FOSSLOVE_RATE_LIMIT_AUTH", default="10/minute")

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": ["rest_framework.permissions.AllowAny"],
    "DEFAULT_PAGINATION_CLASS": "fosslove.core.pagination.PageNumberMetaPagination",
    "PAGE_SIZE": 20,
    "DEFAULT_FILTER_BACKENDS": ["django_filters.rest_framework.DjangoFilterBackend"],
    "DEFAULT_THROTTLE_CLASSES": ["fosslove.core.throttling.DefaultRateThrottle"],
    "DEFAULT_THROTTLE_RATES": {"default": RATE_LIMIT_DEFAULT, "auth": RATE_LIMIT_AUTH},
    "EXCEPTION_HANDLER": "fosslove.core.exceptions.exception_handler",
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "UNAUTHENTICATED_USER": "django.contrib.auth.models.AnonymousUser",
}

SPECTACULAR_SETTINGS = {
    "TITLE": PROJECT_NAME,
    "DESCRIPTION": "Catalog of FOSS apps with install-script generation.",
    "VERSION": "2.0.0",
    "SERVE_INCLUDE_SCHEMA": False,
    "SCHEMA_PATH_PREFIX": f"/{API_V1_PREFIX}",
    "COMPONENT_SPLIT_REQUEST": True,
}

CORS_ALLOWED_ORIGINS = env.list("FOSSLOVE_CORS_ORIGINS", default=["http://localhost:3000"])
CORS_ALLOW_CREDENTIALS = True
CORS_EXPOSE_HEADERS = [
    "x-request-id",
    "content-disposition",
    "x-fosslove-skipped",
    "etag",
    "retry-after",
]

RATE_LIMIT_ENABLED = env.bool("FOSSLOVE_RATE_LIMIT_ENABLED", default=True)
REGISTRATION_ENABLED = env.bool("FOSSLOVE_REGISTRATION_ENABLED", default=True)
EMAIL_ENABLED = env.bool("FOSSLOVE_EMAIL_ENABLED", default=False)

EMAIL_BACKEND_NAME = env.str("FOSSLOVE_EMAIL_BACKEND", default="console")
EMAIL_BACKEND = (
    "django.core.mail.backends.smtp.EmailBackend"
    if EMAIL_BACKEND_NAME == "smtp"
    else "django.core.mail.backends.console.EmailBackend"
)
DEFAULT_FROM_EMAIL = env.str("FOSSLOVE_EMAIL_FROM", default="no-reply@fosslove.dev")
EMAIL_HOST = env.str("FOSSLOVE_SMTP_HOST", default="")
EMAIL_PORT = env.int("FOSSLOVE_SMTP_PORT", default=587)
EMAIL_HOST_USER = env.str("FOSSLOVE_SMTP_USER", default="")
EMAIL_HOST_PASSWORD = env.str("FOSSLOVE_SMTP_PASSWORD", default="")
EMAIL_USE_TLS = env.bool("FOSSLOVE_SMTP_USE_TLS", default=True)

TRUSTED_PROXY_COUNT = env.int("FOSSLOVE_TRUSTED_PROXY_COUNT", default=0)
SITE_CONFIG_CACHE_TTL = env.int("FOSSLOVE_SITE_CONFIG_CACHE_TTL", default=10)
SOLO_CACHE = "default"
SOLO_CACHE_TIMEOUT = SITE_CONFIG_CACHE_TTL

FIRST_ADMIN_EMAIL = env.str("FOSSLOVE_FIRST_ADMIN_EMAIL", default="")
FIRST_ADMIN_PASSWORD = env.str("FOSSLOVE_FIRST_ADMIN_PASSWORD", default="")

LOG_LEVEL = env.str("FOSSLOVE_LOG_LEVEL", default="INFO")
LOG_JSON = env.bool("FOSSLOVE_LOG_JSON", default=IS_PRODUCTION)

if IS_PRODUCTION:
    SECURE_SSL_REDIRECT = env.bool("FOSSLOVE_SECURE_SSL_REDIRECT", default=True)
    SECURE_HSTS_SECONDS = env.int("FOSSLOVE_SECURE_HSTS_SECONDS", default=31536000)
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    X_FRAME_OPTIONS = "DENY"

from fosslove.core.logging import configure_logging  # noqa: E402

LOGGING = configure_logging(level=LOG_LEVEL, json_output=LOG_JSON)
