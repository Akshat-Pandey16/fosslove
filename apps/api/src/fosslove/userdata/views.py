from __future__ import annotations

from django.db import transaction
from django.http import HttpResponse
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from fosslove.activity.actions import Action
from fosslove.activity.recorder import record
from fosslove.catalog.models import App
from fosslove.catalog.serializers import AppListSerializer
from fosslove.core.auth import current_user, optional_user, optional_user_id
from fosslove.core.exceptions import BadRequestError
from fosslove.core.pagination import PageNumberMetaPagination
from fosslove.core.permissions import IsVerified
from fosslove.core.schema import page_parameters, paginated
from fosslove.userdata import services
from fosslove.userdata.models import Collection, CollectionApp, Favorite, ScriptRun
from fosslove.userdata.serializers import (
    CollectionDetailSerializer,
    CollectionSerializer,
    CollectionSetAppsSerializer,
    CollectionWriteSerializer,
    ScriptGenerateSerializer,
    ScriptRunSerializer,
)

NOT_FOUND = "Collection not found."


class CollectionListView(APIView):
    permission_classes = [IsVerified]

    @extend_schema(
        tags=["Collections"],
        parameters=page_parameters(),
        responses={200: paginated(CollectionSerializer, "PaginatedCollectionList")},
        operation_id="collections_list",
    )
    def get(self, request: Request) -> Response:
        queryset = services.collections_with_counts().filter(user=current_user(request))
        paginator = PageNumberMetaPagination()
        page = paginator.paginate_queryset(queryset, request, view=self)
        return paginator.get_paginated_response(CollectionSerializer(page, many=True).data)

    @extend_schema(
        tags=["Collections"],
        request=CollectionWriteSerializer,
        responses={201: CollectionDetailSerializer},
    )
    def post(self, request: Request) -> Response:
        serializer = CollectionWriteSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        collection = serializer.save()
        record(
            request._request,
            Action.COLLECTION_CREATE,
            target_type="collection",
            target_id=str(collection.pk),
        )
        detail = services.owned_collection(collection.pk, current_user(request).pk)
        return Response(CollectionDetailSerializer(detail).data, status=status.HTTP_201_CREATED)


class PublicCollectionListView(APIView):
    @extend_schema(
        tags=["Collections"],
        parameters=page_parameters(),
        responses={200: paginated(CollectionSerializer, "PaginatedPublicCollectionList")},
    )
    def get(self, request: Request) -> Response:
        queryset = services.collections_with_counts().filter(is_public=True)
        paginator = PageNumberMetaPagination()
        page = paginator.paginate_queryset(queryset, request, view=self)
        return paginator.get_paginated_response(CollectionSerializer(page, many=True).data)


