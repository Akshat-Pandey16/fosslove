from __future__ import annotations

from collections.abc import AsyncIterator

from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse

from fosslove.api.deps import CurrentUser, OptionalUser, PaginationDep, SessionDep
from fosslove.core.middleware import get_client_ip
from fosslove.schemas.common import Page, paginate
from fosslove.schemas.script import ScriptGenerateRequest, ScriptRunRead
from fosslove.services import script_service
from fosslove.services.mappers import to_script_run_read

router = APIRouter(prefix="/scripts", tags=["Scripts"])


async def _stream(content: str) -> AsyncIterator[bytes]:
    yield content.encode("utf-8")


@router.post("/generate")
async def generate_script(
    data: ScriptGenerateRequest,
    request: Request,
    session: SessionDep,
    user: OptionalUser,
) -> StreamingResponse:
    filename, content = await script_service.generate(
        session,
        data,
        user_id=user.id if user else None,
        client_ip=get_client_ip(request),
    )
    return StreamingResponse(
        _stream(content),
        media_type="application/octet-stream",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Cache-Control": "no-store",
        },
    )


@router.get("/history", response_model=Page[ScriptRunRead])
async def list_history(
    user: CurrentUser, pagination: PaginationDep, session: SessionDep
) -> Page[ScriptRunRead]:
    runs, total = await script_service.list_history(session, user.id, pagination)
    return paginate([to_script_run_read(run) for run in runs], total, pagination)
