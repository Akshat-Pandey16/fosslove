from __future__ import annotations

from sqlalchemy import Boolean, CheckConstraint, Integer, SmallInteger, String, text
from sqlalchemy.orm import Mapped, mapped_column

from fosslove.db.base import Base
from fosslove.db.models.mixins import TimestampMixin


class AppSetting(Base, TimestampMixin):
    __tablename__ = "app_settings"
    __table_args__ = (
        CheckConstraint("id = 1", name="singleton"),
        CheckConstraint("email_backend IN ('console', 'smtp')", name="email_backend_valid"),
        CheckConstraint(
            "smtp_port IS NULL OR smtp_port BETWEEN 1 AND 65535", name="smtp_port_range"
        ),
    )

    id: Mapped[int] = mapped_column(
        SmallInteger, primary_key=True, autoincrement=False, server_default=text("1")
    )
    registration_enabled: Mapped[bool | None] = mapped_column(Boolean)
    email_enabled: Mapped[bool | None] = mapped_column(Boolean)
    rate_limit_enabled: Mapped[bool | None] = mapped_column(Boolean)
    rate_limit_default: Mapped[str | None] = mapped_column(String(50))
    rate_limit_auth: Mapped[str | None] = mapped_column(String(50))
    email_backend: Mapped[str | None] = mapped_column(String(10))
    email_from: Mapped[str | None] = mapped_column(String(255))
    smtp_host: Mapped[str | None] = mapped_column(String(255))
    smtp_port: Mapped[int | None] = mapped_column(Integer)
    smtp_user: Mapped[str | None] = mapped_column(String(255))
    smtp_password: Mapped[str | None] = mapped_column(String(500))
    smtp_use_tls: Mapped[bool | None] = mapped_column(Boolean)
    project_name: Mapped[str | None] = mapped_column(String(100))
    frontend_base_url: Mapped[str | None] = mapped_column(String(500))
