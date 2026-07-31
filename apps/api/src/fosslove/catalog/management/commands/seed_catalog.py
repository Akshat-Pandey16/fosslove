from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from django.core.management.base import BaseCommand, CommandParser
from django.db import transaction

from fosslove.catalog.enums import PackageManager, Platform
from fosslove.catalog.models import App, Category, PackageReference
from fosslove.catalog.services import recompute_category_counts
from fosslove.core.cache import bump_catalog_version
from fosslove.core.slugs import model_unique_slug

FIXTURE_DIR = Path(__file__).resolve().parents[2] / "fixtures"
VALID_MANAGERS = set(PackageManager.values)


class Command(BaseCommand):
    help = "Load the bundled catalog fixtures. Idempotent."

    def add_arguments(self, parser: CommandParser) -> None:
        parser.add_argument("--path", type=Path, default=FIXTURE_DIR)
        parser.add_argument("--flush", action="store_true")

    @transaction.atomic
    def handle(self, *args: Any, **options: Any) -> None:
        directory: Path = options["path"]
        if options["flush"]:
            App.objects.all().delete()
            Category.objects.all().delete()
            self.stdout.write(self.style.WARNING("Existing catalog cleared."))

        files = sorted(directory.glob("*.json"))
        if not files:
            self.stderr.write(self.style.ERROR(f"No fixtures found in {directory}"))
            return

        categories_seen = 0
        apps_created = 0
        refs_created = 0

        for path in files:
            payload = json.loads(path.read_text("utf-8"))
            category, _ = Category.objects.get_or_create(
                name=payload["category"],
                defaults={
                    "slug": model_unique_slug(Category, payload["category"]),
                    "description": payload.get("description") or "",
                },
            )
            categories_seen += 1

            for entry in payload.get("apps", []):
                for platform, key in ((Platform.WINDOWS, "windows"), (Platform.LINUX, "linux")):
                    refs = [
                        ref for ref in entry.get(key, []) if ref.get("manager") in VALID_MANAGERS
                    ]
                    if not refs:
                        continue
                    app, created = App.objects.get_or_create(
                        category=category,
                        platform=platform,
                        name=entry["name"],
                        defaults={
                            "slug": model_unique_slug(
                                App,
                                entry["name"],
                                max_length=220,
                                scope={"platform": platform},
                            ),
                            "summary": entry.get("summary") or "",
                            "homepage_url": entry.get("homepage") or "",
                        },
                    )
                    if not created:
                        continue
                    apps_created += 1
                    new_refs = PackageReference.objects.bulk_create(
                        [
                            PackageReference(
                                app=app,
                                manager=ref["manager"],
                                identifier=ref["identifier"],
                                priority=index * 10,
                            )
                            for index, ref in enumerate(refs)
                        ]
                    )
                    refs_created += len(new_refs)

        recompute_category_counts()
        bump_catalog_version()
        self.stdout.write(
            self.style.SUCCESS(
                f"Seeded {categories_seen} categories, {apps_created} apps, "
                f"{refs_created} package refs."
            )
        )
