from __future__ import annotations

from typing import Any

from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from fosslove.activity.filters import ActivityLogFilter
from fosslove.activity.models import ActivityLog
from fosslove.activity.serializers import ActivityLogSerializer
from fosslove.core.pagination import PageNumberMetaPagination
from fosslove.core.permissions import IsAdminRole
from fosslove.core.schema import page_parameters, paginated, query_parameter


class AdminActivityListView(APIView):
    permission_classes = [IsAdminRole]

    @extend_schema(
        tags=["Admin"],
        parameters=page_parameters(
            query_parameter("action", str),
            query_parameter("status", str),
            query_parameter("target_type", str),
            query_parameter("user_id", OpenApiTypes.UUID),
            query_parameter("since", OpenApiTypes.DATETIME),
            query_parameter("until", OpenApiTypes.DATETIME),
        ),
        responses={200: paginated(ActivityLogSerializer, "PaginatedActivityLogList")},
    )
    def get(self, request: Request) -> Response:
        queryset = ActivityLogFilter(
            request.query_params,
            queryset=ActivityLog.objects.order_by("-created_at", "-pk"),
            request=request,
        ).qs
        paginator = PageNumberMetaPagination()
        page: list[Any] | None = paginator.paginate_queryset(queryset, request, view=self)
        return paginator.get_paginated_response(ActivityLogSerializer(page, many=True).data)
