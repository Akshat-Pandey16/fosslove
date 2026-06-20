from fosslove.db import events as _events  # noqa: F401
from fosslove.db.base import Base
from fosslove.db.models.catalog import App, Category, PackageReference
from fosslove.db.models.enums import (
    PackageManager,
    Platform,
    TokenPurpose,
    UserRole,
)
from fosslove.db.models.setting import AppSetting
from fosslove.db.models.user import RefreshToken, User, VerificationToken
from fosslove.db.models.userdata import Collection, CollectionApp, Favorite, ScriptRun

__all__ = [
    "App",
    "AppSetting",
    "Base",
    "Category",
    "Collection",
    "CollectionApp",
    "Favorite",
    "PackageManager",
    "PackageReference",
    "Platform",
    "RefreshToken",
    "ScriptRun",
    "TokenPurpose",
    "User",
    "UserRole",
    "VerificationToken",
]
