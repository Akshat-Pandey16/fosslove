from __future__ import annotations

from typing import Any

from django.db import transaction
from django.shortcuts import get_object_or_404
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from fosslove.activity.actions import Action
from fosslove.activity.recorder import record
from fosslove.catalog.enums import Platform
from fosslove.catalog.filters import AppFilter
from fosslove.catalog.models import App, Category
from fosslove.catalog.serializers import (
    AppDetailSerializer,
    AppImportSerializer,
    AppListSerializer,
    AppWriteSerializer,
    CatalogExportSerializer,
    CategorySerializer,
    CategoryWriteSerializer,
    RecomputeCountsSerializer,
)
from fosslove.catalog.services import recompute_category_counts
from fosslove.catalog.views import detailed_apps
from fosslove.core.cache import bump_catalog_version
from fosslove.core.pagination import PageNumberMetaPagination
from fosslove.core.permissions import IsAdminRole
from fosslove.core.schema import page_parameters, paginated, query_parameter


class AdminCategoryListView(APIView):
    permission_classes = [IsAdminRole]

    @extend_schema(
        tags=["Admin"], request=CategoryWriteSerializer, responses={201: CategorySerializer}
    )
    def post(self, request: Request) -> Response:
        serializer = CategoryWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        category = serializer.save()
        bump_catalog_version()
        record(
            request._request,
            Action.CATEGORY_CREATE,
            target_type="category",
            target_id=str(category.pk),
        )
        return Response(CategorySerializer(category).data, status=status.HTTP_201_CREATED)


class AdminCategoryDetailView(APIView):
    permission_classes = [IsAdminRole]

    @extend_schema(
        tags=["Admin"], request=CategoryWriteSerializer, responses={200: CategorySerializer}
    )
    def patch(self, request: Request, pk: int) -> Response:
        category = get_object_or_404(Category, pk=pk)
        serializer = CategoryWriteSerializer(category, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        category = serializer.save()
        bump_catalog_version()
        record(
            request._request,
            Action.CATEGORY_UPDATE,
            target_type="category",
            target_id=str(pk),
        )
        return Response(CategorySerializer(category).data)

    @extend_schema(tags=["Admin"], responses={204: None})
    def delete(self, request: Request, pk: int) -> Response:
        category = get_object_or_404(Category, pk=pk)
        category.delete()
        bump_catalog_version()
        record(
            request._request,
            Action.CATEGORY_DELETE,
            target_type="category",
            target_id=str(pk),
        )
        return Response(status=status.HTTP_204_NO_CONTENT)


class AdminAppListView(APIView):
    permission_classes = [IsAdminRole]

    @extend_schema(
        tags=["Admin"],
        parameters=page_parameters(
            query_parameter("platform", str, enum=Platform.values),
            query_parameter("category_id", int),
            query_parameter("q", str),
        ),
        responses={200: paginated(AppListSerializer, "PaginatedAdminAppList")},
    )
    def get(self, request: Request) -> Response:
        queryset = AppFilter(
            request.query_params,
            queryset=App.objects.select_related("category").order_by("name", "pk"),
            request=request,
        ).qs
        paginator = PageNumberMetaPagination()
        page: list[Any] | None = paginator.paginate_queryset(queryset, request, view=self)
        return paginator.get_paginated_response(AppListSerializer(page, many=True).data)

    @extend_schema(tags=["Admin"], request=AppWriteSerializer, responses={201: AppDetailSerializer})
    def post(self, request: Request) -> Response:
        serializer = AppWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        app = serializer.save()
        bump_catalog_version()
        record(request._request, Action.APP_CREATE, target_type="app", target_id=str(app.pk))
        return Response(
            AppDetailSerializer(detailed_apps().get(pk=app.pk)).data,
            status=status.HTTP_201_CREATED,
        )


class AdminAppDetailView(APIView):
    permission_classes = [IsAdminRole]

    @extend_schema(tags=["Admin"], request=AppWriteSerializer, responses={200: AppDetailSerializer})
    def patch(self, request: Request, pk: int) -> Response:
        app = get_object_or_404(App.objects.select_related("category"), pk=pk)
        serializer = AppWriteSerializer(app, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        app = serializer.save()
        bump_catalog_version()
        record(request._request, Action.APP_UPDATE, target_type="app", target_id=str(pk))
        return Response(AppDetailSerializer(detailed_apps().get(pk=app.pk)).data)

    @extend_schema(tags=["Admin"], responses={204: None})
    def delete(self, request: Request, pk: int) -> Response:
        app = get_object_or_404(App, pk=pk)
        app.delete()
        bump_catalog_version()
        record(request._request, Action.APP_DELETE, target_type="app", target_id=str(pk))
        return Response(status=status.HTTP_204_NO_CONTENT)


class AdminAppImportView(APIView):
    permission_classes = [IsAdminRole]

    @extend_schema(
        tags=["Admin"], request=AppImportSerializer, responses={201: AppDetailSerializer(many=True)}
    )
    @transaction.atomic
    def post(self, request: Request) -> Response:
        serializer = AppImportSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        created: list[Any] = []
        for payload in serializer.validated_data["apps"]:
            writer = AppWriteSerializer()
            created.append(writer.create(dict(payload)))
        bump_catalog_version()
        record(request._request, Action.APP_IMPORT, detail={"count": len(created)})
        queryset = detailed_apps().filter(pk__in=[app.pk for app in created])
        return Response(
            AppDetailSerializer(queryset, many=True).data, status=status.HTTP_201_CREATED
        )


class AdminCatalogExportView(APIView):
    permission_classes = [IsAdminRole]

    @extend_schema(tags=["Admin"], responses={200: CatalogExportSerializer})
    def get(self, request: Request) -> Response:
        payload = {
            "categories": Category.objects.all(),
            "apps": detailed_apps().order_by("platform", "name"),
        }
        return Response(CatalogExportSerializer(payload).data)


class AdminRecomputeCountsView(APIView):
    permission_classes = [IsAdminRole]

    @extend_schema(tags=["Admin"], request=None, responses={200: RecomputeCountsSerializer})
    def post(self, request: Request) -> Response:
        updated = recompute_category_counts()
        bump_catalog_version()
        record(request._request, Action.RECOMPUTE_COUNTS, detail={"categories": updated})
        return Response({"message": "Category counts recomputed.", "categories": updated})
