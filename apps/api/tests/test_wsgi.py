from __future__ import annotations

from django.core.handlers.asgi import ASGIHandler
from django.core.handlers.wsgi import WSGIHandler


def test_wsgi_application_loads() -> None:
    from fosslove.conf.wsgi import application

    assert isinstance(application, WSGIHandler)


def test_asgi_application_loads() -> None:
    from fosslove.conf.asgi import application

    assert isinstance(application, ASGIHandler)
