from __future__ import annotations

from datetime import datetime

from pydantic import Field, model_validator

from fosslove.db.models.enums import Platform
from fosslove.schemas.common import APIModel, StrictModel

MAX_SCRIPT_APPS = 500


class ScriptGenerateRequest(StrictModel):
    platform: Platform
    app_ids: list[int] = Field(default_factory=list)
    collection_id: int | None = Field(default=None, gt=0)

    @model_validator(mode="after")
    def _validate(self) -> ScriptGenerateRequest:
        if self.collection_id is None and not self.app_ids:
            raise ValueError("Provide either app_ids or a collection_id")
        seen: set[int] = set()
        deduped: list[int] = []
        for value in self.app_ids:
            if value <= 0:
                raise ValueError("App IDs must be positive integers")
            if value not in seen:
                seen.add(value)
                deduped.append(value)
        if len(deduped) > MAX_SCRIPT_APPS:
            raise ValueError(f"At most {MAX_SCRIPT_APPS} apps may be requested at once")
        object.__setattr__(self, "app_ids", deduped)
        return self


class ScriptRunRead(APIModel):
    id: int
    platform: Platform
    app_count: int
    app_ids: list[int]
    created_at: datetime
