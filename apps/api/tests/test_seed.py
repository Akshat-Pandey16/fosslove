from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import pytest
from django.core.management import call_command

from fosslove.catalog.models import App, Category, PackageReference

pytestmark = pytest.mark.django_db

FIXTURE = {
    "category": "Browsers",
    "description": "Web browsers",
    "apps": [
        {
            "name": "Firefox",
            "summary": "A browser",
            "homepage": "https://mozilla.org",
            "windows": [{"manager": "winget", "identifier": "Mozilla.Firefox"}],
            "linux": [{"manager": "flatpak", "identifier": "org.mozilla.firefox"}],
        },
        {
            "name": "Chromium",
            "linux": [{"manager": "apt", "identifier": "chromium"}],
        },
    ],
}


@pytest.fixture
def fixture_dir(tmp_path: Path) -> Path:
    (tmp_path / "01-browsers.json").write_text(json.dumps(FIXTURE), "utf-8")
    return tmp_path


def test_seed_creates_catalog(fixture_dir: Path) -> None:
    call_command("seed_catalog", path=fixture_dir, verbosity=0)
    assert Category.objects.count() == 1
    assert App.objects.count() == 3
    assert PackageReference.objects.count() == 3

    category = Category.objects.get()
    assert category.slug == "browsers"
    assert category.windows_app_count == 1
    assert category.linux_app_count == 2


def test_seed_is_idempotent(fixture_dir: Path) -> None:
    call_command("seed_catalog", path=fixture_dir, verbosity=0)
    call_command("seed_catalog", path=fixture_dir, verbosity=0)
    assert App.objects.count() == 3
    assert PackageReference.objects.count() == 3


def test_seed_flush_replaces_catalog(fixture_dir: Path, make_app: Any) -> None:
    make_app(name="Stale", platform="windows", slug="stale")
    call_command("seed_catalog", path=fixture_dir, flush=True, verbosity=0)
    assert not App.objects.filter(name="Stale").exists()
    assert App.objects.count() == 3


def test_ensure_admin_command(db: Any) -> None:
    from fosslove.accounts.models import User

    call_command("ensure_admin", email="boot@test.io", password="Bootstrap123", verbosity=0)
    admin = User.objects.get(email="boot@test.io")
    assert admin.is_staff and admin.is_superuser and admin.is_verified

    call_command("ensure_admin", email="boot@test.io", password="Bootstrap123", verbosity=0)
    assert User.objects.filter(email="boot@test.io").count() == 1
