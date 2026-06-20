from __future__ import annotations

from typing import Any

from saq import CronJob, Queue

from fosslove.core.config import get_settings
from fosslove.core.logging import configure_logging, get_logger
from fosslove.db.session import dispose_engine, init_engine
from fosslove.worker.tasks import cleanup_expired_tokens, recompute_category_counts

_settings = get_settings()
configure_logging(_settings)
logger = get_logger(__name__)

queue = Queue.from_url(_settings.redis_dsn or "redis://localhost:6379/0")


async def startup(ctx: dict[str, Any]) -> None:
    init_engine(_settings)
    logger.info("worker_startup")


async def shutdown(ctx: dict[str, Any]) -> None:
    await dispose_engine()
    logger.info("worker_shutdown")


settings = {
    "queue": queue,
    "functions": [recompute_category_counts, cleanup_expired_tokens],
    "concurrency": 10,
    "startup": startup,
    "shutdown": shutdown,
    "cron_jobs": [
        CronJob(recompute_category_counts, cron="0 3 * * *"),
        CronJob(cleanup_expired_tokens, cron="*/30 * * * *"),
    ],
}
