from __future__ import annotations

from django.apps import AppConfig


class SiteConfigConfig(AppConfig):
    name = "fosslove.siteconfig"
    label = "siteconfig"
    verbose_name = "Site configuration"
