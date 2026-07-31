from __future__ import annotations

from collections.abc import Iterable
from dataclasses import dataclass

from fosslove.catalog.enums import MANAGERS_BY_PLATFORM
from fosslove.catalog.models import App


@dataclass(frozen=True, slots=True)
class PackageCandidate:
    manager: str
    identifier: str
    install_args: str


@dataclass(frozen=True, slots=True)
class AppPlan:
    name: str
    candidates: tuple[PackageCandidate, ...]


def build_app_plans(apps: Iterable[App], platform: str) -> list[AppPlan]:
    order = {manager: index for index, manager in enumerate(MANAGERS_BY_PLATFORM[platform])}
    plans: list[AppPlan] = []
    for app in apps:
        refs = sorted(
            (ref for ref in app.package_refs.all() if ref.manager in order),
            key=lambda ref: (ref.priority, order[ref.manager]),
        )
        seen: set[str] = set()
        candidates: list[PackageCandidate] = []
        for ref in refs:
            if ref.manager in seen:
                continue
            seen.add(ref.manager)
            candidates.append(PackageCandidate(ref.manager, ref.identifier, ref.install_args or ""))
        if candidates:
            plans.append(AppPlan(name=app.name, candidates=tuple(candidates)))
    return plans


def ps_quote(value: str) -> str:
    return "'" + value.replace("'", "''") + "'"


def sh_quote(value: str) -> str:
    return "'" + value.replace("'", "'\\''") + "'"
