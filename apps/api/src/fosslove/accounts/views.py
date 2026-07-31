from __future__ import annotations

from django.conf import settings
from django.db import transaction
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.serializers import TokenBlacklistSerializer, TokenRefreshSerializer
from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken, OutstandingToken

from fosslove.accounts import emails
from fosslove.accounts.models import User
from fosslove.accounts.serializers import (
    ChangePasswordSerializer,
    DataExportSerializer,
    EmailChangeRequestSerializer,
    EmailSerializer,
    LoginSerializer,
    PasswordResetConfirmSerializer,
    RefreshSerializer,
    RegisterSerializer,
    SessionSerializer,
    TokenOnlySerializer,
    TokenPairSerializer,
    UidTokenSerializer,
    UserSerializer,
    UserUpdateSerializer,
)
from fosslove.accounts.services import (
    active_sessions,
    attach_session_metadata,
    export_user_data,
    issue_tokens,
    revoke_all_sessions,
)
from fosslove.accounts.tokens import (
    email_verification_token,
    password_reset_token,
    read_email_change_token,
    user_from_uid,
)
from fosslove.activity.actions import Action
from fosslove.activity.models import ActivityStatus
from fosslove.activity.recorder import record
from fosslove.core.auth import current_user
from fosslove.core.exceptions import BadRequestError, PermissionDeniedError
from fosslove.core.serializers import MessageSerializer
from fosslove.core.throttling import AuthRateThrottle
from fosslove.siteconfig.models import SiteConfiguration

INVALID_LINK = "This link is invalid or has expired."


def _form_email(request: Request) -> str:
    payload = request.data if isinstance(request.data, dict) else {}
    return str(payload.get("email", ""))


class RegisterView(APIView):
    throttle_classes = [AuthRateThrottle]

    @extend_schema(tags=["Auth"], request=RegisterSerializer, responses={201: UserSerializer})
    @transaction.atomic
    def post(self, request: Request) -> Response:
        config = SiteConfiguration.get_solo()
        if not config.effective_registration_enabled:
            raise PermissionDeniedError(
                "New account registration is currently disabled.", code="registration_disabled"
            )
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email_enabled = config.effective_email_enabled
        user = serializer.save(is_verified=not email_enabled)
        if email_enabled:
            transaction.on_commit(lambda: emails.send_verification_email(user))
        record(
            request._request,
            Action.REGISTER,
            actor=user,
            target_type="user",
            target_id=str(user.pk),
        )
        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    throttle_classes = [AuthRateThrottle]

    @extend_schema(tags=["Auth"], request=LoginSerializer, responses={200: TokenPairSerializer})
    def post(self, request: Request) -> Response:
        serializer = LoginSerializer(data=request.data, context={"request": request})
        if not serializer.is_valid():
            record(
                request._request,
                Action.LOGIN_FAILED,
                status=ActivityStatus.FAILURE,
                target_type="email",
                target_id=_form_email(request)[:80],
            )
            serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]
        tokens = issue_tokens(user, request._request)
        record(
            request._request,
            Action.LOGIN,
            actor=user,
            target_type="email",
            target_id=user.email[:80],
        )
        return Response(tokens)


class RefreshView(APIView):
    throttle_classes = [AuthRateThrottle]

    @extend_schema(tags=["Auth"], request=RefreshSerializer, responses={200: TokenPairSerializer})
    def post(self, request: Request) -> Response:
        serializer = TokenRefreshSerializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
        except TokenError as exc:
            raise InvalidToken(str(exc)) from exc
        tokens = serializer.validated_data
        if "refresh" in tokens:
            attach_session_metadata(tokens["refresh"], request._request)
        record(request._request, Action.TOKEN_REFRESH)
        return Response(tokens)


class LogoutView(APIView):
    throttle_classes = [AuthRateThrottle]

    @extend_schema(tags=["Auth"], request=RefreshSerializer, responses={200: MessageSerializer})
    def post(self, request: Request) -> Response:
        serializer = TokenBlacklistSerializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
        except TokenError:
            return Response({"message": "Logged out."})
        record(request._request, Action.LOGOUT)
        return Response({"message": "Logged out."})


class VerifyEmailView(APIView):
    throttle_classes = [AuthRateThrottle]

    @extend_schema(tags=["Auth"], request=UidTokenSerializer, responses={200: MessageSerializer})
    def post(self, request: Request) -> Response:
        serializer = UidTokenSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = user_from_uid(serializer.validated_data["uid"])
        if user is None or not email_verification_token.check_token(
            user, serializer.validated_data["token"]
        ):
            raise BadRequestError(INVALID_LINK, code="invalid_token")
        User.objects.filter(pk=user.pk).update(is_verified=True)
        record(request._request, Action.EMAIL_VERIFY, actor=user)
        return Response({"message": "Email verified."})


class ResendVerificationView(APIView):
    throttle_classes = [AuthRateThrottle]

    @extend_schema(tags=["Auth"], request=EmailSerializer, responses={200: MessageSerializer})
    def post(self, request: Request) -> Response:
        serializer = EmailSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        message = "If the account exists and is unverified, an email has been sent."
        if not SiteConfiguration.get_solo().effective_email_enabled:
            return Response({"message": message})
        user = User.objects.filter(
            email__iexact=serializer.validated_data["email"], is_verified=False
        ).first()
        if user is not None:
            emails.send_verification_email(user)
        return Response({"message": message})


