from __future__ import annotations

import logging
from typing import Any

import structlog

SHARED_PROCESSORS: list[Any] = [
    structlog.contextvars.merge_contextvars,
    structlog.stdlib.add_logger_name,
    structlog.stdlib.add_log_level,
    structlog.processors.TimeStamper(fmt="iso", utc=True),
    structlog.processors.StackInfoRenderer(),
    structlog.processors.format_exc_info,
]


def configure_logging(*, level: str, json_output: bool) -> dict[str, Any]:
    structlog.configure(
        processors=[*SHARED_PROCESSORS, structlog.stdlib.ProcessorFormatter.wrap_for_formatter],
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=True,
    )
    renderer = (
        structlog.processors.JSONRenderer()
        if json_output
        else structlog.dev.ConsoleRenderer(colors=not json_output)
    )
    return {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "structured": {
                "()": structlog.stdlib.ProcessorFormatter,
                "processors": [
                    structlog.stdlib.ProcessorFormatter.remove_processors_meta,
                    renderer,
                ],
                "foreign_pre_chain": SHARED_PROCESSORS,
            }
        },
        "handlers": {
            "console": {
                "class": "logging.StreamHandler",
                "formatter": "structured",
            }
        },
        "root": {"handlers": ["console"], "level": level},
        "loggers": {
            "django": {"handlers": ["console"], "level": level, "propagate": False},
            "django.db.backends": {"handlers": ["console"], "level": "WARNING", "propagate": False},
            "django.request": {"handlers": ["console"], "level": "ERROR", "propagate": False},
            "fosslove": {"handlers": ["console"], "level": level, "propagate": False},
        },
    }


def get_logger(name: str | None = None) -> structlog.stdlib.BoundLogger:
    logger: structlog.stdlib.BoundLogger = structlog.get_logger(name or "fosslove")
    return logger


logging.captureWarnings(True)
