from __future__ import annotations

from django.urls import URLPattern, URLResolver, path

from fosslove.catalog import admin_views, views

urlpatterns: list[URLPattern | URLResolver] = [
    path("categories", views.CategoryListView.as_view(), name="category-list"),
    path(
        "categories/by-slug/<slug:slug>",
        views.CategoryBySlugView.as_view(),
        name="category-by-slug",
    ),
    path("categories/<int:pk>", views.CategoryDetailView.as_view(), name="category-detail"),
    path("apps", views.AppListView.as_view(), name="app-list"),
    path(
        "apps/by-slug/<str:platform>/<slug:slug>",
        views.AppBySlugView.as_view(),
        name="app-by-slug",
    ),
    path("apps/<int:pk>", views.AppDetailView.as_view(), name="app-detail"),
]

admin_urlpatterns: list[URLPattern | URLResolver] = [
    path("categories", admin_views.AdminCategoryListView.as_view(), name="admin-category-list"),
    path(
        "categories/<int:pk>",
        admin_views.AdminCategoryDetailView.as_view(),
        name="admin-category-detail",
    ),
    path("apps", admin_views.AdminAppListView.as_view(), name="admin-app-list"),
    path("apps/import", admin_views.AdminAppImportView.as_view(), name="admin-app-import"),
    path("apps/<int:pk>", admin_views.AdminAppDetailView.as_view(), name="admin-app-detail"),
    path(
        "catalog/export",
        admin_views.AdminCatalogExportView.as_view(),
        name="admin-catalog-export",
    ),
    path(
        "recompute-counts",
        admin_views.AdminRecomputeCountsView.as_view(),
        name="admin-recompute-counts",
    ),
]
