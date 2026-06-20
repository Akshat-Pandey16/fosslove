from __future__ import annotations

from email.message import EmailMessage

import aiosmtplib

from fosslove.core.config import Settings
from fosslove.core.logging import get_logger

logger = get_logger(__name__)


class EmailSender:
    def __init__(self, settings: Settings) -> None:
        self._settings = settings

    async def send(self, *, to: str, subject: str, body: str) -> None:
        if not self._settings.EMAIL_ENABLED:
            logger.info("email_disabled", to=to, subject=subject)
            return
        if self._settings.EMAIL_BACKEND == "smtp" and self._settings.SMTP_HOST:
            await self._send_smtp(to=to, subject=subject, body=body)
        elif self._settings.DEBUG:
            logger.info("email_console", to=to, subject=subject, body=body)
        else:
            logger.info("email_console", to=to, subject=subject)

    async def _send_smtp(self, *, to: str, subject: str, body: str) -> None:
        message = EmailMessage()
        message["From"] = self._settings.EMAIL_FROM
        message["To"] = to
        message["Subject"] = subject
        message.set_content(body)
        username = self._settings.SMTP_USER or None
        password = self._settings.SMTP_PASSWORD.get_secret_value() or None
        try:
            await aiosmtplib.send(
                message,
                hostname=self._settings.SMTP_HOST,
                port=self._settings.SMTP_PORT,
                username=username,
                password=password,
                start_tls=self._settings.SMTP_USE_TLS,
            )
        except (aiosmtplib.SMTPException, OSError) as exc:
            logger.error("email_send_failed", to=to, error=str(exc))

    async def send_verification(self, *, to: str, raw_token: str) -> None:
        link = f"{self._settings.FRONTEND_BASE_URL}/verify-email?token={raw_token}"
        body = (
            "Welcome to FOSSLove!\n\n"
            f"Confirm your email address by visiting:\n{link}\n\n"
            "If you did not sign up, you can ignore this message."
        )
        await self.send(to=to, subject="Verify your FOSSLove email", body=body)

    async def send_password_reset(self, *, to: str, raw_token: str) -> None:
        link = f"{self._settings.FRONTEND_BASE_URL}/reset-password?token={raw_token}"
        body = (
            "We received a request to reset your FOSSLove password.\n\n"
            f"Reset it by visiting:\n{link}\n\n"
            "If you did not request this, you can ignore this message."
        )
        await self.send(to=to, subject="Reset your FOSSLove password", body=body)
