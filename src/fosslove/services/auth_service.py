from __future__ import annotations

import uuid
from datetime import UTC, datetime, timedelta

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from fosslove.core.config import get_settings
from fosslove.core.exceptions import AuthenticationError, BadRequestError, ConflictError
from fosslove.core.security import (
    TokenType,
    create_access_token,
    create_refresh_token,
    decode_token,
    generate_opaque_token,
    hash_opaque_token,
    hash_password,
    password_needs_rehash,
    verify_password,
)
from fosslove.db.models.enums import TokenPurpose, UserRole
from fosslove.db.models.user import RefreshToken, User, VerificationToken
from fosslove.schemas.auth import LoginRequest, RegisterRequest, TokenPair


def _now() -> datetime:
    return datetime.now(UTC)


async def get_user_by_email(session: AsyncSession, email: str) -> User | None:
    return await session.scalar(select(User).where(User.email == email.strip().lower()))


async def _create_verification_token(
    session: AsyncSession, user: User, purpose: TokenPurpose
) -> str:
    raw, token_hash = generate_opaque_token()
    ttl = get_settings().EMAIL_TOKEN_TTL_SECONDS
    session.add(
        VerificationToken(
            user_id=user.id,
            token_hash=token_hash,
            purpose=purpose,
            expires_at=_now() + timedelta(seconds=ttl),
        )
    )
    return raw


async def _consume_token(
    session: AsyncSession, raw_token: str, purpose: TokenPurpose
) -> VerificationToken:
    token_hash = hash_opaque_token(raw_token)
    token = await session.scalar(
        select(VerificationToken).where(
            VerificationToken.token_hash == token_hash,
            VerificationToken.purpose == purpose,
        )
    )
    if token is None or token.used_at is not None or token.expires_at < _now():
        raise BadRequestError("This link is invalid or has expired.", code="invalid_token")
    return token


async def _revoke_all_refresh_tokens(session: AsyncSession, user_id: uuid.UUID) -> None:
    await session.execute(
        update(RefreshToken)
        .where(RefreshToken.user_id == user_id, RefreshToken.revoked_at.is_(None))
        .values(revoked_at=_now())
    )


async def register(session: AsyncSession, data: RegisterRequest) -> tuple[User, str]:
    if await get_user_by_email(session, data.email) is not None:
        raise ConflictError("An account with this email already exists.", code="email_taken")
    user = User(
        email=data.email,
        hashed_password=hash_password(data.password),
        full_name=data.full_name,
        role=UserRole.USER,
    )
    session.add(user)
    await session.flush()
    raw_token = await _create_verification_token(session, user, TokenPurpose.EMAIL_VERIFY)
    await session.commit()
    return user, raw_token


async def authenticate(session: AsyncSession, email: str, password: str) -> User:
    user = await get_user_by_email(session, email)
    if user is None or not verify_password(password, user.hashed_password):
        raise AuthenticationError("Invalid email or password.", code="invalid_credentials")
    if not user.is_active:
        raise AuthenticationError("This account is disabled.", code="account_disabled")
    if password_needs_rehash(user.hashed_password):
        user.hashed_password = hash_password(password)
    return user


async def issue_tokens(session: AsyncSession, user: User) -> TokenPair:
    settings = get_settings()
    access = create_access_token(str(user.id), role=user.role.value)
    refresh = create_refresh_token(str(user.id))
    session.add(RefreshToken(user_id=user.id, jti=refresh.jti, expires_at=refresh.expires_at))
    await session.commit()
    return TokenPair(
        access_token=access.token,
        refresh_token=refresh.token,
        expires_in=settings.ACCESS_TOKEN_TTL_SECONDS,
    )


async def login(session: AsyncSession, data: LoginRequest) -> TokenPair:
    user = await authenticate(session, data.email, data.password)
    return await issue_tokens(session, user)


async def refresh(session: AsyncSession, refresh_token: str) -> TokenPair:
    payload = decode_token(refresh_token, expected_type=TokenType.REFRESH)
    stored = await session.scalar(select(RefreshToken).where(RefreshToken.jti == payload["jti"]))
    if stored is None:
        raise AuthenticationError("Refresh token is invalid.", code="invalid_token")
    if stored.revoked_at is not None:
        await _revoke_all_refresh_tokens(session, stored.user_id)
        await session.commit()
        raise AuthenticationError("Refresh token reuse detected.", code="token_reuse")
    if stored.expires_at < _now():
        raise AuthenticationError("Refresh token has expired.", code="token_expired")

    user = await session.get(User, stored.user_id)
    if user is None or not user.is_active:
        raise AuthenticationError("Account is no longer active.", code="account_disabled")

    stored.revoked_at = _now()
    return await issue_tokens(session, user)


async def logout(session: AsyncSession, refresh_token: str) -> None:
    try:
        payload = decode_token(refresh_token, expected_type=TokenType.REFRESH)
    except AuthenticationError:
        return
    stored = await session.scalar(select(RefreshToken).where(RefreshToken.jti == payload["jti"]))
    if stored is not None and stored.revoked_at is None:
        stored.revoked_at = _now()
        await session.commit()


async def verify_email(session: AsyncSession, raw_token: str) -> None:
    token = await _consume_token(session, raw_token, TokenPurpose.EMAIL_VERIFY)
    user = await session.get(User, token.user_id)
    if user is not None:
        user.is_verified = True
    token.used_at = _now()
    await session.commit()


async def resend_verification(session: AsyncSession, email: str) -> str | None:
    user = await get_user_by_email(session, email)
    if user is None or user.is_verified:
        return None
    raw_token = await _create_verification_token(session, user, TokenPurpose.EMAIL_VERIFY)
    await session.commit()
    return raw_token


async def request_password_reset(session: AsyncSession, email: str) -> str | None:
    user = await get_user_by_email(session, email)
    if user is None or not user.is_active:
        return None
    raw_token = await _create_verification_token(session, user, TokenPurpose.PASSWORD_RESET)
    await session.commit()
    return raw_token


async def reset_password(session: AsyncSession, raw_token: str, new_password: str) -> None:
    token = await _consume_token(session, raw_token, TokenPurpose.PASSWORD_RESET)
    user = await session.get(User, token.user_id)
    if user is None:
        raise BadRequestError("This link is invalid or has expired.", code="invalid_token")
    user.hashed_password = hash_password(new_password)
    token.used_at = _now()
    await _revoke_all_refresh_tokens(session, user.id)
    await session.commit()


async def change_password(
    session: AsyncSession, user: User, current_password: str, new_password: str
) -> None:
    if not verify_password(current_password, user.hashed_password):
        raise AuthenticationError("Current password is incorrect.", code="invalid_credentials")
    user.hashed_password = hash_password(new_password)
    await _revoke_all_refresh_tokens(session, user.id)
    await session.commit()


async def ensure_admin(session: AsyncSession, email: str, password: str) -> None:
    if await get_user_by_email(session, email) is not None:
        return
    session.add(
        User(
            email=email.strip().lower(),
            hashed_password=hash_password(password),
            role=UserRole.ADMIN,
            is_active=True,
            is_verified=True,
        )
    )
    await session.commit()
