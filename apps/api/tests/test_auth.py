from __future__ import annotations

from typing import Any

import pytest
from rest_framework.test import APIClient
from rest_framework_simplejwt.token_blacklist.models import OutstandingToken

from fosslove.accounts.models import User

pytestmark = pytest.mark.django_db

REGISTER = "/api/v1/auth/register"
LOGIN = "/api/v1/auth/login"
REFRESH = "/api/v1/auth/refresh"


def register(api: APIClient, **overrides: Any) -> Any:
    payload = {"email": "new@test.io", "password": "Fossl0veTest99", "full_name": "New"}
    payload.update(overrides)
    return api.post(REGISTER, payload, format="json")


def test_register_auto_verifies_when_email_disabled(api: APIClient) -> None:
    response = register(api)
    assert response.status_code == 201, response.data
    assert response.data["email"] == "new@test.io"
    assert response.data["is_verified"] is True
    assert response.data["role"] == "user"


def test_register_rejects_duplicate_email_case_insensitively(api: APIClient) -> None:
    register(api)
    response = register(api, email="NEW@TEST.IO")
    assert response.status_code == 422
    assert response.data["error"]["code"] == "validation_error"


def test_register_rejects_weak_password(api: APIClient) -> None:
    response = register(api, password="onlyletters")
    assert response.status_code == 422


def test_registration_can_be_disabled(api: APIClient, config: Any) -> None:
    config.registration_enabled = False
    config.save()
    response = register(api)
    assert response.status_code == 403
    assert response.data["error"]["code"] == "registration_disabled"


def test_login_returns_token_pair(api: APIClient, user: User) -> None:
    response = api.post(LOGIN, {"email": "user@test.io", "password": "User12345"}, format="json")
    assert response.status_code == 200
    assert "access" in response.data
    assert "refresh" in response.data


def test_login_is_case_insensitive_on_email(api: APIClient, user: User) -> None:
    response = api.post(LOGIN, {"email": "USER@TEST.IO", "password": "User12345"}, format="json")
    assert response.status_code == 200


def test_login_with_bad_password_fails(api: APIClient, user: User) -> None:
    response = api.post(LOGIN, {"email": "user@test.io", "password": "Wrong12345"}, format="json")
    assert response.status_code == 422


def test_refresh_rotates_and_detects_reuse(api: APIClient, user: User) -> None:
    login = api.post(LOGIN, {"email": "user@test.io", "password": "User12345"}, format="json")
    first = login.data["refresh"]

    rotated = api.post(REFRESH, {"refresh": first}, format="json")
    assert rotated.status_code == 200
    second = rotated.data["refresh"]
    assert second != first

    reused = api.post(REFRESH, {"refresh": first}, format="json")
    assert reused.status_code == 401

    assert api.post(REFRESH, {"refresh": second}, format="json").status_code == 200


def test_me_requires_authentication(api: APIClient) -> None:
    assert api.get("/api/v1/user/").status_code == 401


def test_me_returns_profile(auth_api: APIClient) -> None:
    response = auth_api.get("/api/v1/user/")
    assert response.status_code == 200
    assert response.data["email"] == "user@test.io"


def test_patch_profile(auth_api: APIClient) -> None:
    response = auth_api.patch("/api/v1/user/", {"full_name": "  Renamed  "}, format="json")
    assert response.status_code == 200
    assert response.data["full_name"] == "Renamed"


def test_put_is_not_allowed(auth_api: APIClient) -> None:
    assert auth_api.put("/api/v1/user/", {"full_name": "X"}, format="json").status_code == 405


def test_change_password_revokes_sessions(auth_api: APIClient, user: User) -> None:
    response = auth_api.post(
        "/api/v1/user/change-password",
        {"current_password": "User12345", "new_password": "Brandnew123"},
        format="json",
    )
    assert response.status_code == 200
    assert OutstandingToken.objects.filter(user=user, blacklistedtoken__isnull=False).exists()


def test_sessions_listed_and_revocable(auth_api: APIClient, user: User) -> None:
    listing = auth_api.get("/api/v1/user/sessions")
    assert listing.status_code == 200
    assert len(listing.data) == 1
    assert listing.data[0]["client_ip"]

    session_id = listing.data[0]["id"]
    assert auth_api.delete(f"/api/v1/user/sessions/{session_id}").status_code == 204
    assert auth_api.get("/api/v1/user/sessions").data == []


def test_email_change_is_immediate_when_email_disabled(auth_api: APIClient, user: User) -> None:
    response = auth_api.post("/api/v1/user/email", {"new_email": "moved@test.io"}, format="json")
    assert response.status_code == 200
    user.refresh_from_db()
    assert user.email == "moved@test.io"


def test_verify_email_flow(api: APIClient, config: Any) -> None:
    from fosslove.accounts.tokens import email_verification_token, encode_uid

    config.email_enabled = True
    config.save()
    register(api)
    created = User.objects.get(email="new@test.io")
    assert created.is_verified is False

    payload = {"uid": encode_uid(created), "token": email_verification_token.make_token(created)}
    assert api.post("/api/v1/auth/verify-email", payload, format="json").status_code == 200
    created.refresh_from_db()
    assert created.is_verified is True

    assert api.post("/api/v1/auth/verify-email", payload, format="json").status_code == 400


def test_password_reset_flow(api: APIClient, user: User, config: Any) -> None:
    from fosslove.accounts.tokens import encode_uid, password_reset_token

    config.email_enabled = True
    config.save()
    payload = {
        "uid": encode_uid(user),
        "token": password_reset_token.make_token(user),
        "new_password": "Resetpass123",
    }
    assert (
        api.post("/api/v1/auth/password-reset/confirm", payload, format="json").status_code == 200
    )
    relogin = api.post(LOGIN, {"email": "user@test.io", "password": "Resetpass123"}, format="json")
    assert relogin.status_code == 200
    assert (
        api.post("/api/v1/auth/password-reset/confirm", payload, format="json").status_code == 400
    )


def test_logout_blacklists_refresh(api: APIClient, user: User) -> None:
    login = api.post(LOGIN, {"email": "user@test.io", "password": "User12345"}, format="json")
    refresh = login.data["refresh"]
    assert api.post("/api/v1/auth/logout", {"refresh": refresh}, format="json").status_code == 200
    assert api.post(REFRESH, {"refresh": refresh}, format="json").status_code == 401


def test_account_deletion(auth_api: APIClient, user: User) -> None:
    assert auth_api.delete("/api/v1/user/").status_code == 204
    assert not User.objects.filter(pk=user.pk).exists()


def test_data_export(auth_api: APIClient) -> None:
    response = auth_api.get("/api/v1/user/export")
    assert response.status_code == 200
    assert set(response.data) >= {"user", "collections", "favorites", "script_runs"}
