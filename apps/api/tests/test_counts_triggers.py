from __future__ import annotations

from typing import Any

import pytest

from fosslove.catalog.models import App, Category

pytestmark = pytest.mark.django_db


def _counts(category: Category) -> tuple[int, int]:
    category.refresh_from_db()
    return category.windows_app_count, category.linux_app_count


def test_insert_increments(category: Category, make_app: Any) -> None:
    assert _counts(category) == (0, 0)
    make_app(name="Firefox", platform="windows")
    assert _counts(category) == (1, 0)
    make_app(name="VLC", platform="linux", manager="flatpak", identifier="org.videolan.VLC")
    assert _counts(category) == (1, 1)


def test_delete_decrements(category: Category, make_app: Any) -> None:
    app = make_app()
    assert _counts(category) == (1, 0)
    app.delete()
    assert _counts(category) == (0, 0)


def test_deactivate_decrements(category: Category, make_app: Any) -> None:
    app = make_app()
    app.is_active = False
    app.save()
    assert _counts(category) == (0, 0)
    app.is_active = True
    app.save()
    assert _counts(category) == (1, 0)


def test_moving_category_moves_the_count(category: Category, make_app: Any) -> None:
    other = Category.objects.create(name="Media", slug="media")
    app = make_app()
    assert _counts(category) == (1, 0)
    app.category = other
    app.save()
    assert _counts(category) == (0, 0)
    assert _counts(other) == (1, 0)


def test_bulk_update_keeps_counts_correct(category: Category, make_app: Any) -> None:
    make_app(name="Firefox", platform="windows")
    make_app(name="Chromium", platform="windows", slug="chromium")
    assert _counts(category) == (2, 0)

    App.objects.filter(category=category).update(is_active=False)
    assert _counts(category) == (0, 0)

    App.objects.filter(category=category).update(is_active=True)
    assert _counts(category) == (2, 0)


def test_bulk_delete_keeps_counts_correct(category: Category, make_app: Any) -> None:
    make_app(name="Firefox", platform="windows")
    make_app(name="Chromium", platform="windows", slug="chromium")
    assert _counts(category) == (2, 0)
    App.objects.filter(category=category).delete()
    assert _counts(category) == (0, 0)


def test_bulk_create_keeps_counts_correct(category: Category) -> None:
    App.objects.bulk_create(
        [
            App(category=category, platform="linux", name=f"App {index}", slug=f"app-{index}")
            for index in range(5)
        ]
    )
    assert _counts(category) == (0, 5)
