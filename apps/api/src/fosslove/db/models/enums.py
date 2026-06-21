from __future__ import annotations

from enum import Enum as PyEnum
from enum import StrEnum

from sqlalchemy import Enum as SAEnum


class Platform(StrEnum):
    WINDOWS = "windows"
    LINUX = "linux"


class PackageManager(StrEnum):
    WINGET = "winget"
    MSSTORE = "msstore"
    APT = "apt"
    DNF = "dnf"
    PACMAN = "pacman"
    FLATPAK = "flatpak"
    SNAP = "snap"
    DIRECT = "direct"


WINDOWS_MANAGERS: tuple[PackageManager, ...] = (
    PackageManager.WINGET,
    PackageManager.MSSTORE,
    PackageManager.DIRECT,
)

LINUX_MANAGERS: tuple[PackageManager, ...] = (
    PackageManager.FLATPAK,
    PackageManager.APT,
    PackageManager.DNF,
    PackageManager.PACMAN,
    PackageManager.SNAP,
    PackageManager.DIRECT,
)

MANAGERS_BY_PLATFORM: dict[Platform, tuple[PackageManager, ...]] = {
    Platform.WINDOWS: WINDOWS_MANAGERS,
    Platform.LINUX: LINUX_MANAGERS,
}


class UserRole(StrEnum):
    USER = "user"
    ADMIN = "admin"


class TokenPurpose(StrEnum):
    EMAIL_VERIFY = "email_verify"
    PASSWORD_RESET = "password_reset"
    EMAIL_CHANGE = "email_change"


def enum_column[E: PyEnum](enum_cls: type[E]) -> SAEnum:
    return SAEnum(
        enum_cls,
        native_enum=False,
        validate_strings=True,
        values_callable=lambda enum: [str(member.value) for member in enum],
    )