class PasswordResetView(APIView):
    throttle_classes = [AuthRateThrottle]

    @extend_schema(tags=["Auth"], request=EmailSerializer, responses={200: MessageSerializer})
    def post(self, request: Request) -> Response:
        serializer = EmailSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        message = "If the account exists, a reset email has been sent."
        if SiteConfiguration.get_solo().effective_email_enabled:
            user = User.objects.filter(
                email__iexact=serializer.validated_data["email"], is_active=True
            ).first()
            if user is not None:
                emails.send_password_reset_email(user)
        record(
            request._request,
            Action.PASSWORD_RESET_REQUEST,
            target_type="email",
            target_id=serializer.validated_data["email"][:80],
        )
        return Response({"message": message})


class PasswordResetConfirmView(APIView):
    throttle_classes = [AuthRateThrottle]

    @extend_schema(
        tags=["Auth"], request=PasswordResetConfirmSerializer, responses={200: MessageSerializer}
    )
    @transaction.atomic
    def post(self, request: Request) -> Response:
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = user_from_uid(serializer.validated_data["uid"])
        if user is None or not password_reset_token.check_token(
            user, serializer.validated_data["token"]
        ):
            raise BadRequestError(INVALID_LINK, code="invalid_token")
        user.set_password(serializer.validated_data["new_password"])
        user.save(update_fields=["password", "updated_at"])
        revoke_all_sessions(user)
        record(request._request, Action.PASSWORD_RESET, actor=user)
        return Response({"message": "Password updated. Please log in."})


class EmailChangeConfirmView(APIView):
    throttle_classes = [AuthRateThrottle]

    @extend_schema(tags=["Auth"], request=TokenOnlySerializer, responses={200: MessageSerializer})
    @transaction.atomic
    def post(self, request: Request) -> Response:
        serializer = TokenOnlySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        result = read_email_change_token(
            serializer.validated_data["token"], settings.EMAIL_TOKEN_TTL_SECONDS
        )
        if result is None:
            raise BadRequestError(INVALID_LINK, code="invalid_token")
        user, new_email = result
        if User.objects.filter(email__iexact=new_email).exclude(pk=user.pk).exists():
            raise BadRequestError("An account with this email already exists.", code="email_taken")
        user.email = new_email
        user.is_verified = True
        user.save(update_fields=["email", "is_verified", "updated_at"])
        revoke_all_sessions(user)
        record(request._request, Action.EMAIL_CHANGE, actor=user)
        return Response({"message": "Email address updated. Please log in again."})


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(tags=["Users"], responses={200: UserSerializer})
    def get(self, request: Request) -> Response:
        return Response(UserSerializer(current_user(request)).data)

    @extend_schema(tags=["Users"], request=UserUpdateSerializer, responses={200: UserSerializer})
    def patch(self, request: Request) -> Response:
        serializer = UserUpdateSerializer(current_user(request), data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        record(request._request, Action.PROFILE_UPDATE)
        return Response(UserSerializer(user).data)

    @extend_schema(tags=["Users"], responses={204: None})
    def delete(self, request: Request) -> Response:
        user = current_user(request)
        user_id = str(user.pk)
        user.delete()
        record(
            request._request,
            Action.ACCOUNT_DELETE,
            actor=None,
            target_type="user",
            target_id=user_id,
        )
        return Response(status=status.HTTP_204_NO_CONTENT)


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]
    throttle_classes = [AuthRateThrottle]

    @extend_schema(
        tags=["Users"], request=ChangePasswordSerializer, responses={200: MessageSerializer}
    )
    @transaction.atomic
    def post(self, request: Request) -> Response:
        serializer = ChangePasswordSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        user = current_user(request)
        user.set_password(serializer.validated_data["new_password"])
        user.save(update_fields=["password", "updated_at"])
        revoke_all_sessions(user)
        record(request._request, Action.PASSWORD_CHANGE, actor=user)
        return Response({"message": "Password changed. Please log in again."})


class EmailChangeRequestView(APIView):
    permission_classes = [IsAuthenticated]
    throttle_classes = [AuthRateThrottle]

    @extend_schema(
        tags=["Users"], request=EmailChangeRequestSerializer, responses={200: MessageSerializer}
    )
    @transaction.atomic
    def post(self, request: Request) -> Response:
        serializer = EmailChangeRequestSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        new_email = serializer.validated_data["new_email"]
        user = current_user(request)
        record(
            request._request,
            Action.EMAIL_CHANGE_REQUEST,
            target_type="email",
            target_id=new_email[:80],
        )
        if not SiteConfiguration.get_solo().effective_email_enabled:
            user.email = new_email
            user.is_verified = True
            user.save(update_fields=["email", "is_verified", "updated_at"])
            revoke_all_sessions(user)
            return Response({"message": "Email address updated. Please log in again."})
        emails.send_email_change_email(user, new_email)
        return Response({"message": "Check your new email address to confirm the change."})


class SessionListView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(tags=["Users"], responses={200: SessionSerializer(many=True)})
    def get(self, request: Request) -> Response:
        return Response(SessionSerializer(active_sessions(current_user(request)), many=True).data)


class SessionDetailView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(tags=["Users"], responses={204: None})
    def delete(self, request: Request, pk: int) -> Response:
        token = OutstandingToken.objects.filter(pk=pk, user=current_user(request)).first()
        if token is None:
            raise BadRequestError("Session not found.", code="not_found")
        BlacklistedToken.objects.get_or_create(token=token)
        record(
            request._request,
            Action.SESSION_REVOKE,
            target_type="session",
            target_id=str(pk),
        )
        return Response(status=status.HTTP_204_NO_CONTENT)


class DataExportView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(tags=["Users"], responses={200: DataExportSerializer})
    def get(self, request: Request) -> Response:
        user = current_user(request)
        payload = export_user_data(user)
        record(request._request, Action.DATA_EXPORT)
        return Response({"user": UserSerializer(user).data, **payload})
