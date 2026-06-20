from __future__ import annotations

import pytest_asyncio
from httpx import AsyncClient


@pytest_asyncio.fixture
async def app_ids(client: AsyncClient, admin_headers: dict[str, str]) -> list[int]:
    category = await client.post(
        "/api/v1/admin/categories", headers=admin_headers, json={"name": "Tools"}
    )
    category_id = category.json()["id"]
    ids: list[int] = []
    for name in ("AppA", "AppB"):
        response = await client.post(
            "/api/v1/admin/apps",
            headers=admin_headers,
            json={
                "category_id": category_id,
                "platform": "linux",
                "name": name,
                "package_refs": [{"manager": "flatpak", "identifier": f"org.{name}"}],
            },
        )
        ids.append(response.json()["id"])
    return ids


async def test_collection_lifecycle(
    client: AsyncClient, auth_headers: dict[str, str], app_ids: list[int]
) -> None:
    created = await client.post(
        "/api/v1/collections",
        headers=auth_headers,
        json={"name": "My Setup", "app_ids": app_ids},
    )
    assert created.status_code == 201
    assert created.json()["item_count"] == 2
    collection_id = created.json()["id"]

    listed = await client.get("/api/v1/collections", headers=auth_headers)
    assert listed.json()["meta"]["total"] == 1

    updated = await client.patch(
        f"/api/v1/collections/{collection_id}",
        headers=auth_headers,
        json={"name": "Renamed", "is_public": True},
    )
    assert updated.json()["name"] == "Renamed"

    set_apps = await client.patch(
        f"/api/v1/collections/{collection_id}/apps",
        headers=auth_headers,
        json={"app_ids": [app_ids[0]]},
    )
    assert set_apps.json()["item_count"] == 1

    public = await client.get("/api/v1/collections/public")
    assert any(item["id"] == collection_id for item in public.json()["items"])

    deleted = await client.delete(f"/api/v1/collections/{collection_id}", headers=auth_headers)
    assert deleted.status_code == 200


async def test_private_collection_hidden_from_anonymous(
    client: AsyncClient, auth_headers: dict[str, str], app_ids: list[int]
) -> None:
    created = await client.post(
        "/api/v1/collections",
        headers=auth_headers,
        json={"name": "Private", "app_ids": app_ids},
    )
    collection_id = created.json()["id"]
    anonymous = await client.get(f"/api/v1/collections/{collection_id}")
    assert anonymous.status_code == 404


async def test_collection_rejects_unknown_app(
    client: AsyncClient, auth_headers: dict[str, str]
) -> None:
    response = await client.post(
        "/api/v1/collections",
        headers=auth_headers,
        json={"name": "Bad", "app_ids": [999999]},
    )
    assert response.status_code == 400
    assert response.json()["error"]["code"] == "unknown_apps"
