from __future__ import annotations

from django.core.management import call_command
from drf_spectacular.utils import extend_schema
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from fosslove.activity.actions import Action
from fosslove.activity.recorder import record
from fosslove.core.permissions import IsAdminRole
from fosslove.core.serializers import MessageSerializer
from fosslove.siteconfig.models import SiteConfiguration
from fosslove.siteconfig.serializers import (
    SiteConfigurationReadSerializer,
    SiteConfigurationUpdateSerializer,
)


class SiteConfigurationView(APIView):
    permission_classes = [IsAdminRole]

    @extend_schema(tags=["Admin"], responses={200: SiteConfigurationReadSerializer})
    def get(self, request: Request) -> Response:
        return Response(SiteConfigurationReadSerializer(SiteConfiguration.get_solo()).data)

    @extend_schema(
        tags=["Admin"],
        request=SiteConfigurationUpdateSerializer,
        responses={200: SiteConfigurationReadSerializer},
    )
    def patch(self, request: Request) -> Response:
        config = SiteConfiguration.get_solo()
        serializer = SiteConfigurationUpdateSerializer(config, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        record(
            request._request,
            Action.SETTINGS_UPDATE,
            detail={"fields": sorted(serializer.validated_data.keys())},
        )
        return Response(SiteConfigurationReadSerializer(SiteConfiguration.get_solo()).data)


class CleanupTokensView(APIView):
    permission_classes = [IsAdminRole]

    @extend_schema(tags=["Admin"], request=None, responses={200: MessageSerializer})
    def post(self, request: Request) -> Response:
        call_command("flushexpiredtokens", verbosity=0)
        record(request._request, Action.CLEANUP_TOKENS)
        return Response({"message": "Expired refresh tokens removed."})
