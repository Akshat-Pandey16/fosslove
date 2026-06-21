from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import ColumnElement, func, select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from fosslove.core.logging import get_logger
from fosslove.core.pagination import Pagination
from fosslove.db.models.activity import ActivityLog
from fosslove.db.session import get_sessionmaker

logger = get_logger(__name__)


class Action:
    LOGIN = "auth.login"
    LOGIN_FAILED = "auth.login_failed"
    LOGOUT = "auth.logout"
    REGISTER = "auth.register"
    TOKEN_REFRESH = "auth.token_refresh"
    PASSWORD_CHANGE = "auth.password_change"
    PASSWORD_RESET = "auth.password_reset"
    PASSWORD_RESET_REQUEST = "auth.password_reset_request"
    EMAIL_VERIFY = "auth.email_verify"
    EMAIL_CHANGE_REQUEST = "auth.email_change_request"
    EMAIL_CHANGE = "auth.email_change"
    SESSION_REVOKE = "auth.session_revoke"
    PROFILE_UPDATE = "account.profile_update"
    ACCOUNT_DELETE = "account.delete"
    DATA_EXPORT = "account.data_export"
    CATEGORY_CREATE = "catalog.category_create"
    CATEGORY_UPDATE = "catalog.category_update"
    CATEGORY_DELETE = "catalog.category_delete"
    APP_CREATE = "catalog.app_create"
    APP_UPDATE = "catalog.app_update"
    APP_DELETE = "catalog.app_delete"
    APP_IMPORT = "catalog.app_import"
    SETTINGS_UPDATE = "admin.settings_update"
    RECOMPUTE_COUNTS = "admin.recompute_counts"
    CLEANUP_TOKENS = "admin.cleanup_tokens"
    SCRIPT_GENERATE = "script.generate"
    COLLECTION_CREATE = "collection.create"
    COLLECTION_UPDATE = "collection.update"
    COLLECTION_SET_APPS = "collection.set_apps"
    COLLECTION_DELETE = "collection.delete"
    FAVORITE_ADD = "favorite.add"
    FAVORITE_REMOVE = "favorite.remove"


async def record(
    *,
    action: str,
    user_id: uuid.UUID | None = None,
    status: str = "ok",
    target_type: str | None = None,
    target_id: str | None = None,
    client_ip: str | None = None,
    request_id: str | None = None,
    user_agent: str | None = None,
    detail: dict[str, Any] | None = None,
) -> None:
    try:
        factory = get_sessionmaker()
        async with factory() as session:
            session.add(
                ActivityLog(
                    action=action,
                    user_id=user_id,
                    status=status,
                    target_type=target_type,
                    target_id=target_id,
                    client_ip=client_ip,
                    request_id=request_id,
                    user_agent=user_agent[:400] if user_agent else None,
                    detail=detail,
                )
            )
            await session.commit()
    except SQLAlchemyError as exc:
        logger.warning("activity_record_failed", action=action, error=str(exc))


async def list_activity(
    session: AsyncSession,
    pagination: Pagination,
    *,
    action: str | None = None,
    user_id: uuid.UUID | None = None,
    target_type: str | None = None,
    status: str | None = None,
    since: datetime | None = None,
    until: datetime | None = None,
) -> tuple[list[ActivityLog], int]:
    conditions: list[ColumnElement[bool]] = []
    if action:
        conditions.append(ActivityLog.action == action)
    if user_id is not None:
        conditions.append(ActivityLog.user_id == user_id)
    if target_type:
        conditions.append(ActivityLog.target_type == target_type)
    if status:
        conditions.append(ActivityLog.status == status)
    if since is not None:
        conditions.append(ActivityLog.created_at >= since)
    if until is not None:
        conditions.append(ActivityLog.created_at <= until)

    total = (
        await session.scalar(select(func.count()).select_from(ActivityLog).where(*conditions))
    ) or 0
    rows = await session.scalars(
        select(ActivityLog)
        .where(*conditions)
        .order_by(ActivityLog.created_at.desc(), ActivityLog.id.desc())
        .offset(pagination.offset)
        .limit(pagination.limit)
    )
    return list(rows), total
