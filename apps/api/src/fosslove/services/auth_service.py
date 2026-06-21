from __future__ import annotations

import uuid
from datetime import UTC, datetime, timedelta
from typing import Any, cast

from sqlalchemy import CursorResult, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from fosslove.core.config import get_settings
from fosslove.core.exceptions import (
    AuthenticationError,
    BadRequestError,
    ConflictError,
    NotFoundError,
    PermissionDeniedError,
)
from fosslove.core.runtime_settings import RuntimeSettings
from fosslove.core.security import (
    DUMMY_PASSWORD_HASH,
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


def _normalize(email: str) -> str:
    return email.strip().lower()


async def get_user_by_email(session: AsyncSession, email: str) -> User | None:
    result: User | None = await session.scalar(select(User).where(User.email == _normalize(email)))
    return result


async def _create_verification_token(
    session: AsyncSession, user: User, purpose: TokenPurpose, *, new_email: str | None = None
) -> str:
    raw, token_hash = generate_opaque_token()
    ttl = get_settings().EMAIL_TOKEN_TTL_SECONDS
    session.add(
        VerificationToken(
            user_id=user.id,
            token_hash=token_hash,
            purpose=purpose,
            new_email=new_email,
            expires_at=_now() + timedelta(seconds=ttl),
        )
    )
    return raw


async def _consume_token(
    session: AsyncSession, raw_token: str, purpose: TokenPurpose
) -> tuple[uuid.UUID, str | None]:
    token_hash = hash_opaque_token(raw_token)
    row = (
        await session.execute(
            update(VerificationToken)
            .where(
                VerificationToken.token_hash == token_hash,
                VerificationToken.purpose == purpose,
                VerificationToken.used_at.is_(None),
                VerificationToken.expires_at >= _now(),
            )
            .values(used_at=_now())
            .returning(VerificationToken.user_id, VerificationToken.new_email)
        )
    ).first()
    if row is None:
        raise BadRequestError("This link is invalid or has expired.", code="invalid_token")
    return row.user_id, row.new_email


async def _revoke_all_refresh_tokens(session: AsyncSession, user_id: uuid.UUID) -> None:
    await session.execute(
        update(RefreshToken)
        .where(RefreshToken.user_id == user_id, RefreshToken.revoked_at.is_(None))
        .values(revoked_at=_now())
    )


async def register(
    session: AsyncSession, data: RegisterRequest, *, runtime: RuntimeSettings
) -> tuple[User, str | None]:
    await runtime.ensure_fresh()
    if not runtime.registration_enabled:
        raise PermissionDeniedError(
            "New account registration is currently disabled.", code="registration_disabled"
        )
    if await get_user_by_email(session, data.email) is not None:
        raise ConflictError("An account with this email already exists.", code="email_taken")
    email_enabled = runtime.email_enabled
    user = User(
        email=data.email,
        hashed_password=hash_password(data.password),
        full_name=data.full_name,
        role=UserRole.USER,
        is_verified=not email_enabled,
    )
    session.add(user)
    await session.flush()
    raw_token = (
        await _create_verification_token(session, user, TokenPurpose.EMAIL_VERIFY)
        if email_enabled
        else None
    )
    await session.commit()
    return user, raw_token


async def authenticate(session: AsyncSession, email: str, password: str) -> User:
    user = await get_user_by_email(session, email)
    if user is None:
        verify_password(password, DUMMY_PASSWORD_HASH)
        raise AuthenticationError("Invalid email or password.", code="invalid_credentials")
    if not verify_password(password, user.hashed_password):
        raise AuthenticationError("Invalid email or password.", code="invalid_credentials")
    if not user.is_active:
        raise AuthenticationError("This account is disabled.", code="account_disabled")
    if password_needs_rehash(user.hashed_password):
        user.hashed_password = hash_password(password)
    return user


async def issue_tokens(
    session: AsyncSession,
    user: User,
    *,
    user_agent: str | None = None,
    client_ip: str | None = None,
) -> TokenPair:
    settings = get_settings()
    access = create_access_token(str(user.id), role=user.role.value)
    refresh_token = create_refresh_token(str(user.id))
    session.add(
        RefreshToken(
            user_id=user.id,
            jti=refresh_token.jti,
            expires_at=refresh_token.expires_at,
            user_agent=(user_agent or None) and user_agent[:400],
            client_ip=client_ip,
            last_used_at=_now(),
        )
    )
    await session.commit()
    return TokenPair(
        access_token=access.token,
        refresh_token=refresh_token.token,
        expires_in=settings.ACCESS_TOKEN_TTL_SECONDS,
    )


async def login(
    session: AsyncSession,
    data: LoginRequest,
    *,
    user_agent: str | None = None,
    client_ip: str | None = None,
) -> TokenPair:
    user = await authenticate(session, data.email, data.password)
    return await issue_tokens(session, user, user_agent=user_agent, client_ip=client_ip)


async def refresh(
    session: AsyncSession,
    refresh_token: str,
    *,
    user_agent: str | None = None,
    client_ip: str | None = None,
) -> TokenPair:
    payload = decode_token(refresh_token, expected_type=TokenType.REFRESH)
    jti = payload["jti"]
    claimed = (
        await session.execute(
            update(RefreshToken)
            .where(RefreshToken.jti == jti, RefreshToken.revoked_at.is_(None))
            .values(revoked_at=_now())
            .returning(RefreshToken.user_id, RefreshToken.expires_at)
        )
    ).first()

    if claimed is None:
        stored = await session.scalar(select(RefreshToken).where(RefreshToken.jti == jti))
        if stored is None:
            raise AuthenticationError("Refresh token is invalid.", code="invalid_token")
        await _revoke_all_refresh_tokens(session, stored.user_id)
        await session.commit()
        raise AuthenticationError("Refresh token reuse detected.", code="token_reuse")

    user_id, expires_at = claimed
    if expires_at < _now():
        await session.commit()
        raise AuthenticationError("Refresh token has expired.", code="token_expired")

    user = await session.get(User, user_id)
    if user is None or not user.is_active:
        await session.commit()
        raise AuthenticationError("Account is no longer active.", code="account_disabled")

    return await issue_tokens(session, user, user_agent=user_agent, client_ip=client_ip)


async def logout(session: AsyncSession, refresh_token: str) -> None:
    try:
        payload = decode_token(refresh_token, expected_type=TokenType.REFRESH)
    except AuthenticationError:
        return
    await session.execute(
        update(RefreshToken)
        .where(RefreshToken.jti == payload["jti"], RefreshToken.revoked_at.is_(None))
        .values(revoked_at=_now())
    )
    await session.commit()


async def list_sessions(session: AsyncSession, user_id: uuid.UUID) -> list[RefreshToken]:
    rows = await session.scalars(
        select(RefreshToken)
        .where(
            RefreshToken.user_id == user_id,
            RefreshToken.revoked_at.is_(None),
            RefreshToken.expires_at >= _now(),
        )
        .order_by(RefreshToken.created_at.desc())
    )
    return list(rows)


async def revoke_session(session: AsyncSession, user_id: uuid.UUID, token_id: uuid.UUID) -> None:
    result = cast(
        "CursorResult[Any]",
        await session.execute(
            update(RefreshToken)
            .where(
                RefreshToken.id == token_id,
                RefreshToken.user_id == user_id,
                RefreshToken.revoked_at.is_(None),
            )
            .values(revoked_at=_now())
        ),
    )
    if result.rowcount == 0:
        raise NotFoundError("Session not found.")
    await session.commit()


async def verify_email(session: AsyncSession, raw_token: str) -> None:
    user_id, _ = await _consume_token(session, raw_token, TokenPurpose.EMAIL_VERIFY)
    user = await session.get(User, user_id)
    if user is not None:
        user.is_verified = True
    await session.commit()


async def resend_verification(
    session: AsyncSession, email: str, *, runtime: RuntimeSettings
) -> str | None:
    await runtime.ensure_fresh()
    if not runtime.email_enabled:
        return None
    user = await get_user_by_email(session, email)
    if user is None or user.is_verified:
        return None
    raw_token = await _create_verification_token(session, user, TokenPurpose.EMAIL_VERIFY)
    await session.commit()
    return raw_token


async def request_password_reset(
    session: AsyncSession, email: str, *, runtime: RuntimeSettings
) -> str | None:
    await runtime.ensure_fresh()
    if not runtime.email_enabled:
        return None
    user = await get_user_by_email(session, email)
    if user is None or not user.is_active:
        return None
    raw_token = await _create_verification_token(session, user, TokenPurpose.PASSWORD_RESET)
    await session.commit()
    return raw_token


async def reset_password(session: AsyncSession, raw_token: str, new_password: str) -> None:
    user_id, _ = await _consume_token(session, raw_token, TokenPurpose.PASSWORD_RESET)
    user = await session.get(User, user_id)
    if user is None:
        raise BadRequestError("This link is invalid or has expired.", code="invalid_token")
    user.hashed_password = hash_password(new_password)
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


async def request_email_change(
    session: AsyncSession, user: User, new_email: str, *, runtime: RuntimeSettings
) -> str | None:
    await runtime.ensure_fresh()
    normalized = _normalize(new_email)
    if normalized == user.email.lower():
        raise BadRequestError("This is already your email address.", code="email_unchanged")
    if await get_user_by_email(session, normalized) is not None:
        raise ConflictError("An account with this email already exists.", code="email_taken")
    if not runtime.email_enabled:
        user.email = normalized
        user.is_verified = True
        await session.commit()
        return None
    raw_token = await _create_verification_token(
        session, user, TokenPurpose.EMAIL_CHANGE, new_email=normalized
    )
    await session.commit()
    return raw_token


async def confirm_email_change(session: AsyncSession, raw_token: str) -> None:
    user_id, new_email = await _consume_token(session, raw_token, TokenPurpose.EMAIL_CHANGE)
    if new_email is None:
        raise BadRequestError("This link is invalid or has expired.", code="invalid_token")
    user = await session.get(User, user_id)
    if user is None:
        raise BadRequestError("This link is invalid or has expired.", code="invalid_token")
    if await get_user_by_email(session, new_email) is not None:
        raise ConflictError("An account with this email already exists.", code="email_taken")
    user.email = new_email
    user.is_verified = True
    await _revoke_all_refresh_tokens(session, user.id)
    await session.commit()


async def ensure_admin(session: AsyncSession, email: str, password: str) -> None:
    if await get_user_by_email(session, email) is not None:
        return
    session.add(
        User(
            email=_normalize(email),
            hashed_password=hash_password(password),
            role=UserRole.ADMIN,
            is_active=True,
            is_verified=True,
        )
    )
    await session.commit()
