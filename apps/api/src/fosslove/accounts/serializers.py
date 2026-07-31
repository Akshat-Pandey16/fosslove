from __future__ import annotations

from typing import Any

from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers
from rest_framework_simplejwt.token_blacklist.models import OutstandingToken

from fosslove.accounts.models import User


def _validate_password(value: str, user: User | None = None) -> str:
    try:
        validate_password(value, user)
    except DjangoValidationError as exc:
        raise serializers.ValidationError(list(exc.messages)) from exc
    return value


class UserSerializer(serializers.ModelSerializer[User]):
    role = serializers.CharField(read_only=True)

    class Meta:
        model = User
        fields = ["id", "email", "full_name", "role", "is_active", "is_verified", "created_at"]
        read_only_fields = fields


class UserUpdateSerializer(serializers.ModelSerializer[User]):
    class Meta:
        model = User
        fields = ["full_name"]

    def validate_full_name(self, value: str) -> str:
        return value.strip()


class RegisterSerializer(serializers.ModelSerializer[User]):
    password = serializers.CharField(write_only=True, min_length=8, max_length=128)

    class Meta:
        model = User
        fields = ["email", "password", "full_name"]
        extra_kwargs = {"full_name": {"required": False, "allow_blank": True}}

    def validate_email(self, value: str) -> str:
        normalized = value.strip().lower()
        if User.objects.filter(email__iexact=normalized).exists():
            raise serializers.ValidationError(
                "An account with this email already exists.", code="email_taken"
            )
        return normalized

    def validate_password(self, value: str) -> str:
        return _validate_password(value)

    def create(self, validated_data: dict[str, Any]) -> User:
        password = validated_data.pop("password")
        return User.objects.create_user(password=password, **validated_data)


class LoginSerializer(serializers.Serializer[Any]):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, trim_whitespace=False)

    def validate(self, attrs: dict[str, Any]) -> dict[str, Any]:
        user = authenticate(
            request=self.context.get("request"),
            username=attrs["email"].strip().lower(),
            password=attrs["password"],
        )
        if user is None:
            raise serializers.ValidationError(
                "Invalid email or password.", code="invalid_credentials"
            )
        if not user.is_active:
            raise serializers.ValidationError("This account is disabled.", code="account_disabled")
        attrs["user"] = user
        return attrs


class RefreshSerializer(serializers.Serializer[Any]):
    refresh = serializers.CharField()


class EmailSerializer(serializers.Serializer[Any]):
    email = serializers.EmailField()

    def validate_email(self, value: str) -> str:
        return value.strip().lower()


class UidTokenSerializer(serializers.Serializer[Any]):
    uid = serializers.CharField()
    token = serializers.CharField()


class PasswordResetConfirmSerializer(UidTokenSerializer):
    new_password = serializers.CharField(min_length=8, max_length=128)

    def validate_new_password(self, value: str) -> str:
        return _validate_password(value)


class ChangePasswordSerializer(serializers.Serializer[Any]):
    current_password = serializers.CharField(trim_whitespace=False)
    new_password = serializers.CharField(min_length=8, max_length=128)

    def validate_current_password(self, value: str) -> str:
        user = self.context["request"].user
        if not user.check_password(value):
            raise serializers.ValidationError(
                "Current password is incorrect.", code="invalid_credentials"
            )
        return value

    def validate_new_password(self, value: str) -> str:
        return _validate_password(value, self.context["request"].user)


class EmailChangeRequestSerializer(serializers.Serializer[Any]):
    new_email = serializers.EmailField()

    def validate_new_email(self, value: str) -> str:
        normalized = value.strip().lower()
        user = self.context["request"].user
        if normalized == user.email.lower():
            raise serializers.ValidationError(
                "This is already your email address.", code="email_unchanged"
            )
        if User.objects.filter(email__iexact=normalized).exists():
            raise serializers.ValidationError(
                "An account with this email already exists.", code="email_taken"
            )
        return normalized


class TokenOnlySerializer(serializers.Serializer[Any]):
    token = serializers.CharField()


class SessionSerializer(serializers.ModelSerializer[OutstandingToken]):
    user_agent = serializers.CharField(source="metadata.user_agent", default="", read_only=True)
    client_ip = serializers.CharField(source="metadata.client_ip", default="", read_only=True)
    last_used_at = serializers.DateTimeField(
        source="metadata.last_used_at", default=None, read_only=True
    )

    class Meta:
        model = OutstandingToken
        fields = ["id", "created_at", "expires_at", "user_agent", "client_ip", "last_used_at"]
        read_only_fields = fields


class TokenPairSerializer(serializers.Serializer[Any]):
    access = serializers.CharField(read_only=True)
    refresh = serializers.CharField(read_only=True)


class ExportCollectionSerializer(serializers.Serializer[Any]):
    id = serializers.IntegerField(read_only=True)
    name = serializers.CharField(read_only=True)
    slug = serializers.CharField(read_only=True)
    is_public = serializers.BooleanField(read_only=True)
    app_ids = serializers.ListField(child=serializers.IntegerField(), read_only=True)
    created_at = serializers.DateTimeField(read_only=True)


class ExportScriptRunSerializer(serializers.Serializer[Any]):
    id = serializers.IntegerField(read_only=True)
    platform = serializers.CharField(read_only=True)
    app_ids = serializers.ListField(child=serializers.IntegerField(), read_only=True)
    created_at = serializers.DateTimeField(read_only=True)


class DataExportSerializer(serializers.Serializer[Any]):
    user = UserSerializer(read_only=True)
    collections = ExportCollectionSerializer(many=True, read_only=True)
    favorites = serializers.ListField(child=serializers.IntegerField(), read_only=True)
    script_runs = ExportScriptRunSerializer(many=True, read_only=True)
