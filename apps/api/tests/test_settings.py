from __future__ import annotations

from httpx import AsyncClient


async def test_settings_requires_admin(client: AsyncClient, auth_headers: dict[str, str]) -> None:
    response = await client.get("/api/v1/admin/settings", headers=auth_headers)
    assert response.status_code == 403


async def test_settings_defaults(client: AsyncClient, admin_headers: dict[str, str]) -> None:
    response = await client.get("/api/v1/admin/settings", headers=admin_headers)
    assert response.status_code == 200
    body = response.json()
    assert body["registration_enabled"] is True
    assert body["email_enabled"] is False
    assert body["smtp_password_set"] is False


async def test_disable_registration(client: AsyncClient, admin_headers: dict[str, str]) -> None:
    patch = await client.patch(
        "/api/v1/admin/settings", headers=admin_headers, json={"registration_enabled": False}
    )
    assert patch.status_code == 200
    assert patch.json()["registration_enabled"] is False

    register = await client.post(
        "/api/v1/auth/register", json={"email": "blocked@test.io", "password": "Pass12345"}
    )
    assert register.status_code == 403
    assert register.json()["error"]["code"] == "registration_disabled"


async def test_update_rate_limit_and_smtp_password_masked(
    client: AsyncClient, admin_headers: dict[str, str]
) -> None:
    patch = await client.patch(
        "/api/v1/admin/settings",
        headers=admin_headers,
        json={"rate_limit_default": "5/minute", "smtp_password": "supersecret"},
    )
    assert patch.status_code == 200
    body = patch.json()
    assert body["rate_limit_default"] == "5/minute"
    assert body["smtp_password_set"] is True
    assert "smtp_password" not in body


async def test_invalid_rate_limit_rejected(
    client: AsyncClient, admin_headers: dict[str, str]
) -> None:
    response = await client.patch(
        "/api/v1/admin/settings", headers=admin_headers, json={"rate_limit_default": "nonsense"}
    )
    assert response.status_code == 422
