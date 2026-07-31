from __future__ import annotations

import secrets
import uuid
from dataclasses import dataclass

from django.db.models import Count, Q, QuerySet
from django.utils import timezone

from fosslove.catalog.enums import Platform
from fosslove.catalog.models import App
from fosslove.core.exceptions import BadRequestError
from fosslove.scriptgen import build_app_plans, generate_linux_script, generate_windows_script
from fosslove.userdata.models import Collection

EXTENSIONS: dict[str, str] = {Platform.WINDOWS: "ps1", Platform.LINUX: "sh"}


@dataclass(frozen=True, slots=True)
class GeneratedScript:
    filename: str
    content: str
    app_ids: list[int]
    skipped_ids: list[int]


def collections_with_counts() -> QuerySet[Collection]:
    return Collection.objects.annotate(item_count=Count("items")).order_by("-created_at", "-pk")


def viewable_collection(pk: int, viewer_id: uuid.UUID | None) -> Collection | None:
    queryset = collections_with_counts().prefetch_related("items__app__category")
    return queryset.filter(Q(pk=pk) & (Q(is_public=True) | Q(user_id=viewer_id))).first()


def owned_collection(pk: int, user_id: uuid.UUID) -> Collection | None:
    return (
        collections_with_counts()
        .prefetch_related("items__app__category")
        .filter(pk=pk, user_id=user_id)
        .first()
    )


def script_filename(platform: str) -> str:
    stamp = timezone.now().strftime("%Y%m%d-%H%M%S")
    return f"install_apps_{stamp}_{secrets.token_hex(3)}.{EXTENSIONS[platform]}"


def resolve_apps(platform: str, app_ids: list[int]) -> tuple[list[App], list[int]]:
    if not app_ids:
        return [], []
    found = {
        app.pk: app
        for app in App.objects.filter(
            pk__in=app_ids, platform=platform, is_active=True
        ).prefetch_related("package_refs")
    }
    ordered = [found[app_id] for app_id in app_ids if app_id in found]
    missing = [app_id for app_id in app_ids if app_id not in found]
    return ordered, missing


def build_script(platform: str, app_ids: list[int]) -> GeneratedScript:
    apps, skipped = resolve_apps(platform, app_ids)
    if not apps:
        raise BadRequestError(
            "No installable apps matched your selection for this platform.", code="no_apps"
        )
    plans = build_app_plans(apps, platform)
    if not plans:
        raise BadRequestError(
            "The selected apps have no install methods for this platform.", code="no_methods"
        )
    content = (
        generate_windows_script(plans)
        if platform == Platform.WINDOWS
        else generate_linux_script(plans)
    )
    return GeneratedScript(
        filename=script_filename(platform),
        content=content,
        app_ids=[app.pk for app in apps],
        skipped_ids=skipped,
    )
