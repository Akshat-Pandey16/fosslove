from __future__ import annotations

import asyncio
from pathlib import Path

from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from fosslove.core.config import get_settings
from fosslove.core.exceptions import ConflictError
from fosslove.core.logging import configure_logging, get_logger
from fosslove.db.models.catalog import Category
from fosslove.db.models.enums import PackageManager, Platform
from fosslove.db.session import dispose_engine, get_sessionmaker
from fosslove.schemas.catalog import AppCreate, CategoryCreate, PackageReferenceCreate
from fosslove.services import catalog_service

logger = get_logger(__name__)

SEED_DIR = Path(__file__).parent / "seed_data"


class SeedPackageRef(BaseModel):
    manager: PackageManager
    identifier: str = Field(min_length=1)


class SeedApp(BaseModel):
    name: str = Field(min_length=1)
    summary: str | None = None
    homepage: str | None = None
    windows: list[SeedPackageRef] = Field(default_factory=list)
    linux: list[SeedPackageRef] = Field(default_factory=list)


class SeedCategory(BaseModel):
    category: str = Field(min_length=1)
    description: str | None = None
    apps: list[SeedApp] = Field(default_factory=list)


def load_fixtures() -> list[SeedCategory]:
    return [
        SeedCategory.model_validate_json(path.read_text("utf-8"))
        for path in sorted(SEED_DIR.glob("*.json"))
    ]


async def _get_or_create_category(session: AsyncSession, name: str, description: str | None) -> int:
    existing = await session.scalar(select(Category.id).where(Category.name == name))
    if existing is not None:
        return int(existing)
    category = await catalog_service.create_category(
        session, CategoryCreate(name=name, description=description)
    )
    return category.id


async def _seed_app(session: AsyncSession, category_id: int, app: SeedApp) -> int:
    created = 0
    for platform, refs in ((Platform.WINDOWS, app.windows), (Platform.LINUX, app.linux)):
        if not refs:
            continue
        package_refs = [
            PackageReferenceCreate(manager=ref.manager, identifier=ref.identifier, priority=index)
            for index, ref in enumerate(refs)
        ]
        try:
            await catalog_service.create_app(
                session,
                AppCreate(
                    category_id=category_id,
                    platform=platform,
                    name=app.name,
                    summary=app.summary,
                    homepage_url=app.homepage,
                    package_refs=package_refs,
                ),
            )
            created += 1
        except ConflictError:
            continue
    return created


async def _seed() -> None:
    configure_logging(get_settings())
    fixtures = load_fixtures()
    factory = get_sessionmaker()
    created = 0
    async with factory() as session:
        for fixture in fixtures:
            category_id = await _get_or_create_category(
                session, fixture.category, fixture.description
            )
            for app in fixture.apps:
                created += await _seed_app(session, category_id, app)
    await dispose_engine()
    logger.info(
        "seed_complete", categories=len(fixtures), apps_created=created, source=str(SEED_DIR)
    )


def main() -> None:
    asyncio.run(_seed())


if __name__ == "__main__":
    main()
