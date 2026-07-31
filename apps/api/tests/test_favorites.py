from __future__ import annotations

from typing import Any

import pytest
from rest_framework.test import APIClient

pytestmark = pytest.mark.django_db

FAVORITES = "/api/v1/favorites"


def test_favorite_add_is_idempotent(auth_api: APIClient, make_app: Any) -> None:
    app = make_app()
    assert auth_api.post(f"{FAVORITES}/{app.pk}").status_code == 204
    assert auth_api.post(f"{FAVORITES}/{app.pk}").status_code == 204
    assert auth_api.get(FAVORITES).data["meta"]["total"] == 1
    assert auth_api.get(f"{FAVORITES}/ids").data == [app.pk]


def test_favorite_remove(auth_api: APIClient, make_app: Any) -> None:
    app = make_app()
    auth_api.post(f"{FAVORITES}/{app.pk}")
    assert auth_api.delete(f"{FAVORITES}/{app.pk}").status_code == 204
    assert auth_api.get(f"{FAVORITES}/ids").data == []


def test_favorite_unknown_app(auth_api: APIClient) -> None:
    assert auth_api.post(f"{FAVORITES}/999999").status_code == 400


def test_favorites_require_authentication(api: APIClient) -> None:
    assert api.get(FAVORITES).status_code == 401


def test_unverified_user_is_blocked(api: APIClient, config: Any) -> None:
    from fosslove.accounts.models import User

    User.objects.create_user(email="unv@test.io", password="Unverified123", is_verified=False)
    login = api.post(
        "/api/v1/auth/login", {"email": "unv@test.io", "password": "Unverified123"}, format="json"
    )
    api.credentials(HTTP_AUTHORIZATION=f"Bearer {login.data['access']}")
    response = api.get(FAVORITES)
    assert response.status_code == 403
    assert response.data["error"]["code"] == "email_unverified"
