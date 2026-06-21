from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any

from fosslove.schemas.common import APIModel


class ActivityLogRead(APIModel):
    id: int
    user_id: uuid.UUID | None
    action: str
    status: str
    target_type: str | None
    target_id: str | None
    client_ip: str | None
    request_id: str | None
    user_agent: str | None
    detail: dict[str, Any] | None
    created_at: datetime
