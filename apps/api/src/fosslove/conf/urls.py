from __future__ import annotations

from django.conf import settings
from django.contrib import admin
from django.urls import URLPattern, URLResolver, include, path
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)

from fosslove.accounts.urls import urlpatterns as account_urls
from fosslove.activity.views import AdminActivityListView
from fosslove.catalog.urls import admin_urlpatterns as catalog_admin_urls
from fosslove.catalog.urls import urlpatterns as catalog_urls
from fosslove.core.views import HealthView, ReadinessView, RootView
from fosslove.siteconfig.views import CleanupTokensView, SiteConfigurationView
from fosslove.userdata.urls import urlpatterns as userdata_urls

admin_patterns: list[URLPattern | URLResolver] = [
    path("activity", AdminActivityListView.as_view(), name="admin-activity"),
    path("settings", SiteConfigurationView.as_view(), name="admin-settings"),
    path("cleanup-tokens", CleanupTokensView.as_view(), name="admin-cleanup-tokens"),
    *catalog_admin_urls,
]

docs_patterns: list[URLPattern | URLResolver] = [
    path("schema", SpectacularAPIView.as_view(), name="schema"),
    path("docs", SpectacularSwaggerView.as_view(url_name="v1:schema"), name="swagger-ui"),
    path("redoc", SpectacularRedocView.as_view(url_name="v1:schema"), name="redoc"),
]

api_v1: list[URLPattern | URLResolver] = [
    *account_urls,
    *catalog_urls,
    *userdata_urls,
    path("admin/", include(admin_patterns)),
    *docs_patterns,
]

urlpatterns: list[URLPattern | URLResolver] = [
    path("", RootView.as_view(), name="root"),
    path("health", HealthView.as_view(), name="health"),
    path("health/ready", ReadinessView.as_view(), name="health-ready"),
    path(f"{settings.API_V1_PREFIX}/", include((api_v1, "v1"))),
    path("django-admin/", admin.site.urls),
    path("", include("django_prometheus.urls")),
]
