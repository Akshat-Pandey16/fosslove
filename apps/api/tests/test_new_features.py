from __future__ import annotations

import pytest_asyncio
from httpx import AsyncClient


@pytest_asyncio.fixture
async def app_id(client: AsyncClient, admin_headers: dict[str, str]) -> int:
    category = await client.post(
        "/api/v1/admin/categories", headers=admin_headers, json={"name": "Browsers"}
    )
    response = await client.post(
        "/api/v1/admin/apps",
        headers=admin_headers,
        json={
            "category_id": category.json()["id"],
            "platform": "windows",
            "name": "Firefox",
            "homepage_url": "https://mozilla.org",
            "package_refs": [{"manager": "winget", "identifier": "Mozilla.Firefox"}],
        },
    )
    new_id: int = response.json()["id"]
    return new_id


async def test_refresh_rotation_detects_reuse(client: AsyncClient) -> None:
    await client.post(
        "/api/v1/auth/register",
        json={"email": "rot@test.io", "password": "Rotate123"},
    )
    login = await client.post(
        "/api/v1/auth/login", json={"email": "rot@test.io", "password": "Rotate123"}
    )
    refresh_token = login.json()["refresh_token"]

    first = await client.post("/api/v1/auth/refresh", json={"refresh_token": refresh_token})
    assert first.status_code == 200

    reuse = await client.post("/api/v1/auth/refresh", json={"refresh_token": refresh_token})
    assert reuse.status_code == 401
    assert reuse.json()["error"]["code"] == "token_reuse"


async def test_sessions_list_and_revoke(client: AsyncClient, auth_headers: dict[str, str]) -> None:
    sessions = await client.get("/api/v1/users/me/sessions", headers=auth_headers)
    assert sessions.status_code == 200
    assert len(sessions.json()) >= 1
    token_id = sessions.json()[0]["id"]

    revoke = await client.delete(f"/api/v1/users/me/sessions/{token_id}", headers=auth_headers)
    assert revoke.status_code == 204

    after = await client.get("/api/v1/users/me/sessions", headers=auth_headers)
    assert all(item["id"] != token_id for item in after.json())


async def test_email_change_immediate_when_email_disabled(
    client: AsyncClient, auth_headers: dict[str, str]
) -> None:
    response = await client.post(
        "/api/v1/users/me/email",
        headers=auth_headers,
        json={"new_email": "moved@test.io"},
    )
    assert response.status_code == 200
    me = await client.get("/api/v1/users/me", headers=auth_headers)
    assert me.json()["email"] == "moved@test.io"


async def test_favorites_put_is_idempotent(
    client: AsyncClient, auth_headers: dict[str, str], app_id: int
) -> None:
    first = await client.post(f"/api/v1/favorites/{app_id}", headers=auth_headers)
    second = await client.post(f"/api/v1/favorites/{app_id}", headers=auth_headers)
    assert first.status_code == 204
    assert second.status_code == 204
    listing = await client.get("/api/v1/favorites", headers=auth_headers)
    assert listing.json()["meta"]["total"] == 1

    ids = await client.get("/api/v1/favorites/ids", headers=auth_headers)
    assert ids.status_code == 200
    assert ids.json() == [app_id]


async def test_slug_lookup_routes(client: AsyncClient, app_id: int) -> None:
    response = await client.get("/api/v1/apps/by-slug/windows/firefox")
    assert response.status_code == 200
    assert response.json()["name"] == "Firefox"

    category = await client.get("/api/v1/categories/by-slug/browsers")
    assert category.status_code == 200
    assert category.json()["name"] == "Browsers"


async def test_bulk_import_and_export(client: AsyncClient, admin_headers: dict[str, str]) -> None:
    category = await client.post(
        "/api/v1/admin/categories", headers=admin_headers, json={"name": "Tools"}
    )
    category_id = category.json()["id"]
    payload = {
        "apps": [
            {
                "category_id": category_id,
                "platform": "linux",
                "name": "Ripgrep",
                "package_refs": [{"manager": "apt", "identifier": "ripgrep"}],
            },
            {
                "category_id": category_id,
                "platform": "linux",
                "name": "Fd",
                "package_refs": [{"manager": "apt", "identifier": "fd-find"}],
            },
        ]
    }
    imported = await client.post("/api/v1/admin/apps/import", headers=admin_headers, json=payload)
    assert imported.status_code == 201
    assert len(imported.json()) == 2

    export = await client.get("/api/v1/admin/catalog/export", headers=admin_headers)
    assert export.status_code == 200
    assert {app["name"] for app in export.json()["apps"]} >= {"Ripgrep", "Fd"}


async def test_direct_identifier_must_be_url(
    client: AsyncClient, admin_headers: dict[str, str]
) -> None:
    category = await client.post(
        "/api/v1/admin/categories", headers=admin_headers, json={"name": "Direct"}
    )
    response = await client.post(
        "/api/v1/admin/apps",
        headers=admin_headers,
        json={
            "category_id": category.json()["id"],
            "platform": "windows",
            "name": "Thing",
            "package_refs": [{"manager": "direct", "identifier": "not-a-url"}],
        },
    )
    assert response.status_code == 422


async def test_catalog_etag_conditional_get(client: AsyncClient, app_id: int) -> None:
    first = await client.get("/api/v1/categories")
    assert first.status_code == 200
    etag = first.headers["etag"]
    assert etag

    cached = await client.get("/api/v1/categories", headers={"If-None-Match": etag})
    assert cached.status_code == 304


async def test_admin_activity_log_with_filter(
    client: AsyncClient, admin_headers: dict[str, str]
) -> None:
    await client.post(
        "/api/v1/auth/register",
        json={"email": "logme@test.io", "password": "LogMe1234"},
    )
    await client.post(
        "/api/v1/auth/login", json={"email": "logme@test.io", "password": "LogMe1234"}
    )
    activity = await client.get(
        "/api/v1/admin/activity",
        headers=admin_headers,
        params={"action": "auth.login"},
    )
    assert activity.status_code == 200
    assert activity.json()["meta"]["total"] >= 1
    assert all(item["action"] == "auth.login" for item in activity.json()["items"])


async def test_unverified_user_blocked_from_features(
    client: AsyncClient, admin_headers: dict[str, str]
) -> None:
    await client.patch(
        "/api/v1/admin/settings", headers=admin_headers, json={"email_enabled": True}
    )
    await client.post(
        "/api/v1/auth/register", json={"email": "unverified@test.io", "password": "Unverif123"}
    )
    login = await client.post(
        "/api/v1/auth/login", json={"email": "unverified@test.io", "password": "Unverif123"}
    )
    headers = {"Authorization": f"Bearer {login.json()['access_token']}"}
    response = await client.get("/api/v1/favorites", headers=headers)
    assert response.status_code == 403
    assert response.json()["error"]["code"] == "email_unverified"


async def test_invalid_homepage_url_rejected(
    client: AsyncClient, admin_headers: dict[str, str]
) -> None:
    category = await client.post(
        "/api/v1/admin/categories", headers=admin_headers, json={"name": "Bad"}
    )
    response = await client.post(
        "/api/v1/admin/apps",
        headers=admin_headers,
        json={
            "category_id": category.json()["id"],
            "platform": "windows",
            "name": "BadApp",
            "homepage_url": "javascript:alert(1)",
            "package_refs": [{"manager": "winget", "identifier": "x"}],
        },
    )
    assert response.status_code == 422
