from __future__ import annotations

from typing import Any, cast

from django.http import HttpRequest
from django.utils import timezone
from rest_framework_simplejwt.state import token_backend
from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken, OutstandingToken
from rest_framework_simplejwt.tokens import RefreshToken

from fosslove.accounts.models import SessionMetadata, User
from fosslove.core.request import client_ip
from fosslove.userdata.models import Collection, Favorite, ScriptRun


def attach_session_metadata(raw_refresh: str, request: HttpRequest) -> None:
    jti = token_backend.decode(cast("Any", raw_refresh), verify=False).get("jti")
    outstanding = OutstandingToken.objects.filter(jti=jti).first()
    if outstanding is None:
        return
    SessionMetadata.objects.update_or_create(
        token=outstanding,
        defaults={
            "user_agent": request.headers.get("user-agent", "")[:400],
            "client_ip": client_ip(request),
            "last_used_at": timezone.now(),
        },
    )


def issue_tokens(user: User, request: HttpRequest) -> dict[str, str]:
    refresh = RefreshToken.for_user(user)
    refresh["role"] = user.role
    raw_refresh = str(refresh)
    attach_session_metadata(raw_refresh, request)
    return {"access": str(refresh.access_token), "refresh": raw_refresh}


def active_sessions(user: User) -> Any:
    return (
        OutstandingToken.objects.filter(user=user, expires_at__gt=timezone.now())
        .exclude(id__in=BlacklistedToken.objects.values("token_id"))
        .select_related("metadata")
        .order_by("-created_at")
    )


def revoke_all_sessions(user: User) -> int:
    tokens = OutstandingToken.objects.filter(user=user).exclude(
        id__in=BlacklistedToken.objects.values("token_id")
    )
    created = 0
    for token in tokens:
        _, was_created = BlacklistedToken.objects.get_or_create(token=token)
        created += int(was_created)
    return created


def export_user_data(user: User) -> dict[str, Any]:
    collections = Collection.objects.filter(user=user).prefetch_related("items")
    return {
        "collections": [
            {
                "id": collection.pk,
                "name": collection.name,
                "slug": collection.slug,
                "is_public": collection.is_public,
                "app_ids": [item.app_id for item in collection.items.all()],
                "created_at": collection.created_at.isoformat(),
            }
            for collection in collections
        ],
        "favorites": list(Favorite.objects.filter(user=user).values_list("app_id", flat=True)),
        "script_runs": [
            {
                "id": run.pk,
                "platform": run.platform,
                "app_ids": run.app_ids,
                "created_at": run.created_at.isoformat(),
            }
            for run in ScriptRun.objects.filter(user=user).order_by("created_at")
        ],
    }
