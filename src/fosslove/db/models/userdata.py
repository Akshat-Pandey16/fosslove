from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import (
    TIMESTAMP,
    BigInteger,
    Boolean,
    CheckConstraint,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
    text,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from fosslove.db.base import Base
from fosslove.db.models.enums import Platform, enum_column
from fosslove.db.models.mixins import TimestampMixin

if TYPE_CHECKING:
    from fosslove.db.models.catalog import App
    from fosslove.db.models.user import User


class Collection(Base, TimestampMixin):
    __tablename__ = "collections"
    __table_args__ = (
        UniqueConstraint("user_id", "slug", name="uq_collection_user_slug"),
        Index(
            "ix_collections_public_created",
            "created_at",
            postgresql_where=text("is_public"),
        ),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    name: Mapped[str] = mapped_column(String(120))
    slug: Mapped[str] = mapped_column(String(140))
    description: Mapped[str | None] = mapped_column(Text)
    is_public: Mapped[bool] = mapped_column(Boolean, default=False, server_default=text("false"))

    user: Mapped[User] = relationship(back_populates="collections")
    items: Mapped[list[CollectionApp]] = relationship(
        back_populates="collection",
        cascade="all, delete-orphan",
        order_by="CollectionApp.position",
    )


class CollectionApp(Base):
    __tablename__ = "collection_apps"
    __table_args__ = (
        Index("ix_collection_apps_app", "app_id"),
        CheckConstraint("position >= 0", name="position_nonneg"),
    )

    collection_id: Mapped[int] = mapped_column(
        ForeignKey("collections.id", ondelete="CASCADE"), primary_key=True
    )
    app_id: Mapped[int] = mapped_column(ForeignKey("apps.id", ondelete="CASCADE"), primary_key=True)
    position: Mapped[int] = mapped_column(Integer, default=0, server_default=text("0"))
    added_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now())

    collection: Mapped[Collection] = relationship(back_populates="items")
    app: Mapped[App] = relationship(back_populates="collection_links", lazy="selectin")


class Favorite(Base):
    __tablename__ = "favorites"
    __table_args__ = (Index("ix_favorites_app", "app_id"),)

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    app_id: Mapped[int] = mapped_column(ForeignKey("apps.id", ondelete="CASCADE"), primary_key=True)
    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )

    user: Mapped[User] = relationship(back_populates="favorites")
    app: Mapped[App] = relationship(back_populates="favorited_by", lazy="selectin")


class ScriptRun(Base):
    __tablename__ = "script_runs"
    __table_args__ = (
        Index("ix_script_runs_user_created", "user_id", "created_at"),
        CheckConstraint("app_count >= 0", name="app_count_nonneg"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    user_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"))
    platform: Mapped[Platform] = mapped_column(enum_column(Platform))
    app_ids: Mapped[list[int]] = mapped_column(JSONB)
    app_count: Mapped[int] = mapped_column(Integer)
    client_ip: Mapped[str | None] = mapped_column(String(64))
    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )

    user: Mapped[User | None] = relationship(back_populates="script_runs")
