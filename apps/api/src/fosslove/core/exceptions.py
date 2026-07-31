from __future__ import annotations

from typing import Any

from django.core.exceptions import PermissionDenied as DjangoPermissionDenied
from django.db import IntegrityError
from django.http import Http404
from rest_framework import status
from rest_framework.exceptions import APIException, ValidationError
from rest_framework.response import Response
from rest_framework.views import exception_handler as drf_exception_handler

from fosslove.core.logging import get_logger
from fosslove.core.request import request_id

logger = get_logger(__name__)

SQLSTATE_MAP: dict[str, tuple[int, str, str]] = {
    "23505": (status.HTTP_409_CONFLICT, "conflict", "This resource already exists."),
    "23503": (status.HTTP_409_CONFLICT, "conflict", "A referenced resource does not exist."),
    "23514": (
        status.HTTP_400_BAD_REQUEST,
        "bad_request",
        "The request violates a data constraint.",
    ),
    "23502": (status.HTTP_400_BAD_REQUEST, "bad_request", "A required field is missing."),
}


class AppError(APIException):
    status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR
    default_detail: str = "An unexpected error occurred."
    default_code: str = "internal_error"


class BadRequestError(AppError):
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = "The request could not be processed."
    default_code = "bad_request"


class ConflictError(AppError):
    status_code = status.HTTP_409_CONFLICT
    default_detail = "The resource already exists or conflicts with current state."
    default_code = "conflict"


class PermissionDeniedError(AppError):
    status_code = status.HTTP_403_FORBIDDEN
    default_detail = "You do not have permission to perform this action."
    default_code = "permission_denied"


def _sqlstate(exc: BaseException) -> str | None:
    cause = getattr(exc, "__cause__", None)
    state = getattr(cause, "sqlstate", None)
    return str(state) if state else None


def _envelope(
    *, code: str, message: str, status_code: int, details: Any, context: dict[str, Any]
) -> Response:
    body: dict[str, Any] = {"error": {"code": code, "message": message}}
    if details is not None:
        body["error"]["details"] = details
    request = context.get("request")
    identifier = request_id(request._request) if request is not None else None
    if identifier:
        body["request_id"] = identifier
    return Response(body, status=status_code)


def _code_for(exc: APIException) -> str:
    code = exc.get_codes()
    if isinstance(code, str):
        return code
    return getattr(exc, "default_code", "error")


def exception_handler(exc: Exception, context: dict[str, Any]) -> Response | None:
    if isinstance(exc, ValidationError):
        return _envelope(
            code="validation_error",
            message="The request payload failed validation.",
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            details=exc.detail,
            context=context,
        )

    if isinstance(exc, IntegrityError):
        status_code, code, message = SQLSTATE_MAP.get(
            _sqlstate(exc) or "",
            (status.HTTP_409_CONFLICT, "conflict", ConflictError.default_detail),
        )
        logger.info("integrity_error", sqlstate=_sqlstate(exc), code=code)
        return _envelope(
            code=code, message=message, status_code=status_code, details=None, context=context
        )

    if isinstance(exc, Http404 | DjangoPermissionDenied):
        response = drf_exception_handler(exc, context)
        if response is not None:
            code = "not_found" if isinstance(exc, Http404) else "permission_denied"
            message = (
                "The requested resource was not found."
                if isinstance(exc, Http404)
                else PermissionDeniedError.default_detail
            )
            return _envelope(
                code=code,
                message=message,
                status_code=response.status_code,
                details=None,
                context=context,
            )

    if isinstance(exc, APIException):
        detail = exc.detail
        message = detail if isinstance(detail, str) else str(exc.default_detail)
        details = None if isinstance(detail, str) else detail
        if exc.status_code >= status.HTTP_500_INTERNAL_SERVER_ERROR:
            logger.error("app_error", code=_code_for(exc), exc_info=exc)
        response = _envelope(
            code=_code_for(exc),
            message=message,
            status_code=exc.status_code,
            details=details,
            context=context,
        )
        wait = getattr(exc, "wait", None)
        if wait:
            response["Retry-After"] = str(int(wait))
        return response

    logger.error("unhandled_exception", exc_info=exc)
    return None
