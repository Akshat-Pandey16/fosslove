from __future__ import annotations

import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from fosslove.core.exceptions import BadRequestError
from fosslove.core.pagination import Pagination
from fosslove.db.models.enums import Platform
from fosslove.db.models.userdata import ScriptRun
from fosslove.schemas.script import ScriptGenerateRequest
from fosslove.scriptgen import build_app_plans, generate_linux_script, generate_windows_script
from fosslove.services import catalog_service, collection_service

_FILENAMES: dict[Platform, str] = {
    Platform.WINDOWS: "install_apps.ps1",
    Platform.LINUX: "install_apps.sh",
}


async def generate(
    session: AsyncSession,
    request: ScriptGenerateRequest,
    *,
    user_id: uuid.UUID | None,
    client_ip: str | None,
) -> tuple[str, str]:
    if request.collection_id is not None:
        collection = await collection_service.get_viewable_collection(
            session, request.collection_id, user_id
        )
        candidate_ids = [link.app_id for link in collection.items]
    else:
        candidate_ids = request.app_ids

    apps = await catalog_service.get_apps_for_ids(session, request.platform, candidate_ids)
    if not apps:
        raise BadRequestError(
            "No installable apps matched your selection for this platform.", code="no_apps"
        )

    plans = build_app_plans(apps, request.platform)
    if not plans:
        raise BadRequestError(
            "The selected apps have no install methods for this platform.", code="no_methods"
        )

    if request.platform is Platform.WINDOWS:
        content = generate_windows_script(plans)
    else:
        content = generate_linux_script(plans)

    session.add(
        ScriptRun(
            user_id=user_id,
            platform=request.platform,
            app_ids=[app.id for app in apps],
            app_count=len(apps),
            client_ip=client_ip,
        )
    )
    await session.commit()
    return _FILENAMES[request.platform], content


async def list_history(
    session: AsyncSession, user_id: uuid.UUID, pagination: Pagination
) -> tuple[list[ScriptRun], int]:
    total = (
        await session.scalar(
            select(func.count()).select_from(ScriptRun).where(ScriptRun.user_id == user_id)
        )
    ) or 0
    rows = await session.scalars(
        select(ScriptRun)
        .where(ScriptRun.user_id == user_id)
        .order_by(ScriptRun.created_at.desc())
        .offset(pagination.offset)
        .limit(pagination.limit)
    )
    return list(rows), total
