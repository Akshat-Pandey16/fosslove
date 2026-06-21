from __future__ import annotations

from typing import Any

from sqlalchemy import event, inspect, update
from sqlalchemy.orm import InstanceState, InstrumentedAttribute, Session

from fosslove.db.models.catalog import App, Category
from fosslove.db.models.enums import Platform


def _count_column(platform: Platform) -> InstrumentedAttribute[int]:
    if platform is Platform.WINDOWS:
        return Category.windows_app_count
    return Category.linux_app_count


def _is_active(value: Any) -> bool:
    return value is not False


def _old_value(state: InstanceState[App], attr: str, current: Any) -> Any:
    history = state.attrs[attr].history
    if history.has_changes() and history.deleted:
        return history.deleted[0]
    return current


@event.listens_for(Session, "before_flush")
def _maintain_category_counts(session: Session, flush_context: Any, instances: Any) -> None:
    deltas: dict[tuple[int, Platform], int] = {}

    def bump(category_id: int, platform: Platform, amount: int) -> None:
        key = (category_id, platform)
        deltas[key] = deltas.get(key, 0) + amount

    for obj in session.new:
        if isinstance(obj, App) and _is_active(obj.is_active):
            bump(obj.category_id, obj.platform, 1)
    for obj in session.deleted:
        if isinstance(obj, App) and _is_active(obj.is_active):
            bump(obj.category_id, obj.platform, -1)
    for obj in session.dirty:
        if not isinstance(obj, App):
            continue
        state = inspect(obj)
        if _is_active(_old_value(state, "is_active", obj.is_active)):
            bump(
                _old_value(state, "category_id", obj.category_id),
                _old_value(state, "platform", obj.platform),
                -1,
            )
        if _is_active(obj.is_active):
            bump(obj.category_id, obj.platform, 1)

    deleted_category_ids = {obj.id for obj in session.deleted if isinstance(obj, Category)}
    for (category_id, platform), delta in deltas.items():
        if delta and category_id not in deleted_category_ids:
            column = _count_column(platform)
            session.execute(
                update(Category).where(Category.id == category_id).values({column: column + delta})
            )
