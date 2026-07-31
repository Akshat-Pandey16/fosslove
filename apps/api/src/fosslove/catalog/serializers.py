from __future__ import annotations

from typing import Any

from django.db import transaction
from rest_framework import serializers

from fosslove.catalog.enums import PackageManager, Platform
from fosslove.catalog.models import App, Category, PackageReference
from fosslove.core.slugs import model_unique_slug

MAX_IMPORT_APPS = 500


class CategorySerializer(serializers.ModelSerializer[Category]):
    class Meta:
        model = Category
        fields = [
            "id",
            "name",
            "slug",
            "description",
            "icon_url",
            "windows_app_count",
            "linux_app_count",
            "created_at",
        ]
        read_only_fields = fields


class CategoryWriteSerializer(serializers.ModelSerializer[Category]):
    class Meta:
        model = Category
        fields = ["name", "description", "icon_url"]
        extra_kwargs = {
            "name": {"required": True, "allow_blank": False},
            "description": {"required": False, "allow_blank": True},
            "icon_url": {"required": False, "allow_blank": True},
        }

    def validate_name(self, value: str) -> str:
        cleaned = value.strip()
        queryset = Category.objects.filter(name__iexact=cleaned)
        if self.instance is not None:
            queryset = queryset.exclude(pk=self.instance.pk)
        if queryset.exists():
            raise serializers.ValidationError(
                "A category with this name already exists.", code="category_exists"
            )
        return cleaned

    def create(self, validated_data: dict[str, Any]) -> Category:
        validated_data["slug"] = model_unique_slug(Category, validated_data["name"])
        return Category.objects.create(**validated_data)

    def update(self, instance: Category, validated_data: dict[str, Any]) -> Category:
        if "name" in validated_data and validated_data["name"] != instance.name:
            instance.slug = model_unique_slug(
                Category, validated_data["name"], exclude_pk=instance.pk
            )
        for key, value in validated_data.items():
            setattr(instance, key, value)
        instance.save()
        return instance


class PackageReferenceSerializer(serializers.ModelSerializer[PackageReference]):
    class Meta:
        model = PackageReference
        fields = ["id", "manager", "identifier", "install_args", "priority", "extra"]
        read_only_fields = ["id"]

    def validate(self, attrs: dict[str, Any]) -> dict[str, Any]:
        identifier = str(attrs.get("identifier", "")).strip()
        if attrs.get("manager") == PackageManager.DIRECT and not identifier.startswith(
            ("http://", "https://")
        ):
            raise serializers.ValidationError(
                {"identifier": "Direct downloads require an http(s) URL."}
            )
        attrs["identifier"] = identifier
        return attrs


class AppListSerializer(serializers.ModelSerializer[App]):
    category_name = serializers.CharField(source="category.name", read_only=True)
    category_slug = serializers.CharField(source="category.slug", read_only=True)

    class Meta:
        model = App
        fields = [
            "id",
            "category_id",
            "category_name",
            "category_slug",
            "platform",
            "name",
            "slug",
            "summary",
            "homepage_url",
            "is_active",
        ]
        read_only_fields = fields


class AppDetailSerializer(AppListSerializer):
    package_refs = PackageReferenceSerializer(many=True, read_only=True)

    class Meta(AppListSerializer.Meta):
        fields = [
            *AppListSerializer.Meta.fields,
            "description",
            "license",
            "package_refs",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields


class AppWriteSerializer(serializers.ModelSerializer[App]):
    package_refs = PackageReferenceSerializer(many=True, required=False)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(), source="category"
    )

    class Meta:
        model = App
        fields = [
            "category_id",
            "platform",
            "name",
            "summary",
            "description",
            "homepage_url",
            "license",
            "is_active",
            "package_refs",
        ]

    def validate_name(self, value: str) -> str:
        return value.strip()

    def validate_package_refs(self, value: list[dict[str, Any]]) -> list[dict[str, Any]]:
        managers = [ref["manager"] for ref in value]
        if len(managers) != len(set(managers)):
            raise serializers.ValidationError(
                "Duplicate package managers for one app.", code="duplicate_manager"
            )
        return value

    def validate(self, attrs: dict[str, Any]) -> dict[str, Any]:
        instance = self.instance
        category = attrs.get("category", getattr(instance, "category", None))
        platform = attrs.get("platform", getattr(instance, "platform", None))
        name = attrs.get("name", getattr(instance, "name", None))
        queryset = App.objects.filter(category=category, platform=platform, name=name)
        if instance is not None:
            queryset = queryset.exclude(pk=instance.pk)
        if queryset.exists():
            raise serializers.ValidationError(
                {"name": "An app with this name already exists here."}, code="app_exists"
            )
        return attrs

    @transaction.atomic
    def create(self, validated_data: dict[str, Any]) -> App:
        refs = validated_data.pop("package_refs", [])
        validated_data["slug"] = model_unique_slug(
            App,
            validated_data["name"],
            max_length=220,
            scope={"platform": validated_data["platform"]},
        )
        app = App.objects.create(**validated_data)
        PackageReference.objects.bulk_create([PackageReference(app=app, **ref) for ref in refs])
        return app

    @transaction.atomic
    def update(self, instance: App, validated_data: dict[str, Any]) -> App:
        refs = validated_data.pop("package_refs", None)
        if "name" in validated_data and validated_data["name"] != instance.name:
            instance.slug = model_unique_slug(
                App,
                validated_data["name"],
                max_length=220,
                exclude_pk=instance.pk,
                scope={"platform": instance.platform},
            )
        for key, value in validated_data.items():
            setattr(instance, key, value)
        instance.save()
        if refs is not None:
            instance.package_refs.all().delete()
            PackageReference.objects.bulk_create(
                [PackageReference(app=instance, **ref) for ref in refs]
            )
        return instance


class AppImportSerializer(serializers.Serializer[Any]):
    apps = AppWriteSerializer(many=True)

    def validate_apps(self, value: list[Any]) -> list[Any]:
        if not value:
            raise serializers.ValidationError("Provide at least one app.")
        if len(value) > MAX_IMPORT_APPS:
            raise serializers.ValidationError(f"At most {MAX_IMPORT_APPS} apps per import.")
        return value


class CatalogExportSerializer(serializers.Serializer[Any]):
    categories = CategorySerializer(many=True, read_only=True)
    apps = AppDetailSerializer(many=True, read_only=True)


class PlatformSerializer(serializers.Serializer[Any]):
    platform = serializers.ChoiceField(choices=Platform.choices)


class RecomputeCountsSerializer(serializers.Serializer[Any]):
    message = serializers.CharField(read_only=True)
    categories = serializers.IntegerField(read_only=True)
