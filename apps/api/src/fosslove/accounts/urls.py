from __future__ import annotations

from django.urls import include, path

from fosslove.accounts import views

auth_patterns = [
    path("register", views.RegisterView.as_view(), name="register"),
    path("login", views.LoginView.as_view(), name="login"),
    path("refresh", views.RefreshView.as_view(), name="refresh"),
    path("logout", views.LogoutView.as_view(), name="logout"),
    path("verify-email", views.VerifyEmailView.as_view(), name="verify-email"),
    path("resend-verification", views.ResendVerificationView.as_view(), name="resend-verification"),
    path("password-reset", views.PasswordResetView.as_view(), name="password-reset"),
    path(
        "password-reset/confirm",
        views.PasswordResetConfirmView.as_view(),
        name="password-reset-confirm",
    ),
    path(
        "email-change/confirm",
        views.EmailChangeConfirmView.as_view(),
        name="email-change-confirm",
    ),
]

user_patterns = [
    path("", views.MeView.as_view(), name="me"),
    path("change-password", views.ChangePasswordView.as_view(), name="change-password"),
    path("email", views.EmailChangeRequestView.as_view(), name="email-change"),
    path("sessions", views.SessionListView.as_view(), name="sessions"),
    path("sessions/<int:pk>", views.SessionDetailView.as_view(), name="session-detail"),
    path("export", views.DataExportView.as_view(), name="export"),
]

urlpatterns = [
    path("auth/", include((auth_patterns, "auth"))),
    path("user/", include((user_patterns, "user"))),
]
