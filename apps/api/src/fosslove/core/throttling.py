from __future__ import annotations

from typing import Any

from django.http import HttpRequest
from rest_framework.throttling import SimpleRateThrottle

from fosslove.core.request import client_ip
from fosslove.siteconfig.models import SiteConfiguration


class RuntimeRateThrottle(SimpleRateThrottle):
    scope = "default"

    def __init__(self) -> None:
        self.rate = ""
        self.num_requests = 0
        self.duration = 0

    def allow_request(self, request: Any, view: Any) -> bool:
        config = SiteConfiguration.get_solo()
        if not config.effective_rate_limit_enabled:
            return True
        self.rate = config.rate_for(self.scope)
        num_requests, duration = self.parse_rate(self.rate)
        if not num_requests or not duration:
            return True
        self.num_requests = num_requests
        self.duration = duration
        return bool(super().allow_request(request, view))

    def get_cache_key(self, request: Any, view: Any) -> str | None:
        http_request: HttpRequest = getattr(request, "_request", request)
        return self.cache_format % {"scope": self.scope, "ident": client_ip(http_request)}


class DefaultRateThrottle(RuntimeRateThrottle):
    scope = "default"


class AuthRateThrottle(RuntimeRateThrottle):
    scope = "auth"
