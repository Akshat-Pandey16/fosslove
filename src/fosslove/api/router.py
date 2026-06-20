from __future__ import annotations

from fastapi import APIRouter

from fosslove.api.v1 import admin, auth, catalog, collections, favorites, scripts, users

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(catalog.router)
api_router.include_router(collections.router)
api_router.include_router(favorites.router)
api_router.include_router(scripts.router)
api_router.include_router(admin.router)
