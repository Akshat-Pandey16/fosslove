from __future__ import annotations

from typing import Any

import pytest
from rest_framework.test import APIClient

from fosslove.catalog.models import App, Category

pytestmark = pytest.mark.django_db

ADMIN_CATEGORIES = "/api/v1/admin/categories"
ADMIN_APPS = "/api/v1/admin/apps"


def test_category_list_is_public(api: APIClient, category: Category) -> None:
    response = api.get("/api/v1/categories")
    assert response.status_code == 200
    assert response.data["meta"]["total"] == 1
    assert response.data["items"][0]["slug"] == "browsers"


def test_category_write_requires_admin(auth_api: APIClient) -> None:
    assert auth_api.post(ADMIN_CATEGORIES, {"name": "X"}, format="json").status_code == 403


def test_admin_creates_category_with_slug(admin_api: APIClient) -> None:
    response = admin_api.post(ADMIN_CATEGORIES, {"name": "Media Players"}, format="json")
    assert response.status_code == 201, response.data
    assert response.data["slug"] == "media-players"


def test_duplicate_category_name_conflicts(admin_api: APIClient, category: Category) -> None:
    response = admin_api.post(ADMIN_CATEGORIES, {"name": "browsers"}, format="json")
    assert response.status_code == 422


def test_admin_app_lifecycle(admin_api: APIClient, category: Category) -> None:
    payload = {
        "category_id": category.pk,
        "platform": "windows",
        "name": "Firefox",
        "package_refs": [{"manager": "winget", "identifier": "Mozilla.Firefox"}],
    }
    created = admin_api.post(ADMIN_APPS, payload, format="json")
    assert created.status_code == 201, created.data
    app_id = created.data["id"]
    assert created.data["category_name"] == "Browsers"
    assert len(created.data["package_refs"]) == 1

    category.refresh_from_db()
    assert category.windows_app_count == 1

    patched = admin_api.patch(
        f"{ADMIN_APPS}/{app_id}",
        {"package_refs": [{"manager": "msstore", "identifier": "9NZVDKPMR9RD"}]},
        format="json",
    )
    assert patched.status_code == 200
    assert [ref["manager"] for ref in patched.data["package_refs"]] == ["msstore"]

    assert admin_api.delete(f"{ADMIN_APPS}/{app_id}").status_code == 204
    category.refresh_from_db()
    assert category.windows_app_count == 0


def test_duplicate_app_conflicts(admin_api: APIClient, category: Category, make_app: Any) -> None:
    make_app(name="Firefox", platform="windows")
    response = admin_api.post(
        ADMIN_APPS,
        {"category_id": category.pk, "platform": "windows", "name": "Firefox"},
        format="json",
    )
    assert response.status_code == 422


def test_duplicate_manager_rejected(admin_api: APIClient, category: Category) -> None:
    response = admin_api.post(
        ADMIN_APPS,
        {
            "category_id": category.pk,
            "platform": "linux",
            "name": "Thing",
            "package_refs": [
                {"manager": "flatpak", "identifier": "a"},
                {"manager": "flatpak", "identifier": "b"},
            ],
        },
        format="json",
    )
    assert response.status_code == 422


def test_direct_identifier_must_be_url(admin_api: APIClient, category: Category) -> None:
    response = admin_api.post(
        ADMIN_APPS,
        {
            "category_id": category.pk,
            "platform": "windows",
            "name": "Thing",
            "package_refs": [{"manager": "direct", "identifier": "not-a-url"}],
        },
        format="json",
    )
    assert response.status_code == 422


def test_app_search_is_fuzzy(api: APIClient, make_app: Any) -> None:
    make_app(name="Firefox", platform="linux", manager="flatpak", identifier="org.mozilla.firefox")
    make_app(
        name="GIMP", platform="linux", slug="gimp", manager="flatpak", identifier="org.gimp.GIMP"
    )
    exact = api.get("/api/v1/apps", {"q": "firefox"})
    assert [item["name"] for item in exact.data["items"]] == ["Firefox"]

    typo = api.get("/api/v1/apps", {"q": "firefx"})
    assert [item["name"] for item in typo.data["items"]] == ["Firefox"]


