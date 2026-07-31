from __future__ import annotations

from django.urls import path

from fosslove.userdata import views

urlpatterns = [
    path("collections", views.CollectionListView.as_view(), name="collection-list"),
    path("collections/public", views.PublicCollectionListView.as_view(), name="collection-public"),
    path("collections/<int:pk>", views.CollectionDetailView.as_view(), name="collection-detail"),
    path("collections/<int:pk>/apps", views.CollectionAppsView.as_view(), name="collection-apps"),
    path("favorites", views.FavoriteListView.as_view(), name="favorite-list"),
    path("favorites/ids", views.FavoriteIdsView.as_view(), name="favorite-ids"),
    path("favorites/<int:app_id>", views.FavoriteDetailView.as_view(), name="favorite-detail"),
    path("scripts/generate", views.ScriptGenerateView.as_view(), name="script-generate"),
    path("scripts/history", views.ScriptHistoryView.as_view(), name="script-history"),
]
