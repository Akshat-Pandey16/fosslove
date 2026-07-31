from __future__ import annotations

import pytest
from rest_framework.test import APIClient

from fosslove.activity.models import ActivityLog

pytestmark = pytest.mark.django_db

ACTIVITY = "/api/v1/admin/activity"


def test_activity_requires_admin(auth_api: APIClient) -> None:
    assert auth_api.get(ACTIVITY).status_code == 403


def test_login_is_recorded(admin_api: APIClient) -> None:
    response = admin_api.get(ACTIVITY, {"action": "auth.login"})
    assert response.status_code == 200
    assert response.data["meta"]["total"] >= 1
    assert all(item["action"] == "auth.login" for item in response.data["items"])


def test_failed_login_is_recorded_as_failure(api: APIClient, admin_api: APIClient) -> None:
    api.post(
        "/api/v1/auth/login", {"email": "admin@test.io", "password": "wrongpass1"}, format="json"
    )
    response = admin_api.get(ACTIVITY, {"action": "auth.login_failed"})
    assert response.data["meta"]["total"] == 1
    assert response.data["items"][0]["status"] == "failure"


def test_admin_writes_are_recorded(admin_api: APIClient) -> None:
    admin_api.post("/api/v1/admin/categories", {"name": "Recorded"}, format="json")
    logged = ActivityLog.objects.filter(action="catalog.category_create").first()
    assert logged is not None
    assert logged.target_type == "category"
    assert logged.request_id


def test_status_filter(admin_api: APIClient) -> None:
    response = admin_api.get(ACTIVITY, {"status": "ok"})
    assert response.status_code == 200
    assert all(item["status"] == "ok" for item in response.data["items"])
