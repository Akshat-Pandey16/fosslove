from __future__ import annotations

from django.apps import AppConfig


class CoreConfig(AppConfig):
    name = "fosslove.core"
    label = "core"
    verbose_name = "Core"

    def ready(self) -> None:
        from fosslove.core import checks  # noqa: F401
