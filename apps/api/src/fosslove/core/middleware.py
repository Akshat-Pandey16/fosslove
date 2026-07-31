from __future__ import annotations

import uuid
from collections.abc import Callable

import structlog
from django.http import HttpRequest, HttpResponse

from fosslove.core.request import client_ip

REQUEST_ID_HEADER = "x-request-id"


class RequestContextMiddleware:
    def __init__(self, get_response: Callable[[HttpRequest], HttpResponse]) -> None:
        self.get_response = get_response

    def __call__(self, request: HttpRequest) -> HttpResponse:
        identifier = request.headers.get(REQUEST_ID_HEADER) or uuid.uuid4().hex
        request.request_id = identifier  # type: ignore[attr-defined]
        structlog.contextvars.clear_contextvars()
        structlog.contextvars.bind_contextvars(
            request_id=identifier,
            method=request.method,
            path=request.path,
            client_ip=client_ip(request),
        )
        try:
            response = self.get_response(request)
        finally:
            structlog.contextvars.unbind_contextvars("request_id", "method", "path", "client_ip")
        response[REQUEST_ID_HEADER] = identifier
        return response
