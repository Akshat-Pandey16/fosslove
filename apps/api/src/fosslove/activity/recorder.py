from __future__ import annotations

from typing import Any

from django.db import DatabaseError
from django.http import HttpRequest

from fosslove.activity.models import ActivityLog, ActivityStatus
from fosslove.core.logging import get_logger
from fosslove.core.request import client_ip, request_id

logger = get_logger(__name__)

UNSET: Any = object()


def record(
    request: HttpRequest,
    action: str,
    *,
    actor: Any = UNSET,
    status: str = ActivityStatus.OK,
    target_type: str = "",
    target_id: str = "",
    detail: dict[str, Any] | None = None,
) -> None:
    user = getattr(request, "user", None) if actor is UNSET else actor
    if user is not None and (
        not getattr(user, "is_authenticated", False) or getattr(user, "pk", None) is None
    ):
        user = None
    try:
        ActivityLog.objects.create(
            user=user,
            action=action,
            status=status,
            target_type=target_type,
            target_id=target_id,
            client_ip=client_ip(request),
            request_id=request_id(request) or "",
            user_agent=request.headers.get("user-agent", "")[:400],
            detail=detail,
        )
    except DatabaseError as exc:
        logger.warning("activity_record_failed", action=action, error=str(exc))
