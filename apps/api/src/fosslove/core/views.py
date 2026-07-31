from __future__ import annotations

from typing import Any

from django.conf import settings
from django.core.cache import cache
from django.db import DatabaseError, connection
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from fosslove.core.serializers import (
    HealthSerializer,
    ReadinessSerializer,
    ServiceInfoSerializer,
)


class RootView(APIView):
    throttle_classes: list[Any] = []

    @extend_schema(tags=["Health"], responses={200: ServiceInfoSerializer})
    def get(self, request: Request) -> Response:
        return Response(
            {
                "service": settings.PROJECT_NAME,
                "version": settings.SPECTACULAR_SETTINGS["VERSION"],
                "status": "ok",
            }
        )


class HealthView(APIView):
    throttle_classes: list[Any] = []

    @extend_schema(tags=["Health"], responses={200: HealthSerializer})
    def get(self, request: Request) -> Response:
        return Response({"status": "ok"})


class ReadinessView(APIView):
    throttle_classes: list[Any] = []

    @extend_schema(tags=["Health"], responses={200: ReadinessSerializer, 503: ReadinessSerializer})
    def get(self, request: Request) -> Response:
        checks: dict[str, str] = {}
        healthy = True

        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
            checks["database"] = "ok"
        except DatabaseError:
            checks["database"] = "error"
            healthy = False

        try:
            cache.set("health:ping", "1", 5)
            checks["cache"] = "ok" if cache.get("health:ping") == "1" else "error"
        except Exception:
            checks["cache"] = "error"

        return Response(
            {"status": checks},
            status=status.HTTP_200_OK if healthy else status.HTTP_503_SERVICE_UNAVAILABLE,
        )
