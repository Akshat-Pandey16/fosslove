from __future__ import annotations

from typing import Any

import pytest
from rest_framework.test import APIClient

pytestmark = pytest.mark.django_db

SETTINGS = "/api/v1/admin/settings"


def test_settings_require_admin(auth_api: APIClient) -> None:
    assert auth_api.get(SETTINGS).status_code == 403


def test_settings_expose_env_defaults(admin_api: APIClient) -> None:
    response = admin_api.get(SETTINGS)
    assert response.status_code == 200
    assert response.data["registration_enabled"] is True
    assert response.data["email_enabled"] is False
    assert response.data["smtp_password_set"] is False
    assert response.data["rate_limit_default"] == "200/minute"


def test_patch_overrides_env_default(admin_api: APIClient) -> None:
    response = admin_api.patch(SETTINGS, {"rate_limit_default": "5/minute"}, format="json")
    assert response.status_code == 200
    assert response.data["rate_limit_default"] == "5/minute"


def test_invalid_rate_limit_rejected(admin_api: APIClient) -> None:
    response = admin_api.patch(SETTINGS, {"rate_limit_default": "nonsense"}, format="json")
    assert response.status_code == 422


def test_smtp_password_is_write_only(admin_api: APIClient) -> None:
    response = admin_api.patch(SETTINGS, {"smtp_password": "supersecret"}, format="json")
    assert response.status_code == 200
    assert "smtp_password" not in response.data
    assert response.data["smtp_password_set"] is True


def test_null_override_falls_back_to_env(config: Any, settings: Any) -> None:
    assert config.registration_enabled is None
    settings.REGISTRATION_ENABLED = False
    assert config.effective_registration_enabled is False


def test_cleanup_tokens_endpoint(admin_api: APIClient) -> None:
    response = admin_api.post("/api/v1/admin/cleanup-tokens", format="json")
    assert response.status_code == 200
