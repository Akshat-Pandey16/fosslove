from __future__ import annotations

from django.db import models
from django.utils.translation import gettext_lazy as _


class Action(models.TextChoices):
    LOGIN = "auth.login", _("Login")
    LOGIN_FAILED = "auth.login_failed", _("Login failed")
    LOGOUT = "auth.logout", _("Logout")
    REGISTER = "auth.register", _("Register")
    TOKEN_REFRESH = "auth.token_refresh", _("Token refresh")
    PASSWORD_CHANGE = "auth.password_change", _("Password change")
    PASSWORD_RESET = "auth.password_reset", _("Password reset")
    PASSWORD_RESET_REQUEST = "auth.password_reset_request", _("Password reset request")
    EMAIL_VERIFY = "auth.email_verify", _("Email verify")
    EMAIL_CHANGE_REQUEST = "auth.email_change_request", _("Email change request")
    EMAIL_CHANGE = "auth.email_change", _("Email change")
    SESSION_REVOKE = "auth.session_revoke", _("Session revoke")
    PROFILE_UPDATE = "account.profile_update", _("Profile update")
    ACCOUNT_DELETE = "account.delete", _("Account delete")
    DATA_EXPORT = "account.data_export", _("Data export")
    CATEGORY_CREATE = "catalog.category_create", _("Category create")
    CATEGORY_UPDATE = "catalog.category_update", _("Category update")
    CATEGORY_DELETE = "catalog.category_delete", _("Category delete")
    APP_CREATE = "catalog.app_create", _("App create")
    APP_UPDATE = "catalog.app_update", _("App update")
    APP_DELETE = "catalog.app_delete", _("App delete")
    APP_IMPORT = "catalog.app_import", _("App import")
    SETTINGS_UPDATE = "admin.settings_update", _("Settings update")
    RECOMPUTE_COUNTS = "admin.recompute_counts", _("Recompute counts")
    CLEANUP_TOKENS = "admin.cleanup_tokens", _("Cleanup tokens")
    SCRIPT_GENERATE = "script.generate", _("Script generate")
    COLLECTION_CREATE = "collection.create", _("Collection create")
    COLLECTION_UPDATE = "collection.update", _("Collection update")
    COLLECTION_SET_APPS = "collection.set_apps", _("Collection set apps")
    COLLECTION_DELETE = "collection.delete", _("Collection delete")
    FAVORITE_ADD = "favorite.add", _("Favorite add")
    FAVORITE_REMOVE = "favorite.remove", _("Favorite remove")
