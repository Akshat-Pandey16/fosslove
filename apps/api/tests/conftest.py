from __future__ import annotations

from typing import Any

import pytest
from django.core.cache import cache
from rest_framework.test import APIClient

from fosslove.accounts.models import User
from fosslove.catalog.models import App, Category, PackageReference
from fosslove.siteconfig.models import SiteConfiguration


@pytest.fixture(autouse=True)
def _clear_caches(settings: Any) -> Any:
    settings.RATE_LIMIT_ENABLED = False
    cache.clear()
    yield
    cache.clear()


@pytest.fixture
def api() -> APIClient:
    return APIClient()


@pytest.fixture
def config(db: Any) -> SiteConfiguration:
    return SiteConfiguration.get_solo()


@pytest.fixture
def user(db: Any) -> User:
    return User.objects.create_user(
        email="user@test.io", password="User12345", full_name="User", is_verified=True
    )


@pytest.fixture
def admin_user(db: Any) -> User:
    return User.objects.create_superuser(email="admin@test.io", password="Admin12345")


def _authenticate(api: APIClient, email: str, password: str) -> APIClient:
    response = api.post("/api/v1/auth/login", {"email": email, "password": password}, format="json")
    assert response.status_code == 200, response.data
    api.credentials(HTTP_AUTHORIZATION=f"Bearer {response.data['access']}")
    return api


@pytest.fixture
def auth_api(api: APIClient, user: User) -> APIClient:
    return _authenticate(api, "user@test.io", "User12345")


@pytest.fixture
def admin_api(api: APIClient, admin_user: User) -> APIClient:
    return _authenticate(api, "admin@test.io", "Admin12345")


@pytest.fixture
def category(db: Any) -> Category:
    return Category.objects.create(name="Browsers", slug="browsers")


@pytest.fixture
def make_app(db: Any, category: Category) -> Any:
    def factory(
        name: str = "Firefox",
        platform: str = "windows",
        manager: str = "winget",
        identifier: str = "Mozilla.Firefox",
        **kwargs: Any,
    ) -> App:
        app = App.objects.create(
            category=kwargs.pop("category", category),
            platform=platform,
            name=name,
            slug=kwargs.pop("slug", f"{name.lower().replace(' ', '-')}"),
            **kwargs,
        )
        PackageReference.objects.create(app=app, manager=manager, identifier=identifier)
        return app

    return factory
