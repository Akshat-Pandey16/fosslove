from __future__ import annotations

from collections.abc import AsyncIterator

from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse

from fosslove.api.deps import ActivityDep, OptionalUser, PaginationDep, SessionDep, VerifiedUser
from fosslove.core.middleware import get_client_ip
from fosslove.schemas.common import Page, paginate
from fosslove.schemas.script import ScriptGenerateRequest, ScriptRunRead
from fosslove.services import script_service
from fosslove.services.activity_service import Action
from fosslove.services.mappers import to_script_run_read

router = APIRouter(prefix="/scripts", tags=["Scripts"])


async def _stream(content: str) -> AsyncIterator[bytes]:
    yield content.encode("utf-8")


@router.post(
    "/generate",
    responses={
        200: {"content": {"text/plain": {}}, "description": "The generated install script."}
    },
)
async def generate_script(
    data: ScriptGenerateRequest,
    request: Request,
    session: SessionDep,
    user: OptionalUser,
    activity: ActivityDep,
) -> StreamingResponse:
    actor_id = user.id if user else None
    result = await script_service.generate(
        session,
        data,
        user_id=actor_id,
        client_ip=get_client_ip(request),
    )
    await activity.record(
        Action.SCRIPT_GENERATE,
        actor_id=actor_id,
        target_type="platform",
        target_id=data.platform.value,
        detail={"app_count": len(result.app_ids), "skipped_ids": result.skipped_ids},
    )
    headers = {
        "Content-Disposition": f'attachment; filename="{result.filename}"',
        "Cache-Control": "no-store",
    }
    if result.skipped_ids:
        headers["X-Fosslove-Skipped"] = ",".join(str(app_id) for app_id in result.skipped_ids)
    return StreamingResponse(
        _stream(result.content),
        media_type="text/plain; charset=utf-8",
        headers=headers,
    )


@router.get("/history", response_model=Page[ScriptRunRead])
async def list_history(
    user: VerifiedUser, pagination: PaginationDep, session: SessionDep
) -> Page[ScriptRunRead]:
    runs, total = await script_service.list_history(session, user.id, pagination)
    return paginate([to_script_run_read(run) for run in runs], total, pagination)
