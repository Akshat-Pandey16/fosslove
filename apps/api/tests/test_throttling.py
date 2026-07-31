from __future__ import annotations

from typing import Any

import pytest
from rest_framework.test import APIClient

pytestmark = pytest.mark.django_db


def test_auth_throttle_blocks_after_limit(api: APIClient, config: Any, settings: Any) -> None:
    settings.RATE_LIMIT_ENABLED = True
    config.rate_limit_enabled = True
    config.rate_limit_auth = "3/minute"
    config.save()

    payload = {"email": "nobody@test.io", "password": "whatever123"}
    statuses = [
        api.post("/api/v1/auth/login", payload, format="json").status_code for _ in range(4)
    ]
    assert statuses[-1] == 429


def test_throttle_disabled_by_runtime_flag(api: APIClient, config: Any, settings: Any) -> None:
    settings.RATE_LIMIT_ENABLED = True
    config.rate_limit_enabled = False
    config.rate_limit_auth = "1/minute"
    config.save()

    payload = {"email": "nobody@test.io", "password": "whatever123"}
    statuses = [
        api.post("/api/v1/auth/login", payload, format="json").status_code for _ in range(3)
    ]
    assert 429 not in statuses


def test_throttled_response_sets_retry_after(api: APIClient, config: Any, settings: Any) -> None:
    settings.RATE_LIMIT_ENABLED = True
    config.rate_limit_enabled = True
    config.rate_limit_auth = "1/minute"
    config.save()

    payload = {"email": "nobody@test.io", "password": "whatever123"}
    api.post("/api/v1/auth/login", payload, format="json")
    blocked = api.post("/api/v1/auth/login", payload, format="json")
    assert blocked.status_code == 429
    assert blocked["Retry-After"]
    assert blocked.data["error"]["code"] == "throttled"
