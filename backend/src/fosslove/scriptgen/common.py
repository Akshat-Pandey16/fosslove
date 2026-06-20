from __future__ import annotations

from collections.abc import Iterable
from dataclasses import dataclass

from fosslove.db.models.catalog import App
from fosslove.db.models.enums import MANAGERS_BY_PLATFORM, PackageManager, Platform


@dataclass(frozen=True, slots=True)
class PackageCandidate:
    manager: PackageManager
    identifier: str
    install_args: str | None


@dataclass(frozen=True, slots=True)
class AppPlan:
    name: str
    candidates: tuple[PackageCandidate, ...]


def build_app_plans(apps: Iterable[App], platform: Platform) -> list[AppPlan]:
    order = {manager: index for index, manager in enumerate(MANAGERS_BY_PLATFORM[platform])}
    plans: list[AppPlan] = []
    for app in apps:
        refs = sorted(
            (ref for ref in app.package_refs if ref.manager in order),
            key=lambda ref: (ref.priority, order[ref.manager]),
        )
        seen: set[PackageManager] = set()
        candidates: list[PackageCandidate] = []
        for ref in refs:
            if ref.manager in seen:
                continue
            seen.add(ref.manager)
            candidates.append(PackageCandidate(ref.manager, ref.identifier, ref.install_args))
        if candidates:
            plans.append(AppPlan(name=app.name, candidates=tuple(candidates)))
    return plans


def ps_quote(value: str) -> str:
    return "'" + value.replace("'", "''") + "'"


def sh_quote(value: str) -> str:
    return "'" + value.replace("'", "'\\''") + "'"
