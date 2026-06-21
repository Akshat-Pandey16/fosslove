from __future__ import annotations

from typing import Any

from fastapi import FastAPI, Request, status
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from starlette.exceptions import HTTPException as StarletteHTTPException

from fosslove.core.config import get_settings
from fosslove.core.logging import get_logger

logger = get_logger(__name__)

_INTEGRITY_STATUS: dict[str, tuple[int, str, str]] = {
    "23505": (status.HTTP_409_CONFLICT, "conflict", "This resource already exists."),
    "23503": (status.HTTP_409_CONFLICT, "conflict", "A referenced resource does not exist."),
    "23514": (
        status.HTTP_400_BAD_REQUEST,
        "bad_request",
        "The request violates a data constraint.",
    ),
    "23502": (status.HTTP_400_BAD_REQUEST, "bad_request", "A required field is missing."),
}


def _sqlstate(exc: SQLAlchemyError) -> str | None:
    orig = getattr(exc, "orig", None)
    state = getattr(orig, "sqlstate", None) or getattr(orig, "pgcode", None)
    return str(state) if state is not None else None


class AppError(Exception):
    status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR
    code: str = "internal_error"
    message: str = "An unexpected error occurred."

    def __init__(
        self,
        message: str | None = None,
        *,
        code: str | None = None,
        details: dict[str, Any] | None = None,
    ) -> None:
        self.message = message or self.message
        self.code = code or self.code
        self.details = details
        super().__init__(self.message)


class BadRequestError(AppError):
    status_code = status.HTTP_400_BAD_REQUEST
    code = "bad_request"
    message = "The request could not be processed."


class AuthenticationError(AppError):
    status_code = status.HTTP_401_UNAUTHORIZED
    code = "unauthenticated"
    message = "Authentication is required or has failed."


class PermissionDeniedError(AppError):
    status_code = status.HTTP_403_FORBIDDEN
    code = "permission_denied"
    message = "You do not have permission to perform this action."


class NotFoundError(AppError):
    status_code = status.HTTP_404_NOT_FOUND
    code = "not_found"
    message = "The requested resource was not found."


class ConflictError(AppError):
    status_code = status.HTTP_409_CONFLICT
    code = "conflict"
    message = "The resource already exists or conflicts with current state."


class ValidationAppError(AppError):
    status_code = status.HTTP_422_UNPROCESSABLE_CONTENT
    code = "validation_error"
    message = "The request payload failed validation."


class RateLimitError(AppError):
    status_code = status.HTTP_429_TOO_MANY_REQUESTS
    code = "rate_limited"
    message = "Too many requests. Please slow down."


class ServiceUnavailableError(AppError):
    status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    code = "service_unavailable"
    message = "A dependency is temporarily unavailable."


def _request_id(request: Request) -> str | None:
    return getattr(request.state, "request_id", None)


def _envelope(
    *,
    code: str,
    message: str,
    request: Request,
    status_code: int,
    details: Any = None,
    headers: dict[str, str] | None = None,
) -> JSONResponse:
    body: dict[str, Any] = {"error": {"code": code, "message": message}}
    if details is not None:
        body["error"]["details"] = details
    if rid := _request_id(request):
        body["request_id"] = rid
    return JSONResponse(status_code=status_code, content=body, headers=headers)


def register_exception_handlers(app: FastAPI) -> None:
    settings = get_settings()

    @app.exception_handler(AppError)
    async def _app_error(request: Request, exc: AppError) -> JSONResponse:
        if exc.status_code >= 500:
            logger.error("app_error", code=exc.code, message=exc.message, exc_info=exc)
        else:
            logger.info("app_error", code=exc.code, message=exc.message)
        return _envelope(
            code=exc.code,
            message=exc.message,
            details=exc.details,
            request=request,
            status_code=exc.status_code,
        )

    @app.exception_handler(RequestValidationError)
    async def _validation(request: Request, exc: RequestValidationError) -> JSONResponse:
        return _envelope(
            code="validation_error",
            message="The request payload failed validation.",
            details=jsonable_encoder(exc.errors()),
            request=request,
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
        )

    @app.exception_handler(IntegrityError)
    async def _integrity(request: Request, exc: IntegrityError) -> JSONResponse:
        sqlstate = _sqlstate(exc)
        status_code, code, message = _INTEGRITY_STATUS.get(
            sqlstate or "",
            (status.HTTP_409_CONFLICT, "conflict", ConflictError.message),
        )
        logger.info("integrity_error", sqlstate=sqlstate, code=code)
        return _envelope(code=code, message=message, request=request, status_code=status_code)

    @app.exception_handler(SQLAlchemyError)
    async def _database(request: Request, exc: SQLAlchemyError) -> JSONResponse:
        logger.error("database_error", exc_info=exc)
        return _envelope(
            code="service_unavailable",
            message=ServiceUnavailableError.message,
            request=request,
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        )

    @app.exception_handler(StarletteHTTPException)
    async def _http(request: Request, exc: StarletteHTTPException) -> JSONResponse:
        return _envelope(
            code="http_error",
            message=str(exc.detail),
            request=request,
            status_code=exc.status_code,
            headers=getattr(exc, "headers", None),
        )

    @app.exception_handler(Exception)
    async def _unhandled(request: Request, exc: Exception) -> JSONResponse:
        logger.error("unhandled_exception", exc_info=exc)
        message = (
            "An unexpected error occurred."
            if settings.is_production
            else f"{type(exc).__name__}: {exc}"
        )
        return _envelope(
            code="internal_error",
            message=message,
            request=request,
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
