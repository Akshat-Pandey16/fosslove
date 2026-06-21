from __future__ import annotations

from typing import TYPE_CHECKING, Any

from sqlalchemy import (
    BigInteger,
    Boolean,
    CheckConstraint,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
    text,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from fosslove.db.base import Base
from fosslove.db.models.enums import PackageManager, Platform, enum_column
from fosslove.db.models.mixins import TimestampMixin

if TYPE_CHECKING:
    from fosslove.db.models.userdata import CollectionApp, Favorite


class Category(Base, TimestampMixin):
    __tablename__ = "categories"
    __table_args__ = (
        CheckConstraint("windows_app_count >= 0", name="windows_count_nonneg"),
        CheckConstraint("linux_app_count >= 0", name="linux_count_nonneg"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), unique=True)
    slug: Mapped[str] = mapped_column(String(120), unique=True)
    description: Mapped[str | None] = mapped_column(Text)
    icon_url: Mapped[str | None] = mapped_column(String(500))
    windows_app_count: Mapped[int] = mapped_column(Integer, default=0, server_default=text("0"))
    linux_app_count: Mapped[int] = mapped_column(Integer, default=0, server_default=text("0"))

    apps: Mapped[list[App]] = relationship(back_populates="category", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"Category(id={self.id!r}, name={self.name!r})"


class App(Base, TimestampMixin):
    __tablename__ = "apps"
    __table_args__ = (
        UniqueConstraint("category_id", "platform", "name", name="uq_app_category_platform_name"),
        UniqueConstraint("platform", "slug", name="uq_app_platform_slug"),
        Index("ix_apps_platform_name", "platform", "name"),
        Index("ix_apps_platform_category_name", "platform", "category_id", "name"),
        Index(
            "ix_apps_active_platform_category_name",
            "platform",
            "category_id",
            "name",
            postgresql_where=text("is_active"),
        ),
        Index(
            "ix_apps_name_trgm",
            "name",
            postgresql_using="gin",
            postgresql_ops={"name": "gin_trgm_ops"},
        ),
        Index(
            "ix_apps_summary_trgm",
            "summary",
            postgresql_using="gin",
            postgresql_ops={"summary": "gin_trgm_ops"},
        ),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    category_id: Mapped[int] = mapped_column(
        ForeignKey("categories.id", ondelete="CASCADE"), index=True
    )
    platform: Mapped[Platform] = mapped_column(enum_column(Platform))
    name: Mapped[str] = mapped_column(String(200))
    slug: Mapped[str] = mapped_column(String(220))
    summary: Mapped[str | None] = mapped_column(String(300))
    description: Mapped[str | None] = mapped_column(Text)
    homepage_url: Mapped[str | None] = mapped_column(String(500))
    license: Mapped[str | None] = mapped_column(String(100))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, server_default=text("true"))

    category: Mapped[Category] = relationship(back_populates="apps", lazy="selectin")
    package_refs: Mapped[list[PackageReference]] = relationship(
        back_populates="app", cascade="all, delete-orphan"
    )
    collection_links: Mapped[list[CollectionApp]] = relationship(
        back_populates="app", cascade="all, delete-orphan"
    )
    favorited_by: Mapped[list[Favorite]] = relationship(
        back_populates="app", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"App(id={self.id!r}, name={self.name!r}, platform={self.platform!r})"


class PackageReference(Base, TimestampMixin):
    __tablename__ = "package_references"
    __table_args__ = (
        UniqueConstraint("app_id", "manager", name="uq_package_app_manager"),
        CheckConstraint("priority >= 0", name="priority_nonneg"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    app_id: Mapped[int] = mapped_column(ForeignKey("apps.id", ondelete="CASCADE"), index=True)
    manager: Mapped[PackageManager] = mapped_column(enum_column(PackageManager))
    identifier: Mapped[str] = mapped_column(String(500))
    install_args: Mapped[str | None] = mapped_column(String(500))
    priority: Mapped[int] = mapped_column(Integer, default=100, server_default=text("100"))
    extra: Mapped[dict[str, Any] | None] = mapped_column(JSONB)

    app: Mapped[App] = relationship(back_populates="package_refs")

    def __repr__(self) -> str:
        return f"PackageReference(app_id={self.app_id!r}, manager={self.manager!r})"
