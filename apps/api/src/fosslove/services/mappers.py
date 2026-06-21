from __future__ import annotations

from fosslove.db.models.activity import ActivityLog
from fosslove.db.models.catalog import App, Category, PackageReference
from fosslove.db.models.user import RefreshToken, User
from fosslove.db.models.userdata import Collection, ScriptRun
from fosslove.schemas.activity import ActivityLogRead
from fosslove.schemas.catalog import (
    AppListItem,
    AppRead,
    CategoryRead,
    PackageReferenceRead,
)
from fosslove.schemas.collection import CollectionDetail, CollectionItemRead, CollectionRead
from fosslove.schemas.script import ScriptRunRead
from fosslove.schemas.user import SessionRead, UserRead


def to_user_read(user: User) -> UserRead:
    return UserRead.model_validate(user)


def to_session_read(token: RefreshToken) -> SessionRead:
    return SessionRead.model_validate(token)


def to_activity_read(log: ActivityLog) -> ActivityLogRead:
    return ActivityLogRead.model_validate(log)


def to_category_read(category: Category) -> CategoryRead:
    return CategoryRead.model_validate(category)


def to_package_ref_read(ref: PackageReference) -> PackageReferenceRead:
    return PackageReferenceRead.model_validate(ref)


def to_app_list_item(app: App) -> AppListItem:
    return AppListItem(
        id=app.id,
        category_id=app.category_id,
        category_name=app.category.name,
        category_slug=app.category.slug,
        platform=app.platform,
        name=app.name,
        slug=app.slug,
        summary=app.summary,
        homepage_url=app.homepage_url,
        is_active=app.is_active,
    )


def to_app_read(app: App) -> AppRead:
    refs = sorted(app.package_refs, key=lambda ref: (ref.priority, ref.manager.value))
    return AppRead(
        id=app.id,
        category_id=app.category_id,
        category_name=app.category.name,
        category_slug=app.category.slug,
        platform=app.platform,
        name=app.name,
        slug=app.slug,
        summary=app.summary,
        homepage_url=app.homepage_url,
        is_active=app.is_active,
        description=app.description,
        license=app.license,
        package_refs=[to_package_ref_read(ref) for ref in refs],
        created_at=app.created_at,
        updated_at=app.updated_at,
    )


def to_collection_read(collection: Collection, item_count: int) -> CollectionRead:
    return CollectionRead(
        id=collection.id,
        user_id=collection.user_id,
        name=collection.name,
        slug=collection.slug,
        description=collection.description,
        is_public=collection.is_public,
        item_count=item_count,
        created_at=collection.created_at,
        updated_at=collection.updated_at,
    )


def to_collection_detail(collection: Collection) -> CollectionDetail:
    items = [
        CollectionItemRead(app=to_app_list_item(link.app), position=link.position)
        for link in collection.items
    ]
    return CollectionDetail(
        id=collection.id,
        user_id=collection.user_id,
        name=collection.name,
        slug=collection.slug,
        description=collection.description,
        is_public=collection.is_public,
        item_count=len(items),
        created_at=collection.created_at,
        updated_at=collection.updated_at,
        items=items,
    )


def to_script_run_read(run: ScriptRun) -> ScriptRunRead:
    return ScriptRunRead.model_validate(run)
