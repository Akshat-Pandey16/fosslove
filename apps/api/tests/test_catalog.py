from __future__ import annotations

from httpx import AsyncClient


async def test_create_category_requires_admin(
    client: AsyncClient, auth_headers: dict[str, str]
) -> None:
    response = await client.post(
        "/api/v1/admin/categories", headers=auth_headers, json={"name": "X"}
    )
    assert response.status_code == 403


async def test_category_and_app_count_lifecycle(
    client: AsyncClient, admin_headers: dict[str, str]
) -> None:
    category = await client.post(
        "/api/v1/admin/categories",
        headers=admin_headers,
        json={"name": "Browsers", "description": "web"},
    )
    assert category.status_code == 201
    assert category.json()["slug"] == "browsers"
    category_id = category.json()["id"]

    app = await client.post(
        "/api/v1/admin/apps",
        headers=admin_headers,
        json={
            "category_id": category_id,
            "platform": "windows",
            "name": "Firefox",
            "package_refs": [{"manager": "winget", "identifier": "Mozilla.Firefox"}],
        },
    )
    assert app.status_code == 201
    assert app.json()["category_name"] == "Browsers"
    assert len(app.json()["package_refs"]) == 1

    detail = await client.get(f"/api/v1/categories/{category_id}")
    assert detail.json()["windows_app_count"] == 1

    deleted = await client.delete(f"/api/v1/admin/apps/{app.json()['id']}", headers=admin_headers)
    assert deleted.status_code == 200

    detail_after = await client.get(f"/api/v1/categories/{category_id}")
    assert detail_after.json()["windows_app_count"] == 0


async def test_app_search(client: AsyncClient, admin_headers: dict[str, str]) -> None:
    category = await client.post(
        "/api/v1/admin/categories", headers=admin_headers, json={"name": "Media"}
    )
    category_id = category.json()["id"]
    for name in ("VLC", "GIMP"):
        await client.post(
            "/api/v1/admin/apps",
            headers=admin_headers,
            json={
                "category_id": category_id,
                "platform": "linux",
                "name": name,
                "package_refs": [{"manager": "flatpak", "identifier": f"org.{name}"}],
            },
        )
    response = await client.get("/api/v1/apps", params={"q": "vlc"})
    names = [item["name"] for item in response.json()["items"]]
    assert "VLC" in names
    assert "GIMP" not in names


async def test_update_app_package_refs(
    client: AsyncClient, admin_headers: dict[str, str]
) -> None:
    category = await client.post(
        "/api/v1/admin/categories", headers=admin_headers, json={"name": "Editors"}
    )
    app = await client.post(
        "/api/v1/admin/apps",
        headers=admin_headers,
        json={
            "category_id": category.json()["id"],
            "platform": "linux",
            "name": "Editor",
            "package_refs": [{"manager": "flatpak", "identifier": "org.editor"}],
        },
    )
    app_id = app.json()["id"]
    updated = await client.patch(
        f"/api/v1/admin/apps/{app_id}",
        headers=admin_headers,
        json={
            "package_refs": [
                {"manager": "apt", "identifier": "editor"},
                {"manager": "snap", "identifier": "editor"},
            ]
        },
    )
    assert updated.status_code == 200
    assert sorted(ref["manager"] for ref in updated.json()["package_refs"]) == ["apt", "snap"]

    detail = await client.get(f"/api/v1/apps/{app_id}")
    assert sorted(ref["manager"] for ref in detail.json()["package_refs"]) == ["apt", "snap"]


async def test_duplicate_app_conflict(client: AsyncClient, admin_headers: dict[str, str]) -> None:
    category = await client.post(
        "/api/v1/admin/categories", headers=admin_headers, json={"name": "Cat"}
    )
    payload = {
        "category_id": category.json()["id"],
        "platform": "windows",
        "name": "Dup",
        "package_refs": [{"manager": "winget", "identifier": "x"}],
    }
    await client.post("/api/v1/admin/apps", headers=admin_headers, json=payload)
    duplicate = await client.post("/api/v1/admin/apps", headers=admin_headers, json=payload)
    assert duplicate.status_code == 409


async def test_duplicate_manager_rejected(
    client: AsyncClient, admin_headers: dict[str, str]
) -> None:
    category = await client.post(
        "/api/v1/admin/categories", headers=admin_headers, json={"name": "Dev"}
    )
    response = await client.post(
        "/api/v1/admin/apps",
        headers=admin_headers,
        json={
            "category_id": category.json()["id"],
            "platform": "linux",
            "name": "Thing",
            "package_refs": [
                {"manager": "flatpak", "identifier": "a"},
                {"manager": "flatpak", "identifier": "b"},
            ],
        },
    )
    assert response.status_code == 409
    assert response.json()["error"]["code"] == "duplicate_manager"
