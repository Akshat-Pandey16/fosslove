from __future__ import annotations

from typing import Any

from rest_framework import serializers


class MessageSerializer(serializers.Serializer[Any]):
    message = serializers.CharField(read_only=True)


class ServiceInfoSerializer(serializers.Serializer[Any]):
    service = serializers.CharField(read_only=True)
    version = serializers.CharField(read_only=True)
    status = serializers.CharField(read_only=True)


class HealthSerializer(serializers.Serializer[Any]):
    status = serializers.CharField(read_only=True)


class ReadinessSerializer(serializers.Serializer[Any]):
    status = serializers.DictField(child=serializers.CharField(), read_only=True)
