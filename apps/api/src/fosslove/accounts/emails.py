from __future__ import annotations

from django.conf import settings
from django.core.mail import send_mail

from fosslove.accounts.models import User
from fosslove.accounts.tokens import (
    email_verification_token,
    encode_uid,
    make_email_change_token,
    password_reset_token,
)
from fosslove.core.logging import get_logger
from fosslove.siteconfig.models import SiteConfiguration

logger = get_logger(__name__)


def _link(path: str, uid: str, token: str) -> str:
    config = SiteConfiguration.get_solo()
    base = config.effective_frontend_base_url.rstrip("/")
    return f"{base}/{path}?uid={uid}&token={token}"


def _deliver(*, to: str, subject: str, body: str) -> None:
    config = SiteConfiguration.get_solo()
    if not config.effective_email_enabled:
        logger.info("email_disabled", to=to, subject=subject)
        return
    send_mail(
        subject=subject,
        message=body,
        from_email=config.effective_email_from,
        recipient_list=[to],
        fail_silently=not settings.DEBUG,
    )


def send_verification_email(user: User) -> None:
    link = _link("verify-email", encode_uid(user), email_verification_token.make_token(user))
    _deliver(
        to=user.email,
        subject=f"Verify your {SiteConfiguration.get_solo().effective_project_name} email",
        body=(
            "Welcome to FOSSLove!\n\n"
            f"Confirm your email address by visiting:\n{link}\n\n"
            "If you did not sign up, you can ignore this message."
        ),
    )


def send_password_reset_email(user: User) -> None:
    link = _link("reset-password", encode_uid(user), password_reset_token.make_token(user))
    _deliver(
        to=user.email,
        subject=f"Reset your {SiteConfiguration.get_solo().effective_project_name} password",
        body=(
            "We received a request to reset your password.\n\n"
            f"Reset it by visiting:\n{link}\n\n"
            "If you did not request this, you can ignore this message."
        ),
    )


def send_email_change_email(user: User, new_email: str) -> None:
    config = SiteConfiguration.get_solo()
    base = config.effective_frontend_base_url.rstrip("/")
    token = make_email_change_token(user, new_email)
    link = f"{base}/confirm-email-change?token={token}"
    _deliver(
        to=new_email,
        subject=f"Confirm your new {config.effective_project_name} email",
        body=(
            "We received a request to change your email address.\n\n"
            f"Confirm the new address by visiting:\n{link}\n\n"
            "If you did not request this, you can ignore this message."
        ),
    )
