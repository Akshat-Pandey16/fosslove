from __future__ import annotations

from typing import Any

import pytest
from rest_framework.test import APIClient

pytestmark = pytest.mark.django_db

COLLECTIONS = "/api/v1/collections"


@pytest.fixture
def app_ids(make_app: Any) -> list[int]:
    first = make_app(
        name="AppA", platform="linux", slug="app-a", manager="flatpak", identifier="org.a"
    )
    second = make_app(
        name="AppB", platform="linux", slug="app-b", manager="flatpak", identifier="org.b"
    )
    return [first.pk, second.pk]


def test_collection_lifecycle(auth_api: APIClient, app_ids: list[int]) -> None:
    created = auth_api.post(COLLECTIONS, {"name": "My Setup", "app_ids": app_ids}, format="json")
    assert created.status_code == 201, created.data
    assert created.data["item_count"] == 2
    collection_id = created.data["id"]

    assert auth_api.get(COLLECTIONS).data["meta"]["total"] == 1

    renamed = auth_api.patch(
        f"{COLLECTIONS}/{collection_id}", {"name": "Renamed", "is_public": True}, format="json"
    )
    assert renamed.status_code == 200
    assert renamed.data["name"] == "Renamed"
    assert renamed.data["slug"] == "renamed"

    trimmed = auth_api.patch(
        f"{COLLECTIONS}/{collection_id}/apps", {"app_ids": [app_ids[0]]}, format="json"
    )
    assert trimmed.status_code == 200
    assert trimmed.data["item_count"] == 1

    public = auth_api.get(f"{COLLECTIONS}/public")
    assert any(item["id"] == collection_id for item in public.data["items"])

    assert auth_api.delete(f"{COLLECTIONS}/{collection_id}").status_code == 204


def test_duplicate_name_rejected(auth_api: APIClient) -> None:
    auth_api.post(COLLECTIONS, {"name": "Setup"}, format="json")
    dup = auth_api.post(COLLECTIONS, {"name": "setup"}, format="json")
    assert dup.status_code == 422


def test_private_collection_hidden_from_anonymous(
    auth_api: APIClient, api: APIClient, app_ids: list[int]
) -> None:
    created = auth_api.post(COLLECTIONS, {"name": "Private", "app_ids": app_ids}, format="json")
    anonymous = APIClient()
    assert anonymous.get(f"{COLLECTIONS}/{created.data['id']}").status_code == 400


def test_unknown_app_rejected(auth_api: APIClient) -> None:
    response = auth_api.post(COLLECTIONS, {"name": "Bad", "app_ids": [999999]}, format="json")
    assert response.status_code == 422


def test_app_ids_deduplicated(auth_api: APIClient, app_ids: list[int]) -> None:
    created = auth_api.post(
        COLLECTIONS,
        {"name": "Dupes", "app_ids": [app_ids[0], app_ids[0], app_ids[1]]},
        format="json",
    )
    assert created.data["item_count"] == 2


def test_collections_require_authentication(api: APIClient) -> None:
    assert api.get(COLLECTIONS).status_code == 401
