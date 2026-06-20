from __future__ import annotations

from httpx import AsyncClient


async def test_register_and_login(client: AsyncClient) -> None:
    register = await client.post(
        "/api/v1/auth/register",
        json={"email": "a@b.io", "password": "Passw0rd", "full_name": "A"},
    )
    assert register.status_code == 201
    body = register.json()
    assert body["email"] == "a@b.io"
    assert body["is_verified"] is True

    login = await client.post(
        "/api/v1/auth/login", json={"email": "a@b.io", "password": "Passw0rd"}
    )
    assert login.status_code == 200
    assert login.json()["token_type"] == "bearer"
    assert "access_token" in login.json()


async def test_register_duplicate_conflict(client: AsyncClient) -> None:
    payload = {"email": "d@b.io", "password": "Passw0rd"}
    await client.post("/api/v1/auth/register", json=payload)
    duplicate = await client.post("/api/v1/auth/register", json=payload)
    assert duplicate.status_code == 409
    assert duplicate.json()["error"]["code"] == "email_taken"


async def test_weak_password_rejected(client: AsyncClient) -> None:
    response = await client.post(
        "/api/v1/auth/register", json={"email": "w@b.io", "password": "onlyletters"}
    )
    assert response.status_code == 422


async def test_login_wrong_password(client: AsyncClient) -> None:
    await client.post("/api/v1/auth/register", json={"email": "x@b.io", "password": "Passw0rd"})
    response = await client.post(
        "/api/v1/auth/login", json={"email": "x@b.io", "password": "WrongPass9"}
    )
    assert response.status_code == 401
    assert response.json()["error"]["code"] == "invalid_credentials"


async def test_me_requires_authentication(client: AsyncClient) -> None:
    response = await client.get("/api/v1/users/me")
    assert response.status_code == 401


async def test_me_with_token(client: AsyncClient, auth_headers: dict[str, str]) -> None:
    response = await client.get("/api/v1/users/me", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["email"] == "user@test.io"


async def test_refresh_rotation_and_reuse_detection(client: AsyncClient) -> None:
    await client.post("/api/v1/auth/register", json={"email": "r@b.io", "password": "Passw0rd"})
    login = await client.post(
        "/api/v1/auth/login", json={"email": "r@b.io", "password": "Passw0rd"}
    )
    first = login.json()["refresh_token"]

    rotated = await client.post("/api/v1/auth/refresh", json={"refresh_token": first})
    assert rotated.status_code == 200
    second = rotated.json()["refresh_token"]
    assert second != first

    reuse = await client.post("/api/v1/auth/refresh", json={"refresh_token": first})
    assert reuse.status_code == 401
    assert reuse.json()["error"]["code"] == "token_reuse"

    after_reuse = await client.post("/api/v1/auth/refresh", json={"refresh_token": second})
    assert after_reuse.status_code == 401


async def test_change_password_then_login(
    client: AsyncClient, auth_headers: dict[str, str]
) -> None:
    change = await client.post(
        "/api/v1/users/me/change-password",
        headers=auth_headers,
        json={"current_password": "User12345", "new_password": "NewPass123"},
    )
    assert change.status_code == 200
    relogin = await client.post(
        "/api/v1/auth/login", json={"email": "user@test.io", "password": "NewPass123"}
    )
    assert relogin.status_code == 200