def test_platform_and_category_filters(api: APIClient, make_app: Any, category: Category) -> None:
    make_app(name="Firefox", platform="windows")
    make_app(name="VLC", platform="linux", slug="vlc", manager="flatpak", identifier="org.vlc")
    assert api.get("/api/v1/apps", {"platform": "linux"}).data["meta"]["total"] == 1
    assert api.get("/api/v1/apps", {"category_id": category.pk}).data["meta"]["total"] == 2


def test_inactive_apps_hidden_from_public_list(api: APIClient, make_app: Any) -> None:
    app = make_app()
    app.is_active = False
    app.save()
    assert api.get("/api/v1/apps").data["meta"]["total"] == 0


def test_admin_list_includes_inactive(admin_api: APIClient, make_app: Any) -> None:
    app = make_app()
    app.is_active = False
    app.save()
    assert admin_api.get(ADMIN_APPS).data["meta"]["total"] == 1


def test_slug_lookup_routes(api: APIClient, make_app: Any) -> None:
    make_app(name="Firefox", platform="windows")
    assert api.get("/api/v1/apps/by-slug/windows/firefox").data["name"] == "Firefox"
    assert api.get("/api/v1/categories/by-slug/browsers").data["name"] == "Browsers"


def test_etag_returns_304(api: APIClient, category: Category) -> None:
    first = api.get("/api/v1/categories")
    etag = first["ETag"]
    assert etag
    cached = api.get("/api/v1/categories", HTTP_IF_NONE_MATCH=etag)
    assert cached.status_code == 304


def test_write_busts_the_catalog_cache(admin_api: APIClient, category: Category) -> None:
    assert admin_api.get("/api/v1/categories").data["meta"]["total"] == 1
    admin_api.post(ADMIN_CATEGORIES, {"name": "Media"}, format="json")
    assert admin_api.get("/api/v1/categories").data["meta"]["total"] == 2


def test_import_and_export(admin_api: APIClient, category: Category) -> None:
    payload = {
        "apps": [
            {
                "category_id": category.pk,
                "platform": "linux",
                "name": "Ripgrep",
                "package_refs": [{"manager": "apt", "identifier": "ripgrep"}],
            },
            {
                "category_id": category.pk,
                "platform": "linux",
                "name": "fd",
                "package_refs": [{"manager": "apt", "identifier": "fd-find"}],
            },
        ]
    }
    imported = admin_api.post(f"{ADMIN_APPS}/import", payload, format="json")
    assert imported.status_code == 201, imported.data
    assert len(imported.data) == 2

    export = admin_api.get("/api/v1/admin/catalog/export")
    assert export.status_code == 200
    assert {app["name"] for app in export.data["apps"]} == {"Ripgrep", "fd"}


def test_recompute_counts_repairs_drift(
    admin_api: APIClient, category: Category, make_app: Any
) -> None:
    make_app()
    Category.objects.filter(pk=category.pk).update(windows_app_count=99)
    response = admin_api.post("/api/v1/admin/recompute-counts", format="json")
    assert response.status_code == 200
    category.refresh_from_db()
    assert category.windows_app_count == 1


def test_app_detail_orders_package_refs_by_priority(
    api: APIClient, admin_api: APIClient, category: Category
) -> None:
    created = admin_api.post(
        ADMIN_APPS,
        {
            "category_id": category.pk,
            "platform": "linux",
            "name": "GIMP",
            "package_refs": [
                {"manager": "snap", "identifier": "gimp", "priority": 20},
                {"manager": "flatpak", "identifier": "org.gimp.GIMP", "priority": 5},
            ],
        },
        format="json",
    )
    detail = api.get(f"/api/v1/apps/{created.data['id']}")
    assert [ref["manager"] for ref in detail.data["package_refs"]] == ["flatpak", "snap"]


def test_deleting_category_cascades_apps(
    admin_api: APIClient, category: Category, make_app: Any
) -> None:
    make_app()
    assert admin_api.delete(f"{ADMIN_CATEGORIES}/{category.pk}").status_code == 204
    assert App.objects.count() == 0