class CollectionDetailView(APIView):
    @extend_schema(tags=["Collections"], responses={200: CollectionDetailSerializer})
    def get(self, request: Request, pk: int) -> Response:
        viewer_id = optional_user_id(request)
        collection = services.viewable_collection(pk, viewer_id)
        if collection is None:
            raise BadRequestError(NOT_FOUND, code="not_found")
        return Response(CollectionDetailSerializer(collection).data)

    @extend_schema(
        tags=["Collections"],
        request=CollectionWriteSerializer,
        responses={200: CollectionDetailSerializer},
    )
    def patch(self, request: Request, pk: int) -> Response:
        self.permission_classes = [IsVerified]
        self.check_permissions(request)
        collection = services.owned_collection(pk, current_user(request).pk)
        if collection is None:
            raise BadRequestError(NOT_FOUND, code="not_found")
        serializer = CollectionWriteSerializer(
            collection, data=request.data, partial=True, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        record(
            request._request,
            Action.COLLECTION_UPDATE,
            target_type="collection",
            target_id=str(pk),
        )
        return Response(
            CollectionDetailSerializer(services.owned_collection(pk, current_user(request).pk)).data
        )

    @extend_schema(tags=["Collections"], responses={204: None})
    def delete(self, request: Request, pk: int) -> Response:
        self.permission_classes = [IsVerified]
        self.check_permissions(request)
        collection = Collection.objects.filter(pk=pk, user=current_user(request)).first()
        if collection is None:
            raise BadRequestError(NOT_FOUND, code="not_found")
        collection.delete()
        record(
            request._request,
            Action.COLLECTION_DELETE,
            target_type="collection",
            target_id=str(pk),
        )
        return Response(status=status.HTTP_204_NO_CONTENT)


class CollectionAppsView(APIView):
    permission_classes = [IsVerified]

    @extend_schema(
        tags=["Collections"],
        request=CollectionSetAppsSerializer,
        responses={200: CollectionDetailSerializer},
    )
    @transaction.atomic
    def patch(self, request: Request, pk: int) -> Response:
        collection = Collection.objects.filter(pk=pk, user=current_user(request)).first()
        if collection is None:
            raise BadRequestError(NOT_FOUND, code="not_found")
        serializer = CollectionSetAppsSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        app_ids = serializer.validated_data["app_ids"]
        collection.items.all().delete()
        CollectionApp.objects.bulk_create(
            [
                CollectionApp(collection=collection, app_id=app_id, position=index)
                for index, app_id in enumerate(app_ids)
            ]
        )
        record(
            request._request,
            Action.COLLECTION_SET_APPS,
            target_type="collection",
            target_id=str(pk),
        )
        return Response(
            CollectionDetailSerializer(services.owned_collection(pk, current_user(request).pk)).data
        )


class FavoriteListView(APIView):
    permission_classes = [IsVerified]

    @extend_schema(
        tags=["Favorites"],
        parameters=page_parameters(),
        responses={200: paginated(AppListSerializer, "PaginatedFavoriteList")},
    )
    def get(self, request: Request) -> Response:
        queryset = (
            App.objects.filter(favorited_by__user=current_user(request))
            .select_related("category")
            .order_by("-favorited_by__created_at", "-pk")
        )
        paginator = PageNumberMetaPagination()
        page = paginator.paginate_queryset(queryset, request, view=self)
        return paginator.get_paginated_response(AppListSerializer(page, many=True).data)


class FavoriteIdsView(APIView):
    permission_classes = [IsVerified]

    @extend_schema(tags=["Favorites"], responses={200: list[int]})
    def get(self, request: Request) -> Response:
        ids = Favorite.objects.filter(user=current_user(request)).values_list("app_id", flat=True)
        return Response(list(ids))


class FavoriteDetailView(APIView):
    permission_classes = [IsVerified]

    @extend_schema(tags=["Favorites"], request=None, responses={204: None})
    def post(self, request: Request, app_id: int) -> Response:
        if not App.objects.filter(pk=app_id).exists():
            raise BadRequestError("App not found.", code="not_found")
        Favorite.objects.get_or_create(user=current_user(request), app_id=app_id)
        record(request._request, Action.FAVORITE_ADD, target_type="app", target_id=str(app_id))
        return Response(status=status.HTTP_204_NO_CONTENT)

    @extend_schema(tags=["Favorites"], responses={204: None})
    def delete(self, request: Request, app_id: int) -> Response:
        Favorite.objects.filter(user=current_user(request), app_id=app_id).delete()
        record(request._request, Action.FAVORITE_REMOVE, target_type="app", target_id=str(app_id))
        return Response(status=status.HTTP_204_NO_CONTENT)


class ScriptGenerateView(APIView):
    @extend_schema(
        tags=["Scripts"],
        request=ScriptGenerateSerializer,
        responses={(200, "text/plain"): OpenApiTypes.BINARY},
    )
    def post(self, request: Request) -> HttpResponse:
        serializer = ScriptGenerateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        platform = serializer.validated_data["platform"]
        collection_id = serializer.validated_data.get("collection_id")
        viewer_id = optional_user_id(request)

        if collection_id:
            collection = services.viewable_collection(collection_id, viewer_id)
            if collection is None:
                raise BadRequestError(NOT_FOUND, code="not_found")
            app_ids = [item.app_id for item in collection.items.all()]
            if not app_ids:
                raise BadRequestError(
                    "This collection has no apps to install.", code="empty_collection"
                )
        else:
            app_ids = serializer.validated_data["app_ids"]

        result = services.build_script(platform, app_ids)
        ScriptRun.objects.create(
            user=optional_user(request),
            platform=platform,
            app_ids=result.app_ids,
            app_count=len(result.app_ids),
            client_ip=request._request.META.get("REMOTE_ADDR") or "",
        )
        record(
            request._request,
            Action.SCRIPT_GENERATE,
            target_type="platform",
            target_id=platform,
            detail={"app_count": len(result.app_ids), "skipped_ids": result.skipped_ids},
        )
        response = HttpResponse(result.content, content_type="text/plain; charset=utf-8")
        response["Content-Disposition"] = f'attachment; filename="{result.filename}"'
        response["Cache-Control"] = "no-store"
        if result.skipped_ids:
            response["X-Fosslove-Skipped"] = ",".join(str(i) for i in result.skipped_ids)
        return response


class ScriptHistoryView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        tags=["Scripts"],
        parameters=page_parameters(),
        responses={200: paginated(ScriptRunSerializer, "PaginatedScriptRunList")},
    )
    def get(self, request: Request) -> Response:
        queryset = ScriptRun.objects.filter(user=current_user(request)).order_by(
            "-created_at", "-pk"
        )
        paginator = PageNumberMetaPagination()
        page = paginator.paginate_queryset(queryset, request, view=self)
        return paginator.get_paginated_response(ScriptRunSerializer(page, many=True).data)
