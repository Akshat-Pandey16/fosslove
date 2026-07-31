from __future__ import annotations

from typing import Any

import pytest
from rest_framework.test import APIClient


def test_root(api: APIClient) -> None:
    response = api.get("/")
    assert response.status_code == 200
    assert response.data["status"] == "ok"


def test_health(api: APIClient) -> None:
    assert api.get("/health").status_code == 200


@pytest.mark.django_db
def test_readiness(api: APIClient) -> None:
    response = api.get("/health/ready")
    assert response.status_code == 200
    assert response.data["status"]["database"] == "ok"


@pytest.mark.django_db
def test_openapi_schema(api: APIClient, settings: Any) -> None:
    response = api.get("/api/v1/schema")
    assert response.status_code == 200
