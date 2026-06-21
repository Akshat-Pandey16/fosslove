from __future__ import annotations

from email.message import EmailMessage

import aiosmtplib

from fosslove.core.logging import get_logger
from fosslove.core.runtime_settings import RuntimeSettings

logger = get_logger(__name__)


class EmailSender:
    def __init__(self, runtime: RuntimeSettings) -> None:
        self._runtime = runtime

    async def send(self, *, to: str, subject: str, body: str) -> None:
        await self._runtime.ensure_fresh()
        if not self._runtime.email_enabled:
            logger.info("email_disabled", to=to, subject=subject)
            return
        if self._runtime.email_backend == "smtp" and self._runtime.smtp_host:
            await self._send_smtp(to=to, subject=subject, body=body)
        elif self._runtime.debug:
            logger.info("email_console", to=to, subject=subject, body=body)
        else:
            logger.info("email_console", to=to, subject=subject)

    async def _send_smtp(self, *, to: str, subject: str, body: str) -> None:
        message = EmailMessage()
        message["From"] = self._runtime.email_from
        message["To"] = to
        message["Subject"] = subject
        message.set_content(body)
        try:
            await aiosmtplib.send(
                message,
                hostname=self._runtime.smtp_host,
                port=self._runtime.smtp_port,
                username=self._runtime.smtp_user or None,
                password=self._runtime.smtp_password or None,
                start_tls=self._runtime.smtp_use_tls,
            )
        except (aiosmtplib.SMTPException, OSError) as exc:
            logger.error("email_send_failed", to=to, error=str(exc))

    async def send_verification(self, *, to: str, raw_token: str) -> None:
        link = f"{self._runtime.frontend_base_url}/verify-email?token={raw_token}"
        body = (
            "Welcome to FOSSLove!\n\n"
            f"Confirm your email address by visiting:\n{link}\n\n"
            "If you did not sign up, you can ignore this message."
        )
        await self.send(to=to, subject="Verify your FOSSLove email", body=body)

    async def send_password_reset(self, *, to: str, raw_token: str) -> None:
        link = f"{self._runtime.frontend_base_url}/reset-password?token={raw_token}"
        body = (
            "We received a request to reset your FOSSLove password.\n\n"
            f"Reset it by visiting:\n{link}\n\n"
            "If you did not request this, you can ignore this message."
        )
        await self.send(to=to, subject="Reset your FOSSLove password", body=body)

    async def send_email_change(self, *, to: str, raw_token: str) -> None:
        link = f"{self._runtime.frontend_base_url}/confirm-email-change?token={raw_token}"
        body = (
            "We received a request to change your FOSSLove email address.\n\n"
            f"Confirm the new address by visiting:\n{link}\n\n"
            "If you did not request this, you can ignore this message."
        )
        await self.send(to=to, subject="Confirm your new FOSSLove email", body=body)
