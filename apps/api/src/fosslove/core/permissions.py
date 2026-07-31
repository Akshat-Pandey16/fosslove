from __future__ import annotations

from typing import Any

from rest_framework.permissions import BasePermission

from fosslove.core.exceptions import PermissionDeniedError


class IsAuthenticated(BasePermission):
    def has_permission(self, request: Any, view: Any) -> bool:
        return bool(request.user and request.user.is_authenticated)


class IsAdminRole(BasePermission):
    def has_permission(self, request: Any, view: Any) -> bool:
        user = request.user
        return bool(user and user.is_authenticated and user.is_staff)


class IsVerified(BasePermission):
    def has_permission(self, request: Any, view: Any) -> bool:
        user = request.user
        if not (user and user.is_authenticated):
            return False
        if not user.is_verified:
            raise PermissionDeniedError(
                "Please verify your email address to use this feature.",
                code="email_unverified",
            )
        return True
