from __future__ import annotations

from typing import Any

from django.shortcuts import get_object_or_404
from drf_spectacular.utils import extend_schema
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from fosslove.catalog.enums import Platform
from fosslove.catalog.filters import AppFilter
from fosslove.catalog.mixins import CatalogCacheMixin
from fosslove.catalog.models import App, Category
from fosslove.catalog.serializers import (
    AppDetailSerializer,
    AppListSerializer,
    CategorySerializer,
)
from fosslove.core.pagination import PageNumberMetaPagination
from fosslove.core.schema import page_parameters, paginated, query_parameter


def active_apps() -> Any:
    return App.objects.filter(is_active=True).select_related("category").order_by("name", "pk")


def detailed_apps() -> Any:
    return App.objects.select_related("category").prefetch_related("package_refs")


class CategoryListView(CatalogCacheMixin, APIView):
    @extend_schema(
        tags=["Catalog"],
        operation_id="categories_list",
        parameters=page_parameters(),
        responses={200: paginated(CategorySerializer, "PaginatedCategoryList")},
    )
    def get(self, request: Request) -> Response:
        paginator = PageNumberMetaPagination()

        def produce() -> Any:
            page: list[Any] | None = paginator.paginate_queryset(
                Category.objects.order_by("name", "pk"), request, view=self
            )
            data = CategorySerializer(page, many=True).data
            return paginator.get_paginated_response(data).data

        return self.cached_response(
            [
                "categories",
                request.query_params.get("page", 1),
                request.query_params.get("size", ""),
            ],
            produce,
        )


class CategoryDetailView(CatalogCacheMixin, APIView):
    @extend_schema(tags=["Catalog"], responses={200: CategorySerializer})
    def get(self, request: Request, pk: int) -> Response:
        def produce() -> Any:
            category = get_object_or_404(Category, pk=pk)
            return CategorySerializer(category).data

        return self.cached_response(["category", pk], produce)


class CategoryBySlugView(CatalogCacheMixin, APIView):
    @extend_schema(tags=["Catalog"], responses={200: CategorySerializer})
    def get(self, request: Request, slug: str) -> Response:
        def produce() -> Any:
            category = get_object_or_404(Category, slug=slug)
            return CategorySerializer(category).data

        return self.cached_response(["category-slug", slug], produce)


class AppListView(CatalogCacheMixin, APIView):
    @extend_schema(
        tags=["Catalog"],
        parameters=page_parameters(
            query_parameter("platform", str, enum=Platform.values),
            query_parameter("category_id", int),
            query_parameter("q", str),
        ),
        responses={200: paginated(AppListSerializer, "PaginatedAppList")},
        operation_id="apps_list",
    )
    def get(self, request: Request) -> Response:
        paginator = PageNumberMetaPagination()
        params = request.query_params

        def produce() -> Any:
            queryset = AppFilter(params, queryset=active_apps(), request=request).qs
            page: list[Any] | None = paginator.paginate_queryset(queryset, request, view=self)
            data = AppListSerializer(page, many=True).data
            return paginator.get_paginated_response(data).data

        return self.cached_response(
            [
                "apps",
                params.get("platform", ""),
                params.get("category_id", ""),
                params.get("q", ""),
                params.get("page", 1),
                params.get("size", ""),
            ],
            produce,
        )


class AppDetailView(CatalogCacheMixin, APIView):
    @extend_schema(tags=["Catalog"], responses={200: AppDetailSerializer})
    def get(self, request: Request, pk: int) -> Response:
        def produce() -> Any:
            app = get_object_or_404(detailed_apps(), pk=pk)
            return AppDetailSerializer(app).data

        return self.cached_response(["app", pk], produce)


class AppBySlugView(CatalogCacheMixin, APIView):
    @extend_schema(tags=["Catalog"], responses={200: AppDetailSerializer})
    def get(self, request: Request, platform: str, slug: str) -> Response:
        def produce() -> Any:
            app = get_object_or_404(detailed_apps(), platform=platform, slug=slug)
            return AppDetailSerializer(app).data

        if platform not in Platform.values:
            return Response(
                {"error": {"code": "not_found", "message": "App not found."}}, status=404
            )
        return self.cached_response(["app-slug", platform, slug], produce)
