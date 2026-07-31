from __future__ import annotations

from django.db import models
from django.utils.translation import gettext_lazy as _


class Platform(models.TextChoices):
    WINDOWS = "windows", _("Windows")
    LINUX = "linux", _("Linux")


class PackageManager(models.TextChoices):
    WINGET = "winget", _("winget")
    MSSTORE = "msstore", _("Microsoft Store")
    APT = "apt", _("APT")
    DNF = "dnf", _("DNF")
    PACMAN = "pacman", _("pacman")
    FLATPAK = "flatpak", _("Flatpak")
    SNAP = "snap", _("Snap")
    DIRECT = "direct", _("Direct download")


WINDOWS_MANAGERS: tuple[str, ...] = (
    PackageManager.WINGET,
    PackageManager.MSSTORE,
    PackageManager.DIRECT,
)

LINUX_MANAGERS: tuple[str, ...] = (
    PackageManager.FLATPAK,
    PackageManager.APT,
    PackageManager.DNF,
    PackageManager.PACMAN,
    PackageManager.SNAP,
    PackageManager.DIRECT,
)

MANAGERS_BY_PLATFORM: dict[str, tuple[str, ...]] = {
    Platform.WINDOWS: WINDOWS_MANAGERS,
    Platform.LINUX: LINUX_MANAGERS,
}
