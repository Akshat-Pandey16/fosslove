from __future__ import annotations

import pytest_asyncio
from httpx import AsyncClient


@pytest_asyncio.fixture
async def windows_app_id(client: AsyncClient, admin_headers: dict[str, str]) -> int:
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
            "package_refs": [{"manager": "winget", "identifier": "Mozilla.Firefox"}],
        },
    )
    app_id: int = response.json()["id"]
    return app_id


async def test_generate_windows_script(client: AsyncClient, windows_app_id: int) -> None:
    response = await client.post(
        "/api/v1/scripts/generate",
        json={"platform": "windows", "app_ids": [windows_app_id]},
    )
    assert response.status_code == 200
    assert response.headers["content-disposition"] == 'attachment; filename="install_apps.ps1"'
    assert "Mozilla.Firefox" in response.text


async def test_generate_with_no_matching_apps(client: AsyncClient) -> None:
    response = await client.post(
        "/api/v1/scripts/generate", json={"platform": "windows", "app_ids": [999999]}
    )
    assert response.status_code == 400
    assert response.json()["error"]["code"] == "no_apps"


async def test_generate_requires_app_ids_or_collection(client: AsyncClient) -> None:
    response = await client.post("/api/v1/scripts/generate", json={"platform": "windows"})
    assert response.status_code == 422


async def test_history_requires_auth(client: AsyncClient) -> None:
    response = await client.get("/api/v1/scripts/history")
    assert response.status_code == 401


async def test_history_records_runs(
    client: AsyncClient, auth_headers: dict[str, str], windows_app_id: int
) -> None:
    await client.post(
        "/api/v1/scripts/generate",
        headers=auth_headers,
        json={"platform": "windows", "app_ids": [windows_app_id]},
    )
    history = await client.get("/api/v1/scripts/history", headers=auth_headers)
    assert history.json()["meta"]["total"] == 1
    assert history.json()["items"][0]["platform"] == "windows"
