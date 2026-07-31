from __future__ import annotations

import uuid

from rest_framework.exceptions import NotAuthenticated
from rest_framework.request import Request

from fosslove.accounts.models import User


def current_user(request: Request) -> User:
    user = request.user
    if not isinstance(user, User):
        raise NotAuthenticated
    return user


def optional_user(request: Request) -> User | None:
    user = request.user
    return user if isinstance(user, User) else None


def optional_user_id(request: Request) -> uuid.UUID | None:
    user = optional_user(request)
    return user.pk if user is not None else None
