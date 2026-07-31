from __future__ import annotations

from rest_framework import serializers

from fosslove.activity.models import ActivityLog


class ActivityLogSerializer(serializers.ModelSerializer[ActivityLog]):
    class Meta:
        model = ActivityLog
        fields = [
            "id",
            "user_id",
            "action",
            "status",
            "target_type",
            "target_id",
            "client_ip",
            "request_id",
            "user_agent",
            "detail",
            "created_at",
        ]
        read_only_fields = fields
