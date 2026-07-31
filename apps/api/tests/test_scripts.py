from __future__ import annotations

from typing import Any

import pytest
from rest_framework.test import APIClient

from fosslove.userdata.models import ScriptRun

pytestmark = pytest.mark.django_db

GENERATE = "/api/v1/scripts/generate"


def test_generate_windows_script(api: APIClient, make_app: Any) -> None:
    app = make_app(name="Firefox", platform="windows")
    response = api.post(GENERATE, {"platform": "windows", "app_ids": [app.pk]}, format="json")
    assert response.status_code == 200
    disposition = response["Content-Disposition"]
    assert disposition.startswith('attachment; filename="install_apps_')
    assert disposition.endswith('.ps1"')
    body = response.content.decode()
    assert "Mozilla.Firefox" in body
    assert body.startswith("#requires -Version")


def test_generate_linux_script(api: APIClient, make_app: Any) -> None:
    app = make_app(
        name="VLC", platform="linux", slug="vlc", manager="flatpak", identifier="org.videolan.VLC"
    )
    response = api.post(GENERATE, {"platform": "linux", "app_ids": [app.pk]}, format="json")
    assert response.status_code == 200
    body = response.content.decode()
    assert body.startswith("#!/usr/bin/env bash")
    assert "flatpak:org.videolan.VLC" in body


def test_generate_reports_skipped_apps(api: APIClient, make_app: Any) -> None:
    windows_app = make_app(name="Firefox", platform="windows")
    linux_app = make_app(
        name="VLC", platform="linux", slug="vlc", manager="flatpak", identifier="org.videolan.VLC"
    )
    response = api.post(
        GENERATE, {"platform": "windows", "app_ids": [windows_app.pk, linux_app.pk]}, format="json"
    )
    assert response.status_code == 200
    assert response["X-Fosslove-Skipped"] == str(linux_app.pk)


def test_generate_requires_selection(api: APIClient) -> None:
    assert api.post(GENERATE, {"platform": "windows"}, format="json").status_code == 422


def test_generate_with_no_matching_apps(api: APIClient) -> None:
    response = api.post(GENERATE, {"platform": "windows", "app_ids": [999999]}, format="json")
    assert response.status_code == 400
    assert response.data["error"]["code"] == "no_apps"


def test_anonymous_run_is_recorded_without_user(api: APIClient, make_app: Any) -> None:
    app = make_app()
    api.post(GENERATE, {"platform": "windows", "app_ids": [app.pk]}, format="json")
    run = ScriptRun.objects.get()
    assert run.user is None
    assert run.app_ids == [app.pk]


def test_history_records_authenticated_runs(auth_api: APIClient, make_app: Any) -> None:
    app = make_app()
    auth_api.post(GENERATE, {"platform": "windows", "app_ids": [app.pk]}, format="json")
    history = auth_api.get("/api/v1/scripts/history")
    assert history.data["meta"]["total"] == 1
    assert history.data["items"][0]["platform"] == "windows"


def test_history_requires_authentication(api: APIClient) -> None:
    assert api.get("/api/v1/scripts/history").status_code == 401


def test_generate_from_collection(auth_api: APIClient, make_app: Any) -> None:
    app = make_app()
    collection = auth_api.post(
        "/api/v1/collections", {"name": "Bundle", "app_ids": [app.pk]}, format="json"
    )
    response = auth_api.post(
        GENERATE, {"platform": "windows", "collection_id": collection.data["id"]}, format="json"
    )
    assert response.status_code == 200
    assert "Mozilla.Firefox" in response.content.decode()
