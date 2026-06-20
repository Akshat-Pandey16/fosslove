from __future__ import annotations

import asyncio
from dataclasses import dataclass

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

Refs = tuple[tuple[PackageManager, str], ...]


@dataclass(frozen=True, slots=True)
class SeedApp:
    category: str
    name: str
    summary: str
    homepage: str
    windows: Refs = ()
    linux: Refs = ()


CATEGORIES: dict[str, str] = {
    "Browsers": "Web browsers",
    "Editors & IDEs": "Code and text editors",
    "Media": "Audio and video players",
    "Productivity": "Office, notes and productivity",
    "Utilities": "System and developer utilities",
}

APPS: list[SeedApp] = [
    SeedApp(
        "Browsers", "Firefox", "Fast, private and open-source web browser",
        "https://www.mozilla.org/firefox/",
        windows=((PackageManager.WINGET, "Mozilla.Firefox"),),
        linux=((PackageManager.FLATPAK, "org.mozilla.firefox"), (PackageManager.APT, "firefox")),
    ),
    SeedApp(
        "Editors & IDEs", "VS Code", "Lightweight but powerful source code editor",
        "https://code.visualstudio.com/",
        windows=((PackageManager.WINGET, "Microsoft.VisualStudioCode"),),
        linux=((PackageManager.FLATPAK, "com.visualstudio.code"),),
    ),
    SeedApp(
        "Media", "VLC", "Free and open-source cross-platform media player",
        "https://www.videolan.org/vlc/",
        windows=((PackageManager.WINGET, "VideoLAN.VLC"),),
        linux=((PackageManager.FLATPAK, "org.videolan.VLC"), (PackageManager.APT, "vlc")),
    ),
    SeedApp(
        "Media", "GIMP", "GNU Image Manipulation Program",
        "https://www.gimp.org/",
        windows=((PackageManager.WINGET, "GIMP.GIMP"),),
        linux=((PackageManager.FLATPAK, "org.gimp.GIMP"), (PackageManager.APT, "gimp")),
    ),
    SeedApp(
        "Productivity", "LibreOffice", "Free and powerful office suite",
        "https://www.libreoffice.org/",
        windows=((PackageManager.WINGET, "TheDocumentFoundation.LibreOffice"),),
        linux=(
            (PackageManager.FLATPAK, "org.libreoffice.LibreOffice"),
            (PackageManager.APT, "libreoffice"),
        ),
    ),
    SeedApp(
        "Productivity", "Obsidian", "Knowledge base on local Markdown files",
        "https://obsidian.md/",
        windows=((PackageManager.WINGET, "Obsidian.Obsidian"),),
        linux=((PackageManager.FLATPAK, "md.obsidian.Obsidian"),),
    ),
    SeedApp(
        "Utilities", "7-Zip", "High-ratio file archiver",
        "https://www.7-zip.org/",
        windows=((PackageManager.WINGET, "7zip.7zip"),),
    ),
    SeedApp(
        "Utilities", "htop", "Interactive process viewer",
        "https://htop.dev/",
        linux=(
            (PackageManager.APT, "htop"),
            (PackageManager.DNF, "htop"),
            (PackageManager.PACMAN, "htop"),
        ),
    ),
]


async def _get_or_create_category(session: AsyncSession, name: str, description: str) -> int:
    existing = await session.scalar(select(Category.id).where(Category.name == name))
    if existing is not None:
        return int(existing)
    category = await catalog_service.create_category(
        session, CategoryCreate(name=name, description=description)
    )
    return category.id


async def _seed() -> None:
    configure_logging(get_settings())
    factory = get_sessionmaker()
    created = 0
    async with factory() as session:
        category_ids = {
            name: await _get_or_create_category(session, name, description)
            for name, description in CATEGORIES.items()
        }
        for entry in APPS:
            for platform, refs in (
                (Platform.WINDOWS, entry.windows),
                (Platform.LINUX, entry.linux),
            ):
                if not refs:
                    continue
                package_refs = [
                    PackageReferenceCreate(manager=manager, identifier=identifier, priority=index)
                    for index, (manager, identifier) in enumerate(refs)
                ]
                try:
                    await catalog_service.create_app(
                        session,
                        AppCreate(
                            category_id=category_ids[entry.category],
                            platform=platform,
                            name=entry.name,
                            summary=entry.summary,
                            homepage_url=entry.homepage,
                            package_refs=package_refs,
                        ),
                    )
                    created += 1
                except ConflictError:
                    continue
    await dispose_engine()
    logger.info("seed_complete", apps_created=created)


def main() -> None:
    asyncio.run(_seed())


if __name__ == "__main__":
    main()
