from __future__ import annotations

from typing import Any

from django.db import transaction
from rest_framework import serializers

from fosslove.catalog.enums import Platform
from fosslove.catalog.models import App
from fosslove.catalog.serializers import AppListSerializer
from fosslove.core.slugs import unique_slug
from fosslove.userdata.models import (
    MAX_COLLECTION_APPS,
    Collection,
    CollectionApp,
    ScriptRun,
)


def _dedupe_app_ids(value: list[int]) -> list[int]:
    seen: set[int] = set()
    result: list[int] = []
    for item in value:
        if item <= 0:
            raise serializers.ValidationError("App IDs must be positive integers.")
        if item not in seen:
            seen.add(item)
            result.append(item)
    if len(result) > MAX_COLLECTION_APPS:
        raise serializers.ValidationError(f"At most {MAX_COLLECTION_APPS} apps are allowed.")
    return result


def _assert_apps_exist(app_ids: list[int]) -> None:
    if not app_ids:
        return
    found = set(App.objects.filter(pk__in=app_ids).values_list("pk", flat=True))
    missing = [app_id for app_id in app_ids if app_id not in found]
    if missing:
        raise serializers.ValidationError(
            {"app_ids": f"Unknown app IDs: {missing}"}, code="unknown_apps"
        )


class CollectionSerializer(serializers.ModelSerializer[Collection]):
    item_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Collection
        fields = [
            "id",
            "user_id",
            "name",
            "slug",
            "description",
            "is_public",
            "item_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields


class CollectionItemSerializer(serializers.ModelSerializer[CollectionApp]):
    app = AppListSerializer(read_only=True)

    class Meta:
        model = CollectionApp
        fields = ["app", "position"]
        read_only_fields = fields


class CollectionDetailSerializer(CollectionSerializer):
    items = CollectionItemSerializer(many=True, read_only=True)

    class Meta(CollectionSerializer.Meta):
        fields = [*CollectionSerializer.Meta.fields, "items"]
        read_only_fields = fields


class CollectionWriteSerializer(serializers.ModelSerializer[Collection]):
    app_ids = serializers.ListField(
        child=serializers.IntegerField(), required=False, write_only=True
    )

    class Meta:
        model = Collection
        fields = ["name", "description", "is_public", "app_ids"]

    def validate_name(self, value: str) -> str:
        cleaned = value.strip()
        user = self.context["request"].user
        queryset = Collection.objects.filter(user=user, name__iexact=cleaned)
        if self.instance is not None:
            queryset = queryset.exclude(pk=self.instance.pk)
        if queryset.exists():
            raise serializers.ValidationError(
                "You already have a collection with this name.", code="name_taken"
            )
        return cleaned

    def validate_app_ids(self, value: list[int]) -> list[int]:
        app_ids = _dedupe_app_ids(value)
        _assert_apps_exist(app_ids)
        return app_ids

    @transaction.atomic
    def create(self, validated_data: dict[str, Any]) -> Collection:
        app_ids = validated_data.pop("app_ids", [])
        user = self.context["request"].user
        validated_data["slug"] = unique_slug(
            Collection.objects.filter(user=user), validated_data["name"], max_length=140
        )
        collection = Collection.objects.create(user=user, **validated_data)
        CollectionApp.objects.bulk_create(
            [
                CollectionApp(collection=collection, app_id=app_id, position=index)
                for index, app_id in enumerate(app_ids)
            ]
        )
        return collection

    @transaction.atomic
    def update(self, instance: Collection, validated_data: dict[str, Any]) -> Collection:
        validated_data.pop("app_ids", None)
        if "name" in validated_data and validated_data["name"] != instance.name:
            instance.slug = unique_slug(
                Collection.objects.filter(user=instance.user),
                validated_data["name"],
                max_length=140,
                exclude_pk=instance.pk,
            )
        for key, value in validated_data.items():
            setattr(instance, key, value)
        instance.save()
        return instance


class CollectionSetAppsSerializer(serializers.Serializer[Any]):
    app_ids = serializers.ListField(child=serializers.IntegerField())

    def validate_app_ids(self, value: list[int]) -> list[int]:
        app_ids = _dedupe_app_ids(value)
        _assert_apps_exist(app_ids)
        return app_ids


class ScriptRunSerializer(serializers.ModelSerializer[ScriptRun]):
    class Meta:
        model = ScriptRun
        fields = ["id", "platform", "app_ids", "app_count", "created_at"]
        read_only_fields = fields


class ScriptGenerateSerializer(serializers.Serializer[Any]):
    platform = serializers.ChoiceField(choices=Platform.choices)
    app_ids = serializers.ListField(child=serializers.IntegerField(), required=False, default=list)
    collection_id = serializers.IntegerField(required=False, allow_null=True, min_value=1)

    def validate_app_ids(self, value: list[int]) -> list[int]:
        return _dedupe_app_ids(value)

    def validate(self, attrs: dict[str, Any]) -> dict[str, Any]:
        if not attrs.get("collection_id") and not attrs.get("app_ids"):
            raise serializers.ValidationError("Provide either app_ids or a collection_id.")
        return attrs
