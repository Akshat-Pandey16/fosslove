from __future__ import annotations

from django.conf import settings
from django.http import HttpRequest


def client_ip(request: HttpRequest) -> str:
    trusted_hops = int(settings.TRUSTED_PROXY_COUNT)
    if trusted_hops > 0:
        forwarded = request.headers.get("x-forwarded-for", "")
        chain = [part.strip() for part in forwarded.split(",") if part.strip()]
        if len(chain) >= trusted_hops:
            return chain[-trusted_hops]
    return str(request.META.get("REMOTE_ADDR") or "unknown")


def request_id(request: HttpRequest) -> str | None:
    value = getattr(request, "request_id", None)
    return str(value) if value else None
