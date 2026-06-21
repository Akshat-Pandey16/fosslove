from __future__ import annotations

import re

from prometheus_client import CONTENT_TYPE_LATEST, Counter, Histogram, generate_latest

_ID_SEGMENT = re.compile(
    r"/(?:\d+|[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})(?=/|$)"
)

REQUEST_COUNT = Counter(
    "fosslove_http_requests_total",
    "Total HTTP requests.",
    ["method", "path", "status"],
)
REQUEST_LATENCY = Histogram(
    "fosslove_http_request_duration_seconds",
    "HTTP request latency in seconds.",
    ["method", "path"],
)


def normalize_path(path: str) -> str:
    return _ID_SEGMENT.sub("/:id", path) or "/"


def observe(method: str, path: str, status_code: int, duration_seconds: float) -> None:
    label_path = normalize_path(path)
    REQUEST_COUNT.labels(method=method, path=label_path, status=str(status_code)).inc()
    REQUEST_LATENCY.labels(method=method, path=label_path).observe(duration_seconds)


def render() -> tuple[bytes, str]:
    return generate_latest(), CONTENT_TYPE_LATEST
