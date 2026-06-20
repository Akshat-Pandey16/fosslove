from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = '4166f2eba13d'
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS pg_trgm")
    op.create_table('categories',
    sa.Column('id', sa.BigInteger(), autoincrement=True, nullable=False),
    sa.Column('name', sa.String(length=100), nullable=False),
    sa.Column('slug', sa.String(length=120), nullable=False),
    sa.Column('description', sa.Text(), nullable=True),
    sa.Column('icon_url', sa.String(length=500), nullable=True),
    sa.Column('windows_app_count', sa.Integer(), server_default=sa.text('0'), nullable=False),
    sa.Column('linux_app_count', sa.Integer(), server_default=sa.text('0'), nullable=False),
    sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('updated_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.CheckConstraint('linux_app_count >= 0', name=op.f('ck_categories_linux_count_nonneg')),
    sa.CheckConstraint('windows_app_count >= 0', name=op.f('ck_categories_windows_count_nonneg')),
    sa.PrimaryKeyConstraint('id', name=op.f('pk_categories')),
    sa.UniqueConstraint('name', name=op.f('uq_categories_name')),
    sa.UniqueConstraint('slug', name=op.f('uq_categories_slug'))
    )
    op.create_table('users',
    sa.Column('id', sa.Uuid(), nullable=False),
    sa.Column('email', sa.String(length=320), nullable=False),
    sa.Column('hashed_password', sa.String(length=255), nullable=False),
    sa.Column('full_name', sa.String(length=200), nullable=True),
    sa.Column('role', sa.Enum('user', 'admin', name='userrole', native_enum=False), server_default='user', nullable=False),
    sa.Column('is_active', sa.Boolean(), server_default=sa.text('true'), nullable=False),
    sa.Column('is_verified', sa.Boolean(), server_default=sa.text('false'), nullable=False),
    sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('updated_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.PrimaryKeyConstraint('id', name=op.f('pk_users')),
    sa.UniqueConstraint('email', name=op.f('uq_users_email'))
    )
    op.create_table('apps',
    sa.Column('id', sa.BigInteger(), autoincrement=True, nullable=False),
    sa.Column('category_id', sa.BigInteger(), nullable=False),
    sa.Column('platform', sa.Enum('windows', 'linux', name='platform', native_enum=False), nullable=False),
    sa.Column('name', sa.String(length=200), nullable=False),
    sa.Column('slug', sa.String(length=220), nullable=False),
    sa.Column('summary', sa.String(length=300), nullable=True),
    sa.Column('description', sa.Text(), nullable=True),
    sa.Column('homepage_url', sa.String(length=500), nullable=True),
    sa.Column('license', sa.String(length=100), nullable=True),
    sa.Column('is_active', sa.Boolean(), server_default=sa.text('true'), nullable=False),
    sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('updated_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['category_id'], ['categories.id'], name=op.f('fk_apps_category_id_categories'), ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id', name=op.f('pk_apps')),
    sa.UniqueConstraint('category_id', 'platform', 'name', name='uq_app_category_platform_name'),
    sa.UniqueConstraint('platform', 'slug', name='uq_app_platform_slug')
    )
    op.create_index(op.f('ix_apps_category_id'), 'apps', ['category_id'], unique=False)
    op.create_index('ix_apps_name_trgm', 'apps', ['name'], unique=False, postgresql_using='gin', postgresql_ops={'name': 'gin_trgm_ops'})
    op.create_index('ix_apps_platform_category_name', 'apps', ['platform', 'category_id', 'name'], unique=False)
    op.create_index('ix_apps_platform_name', 'apps', ['platform', 'name'], unique=False)
    op.create_index('ix_apps_summary_trgm', 'apps', ['summary'], unique=False, postgresql_using='gin', postgresql_ops={'summary': 'gin_trgm_ops'})
    op.create_table('collections',
    sa.Column('id', sa.BigInteger(), autoincrement=True, nullable=False),
    sa.Column('user_id', sa.Uuid(), nullable=False),
    sa.Column('name', sa.String(length=120), nullable=False),
    sa.Column('slug', sa.String(length=140), nullable=False),
    sa.Column('description', sa.Text(), nullable=True),
    sa.Column('is_public', sa.Boolean(), server_default=sa.text('false'), nullable=False),
    sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('updated_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], name=op.f('fk_collections_user_id_users'), ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id', name=op.f('pk_collections')),
    sa.UniqueConstraint('user_id', 'slug', name='uq_collection_user_slug')
    )
    op.create_index('ix_collections_public_created', 'collections', ['created_at'], unique=False, postgresql_where=sa.text('is_public'))
    op.create_index(op.f('ix_collections_user_id'), 'collections', ['user_id'], unique=False)
    op.create_table('refresh_tokens',
    sa.Column('id', sa.Uuid(), nullable=False),
    sa.Column('user_id', sa.Uuid(), nullable=False),
    sa.Column('jti', sa.String(length=64), nullable=False),
    sa.Column('expires_at', sa.TIMESTAMP(timezone=True), nullable=False),
    sa.Column('revoked_at', sa.TIMESTAMP(timezone=True), nullable=True),
    sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], name=op.f('fk_refresh_tokens_user_id_users'), ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id', name=op.f('pk_refresh_tokens')),
    sa.UniqueConstraint('jti', name=op.f('uq_refresh_tokens_jti'))
    )
    op.create_index('ix_refresh_tokens_expires_at', 'refresh_tokens', ['expires_at'], unique=False)
    op.create_index(op.f('ix_refresh_tokens_user_id'), 'refresh_tokens', ['user_id'], unique=False)
    op.create_table('script_runs',
    sa.Column('id', sa.BigInteger(), autoincrement=True, nullable=False),
    sa.Column('user_id', sa.Uuid(), nullable=True),
    sa.Column('platform', sa.Enum('windows', 'linux', name='platform', native_enum=False), nullable=False),
    sa.Column('app_ids', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
    sa.Column('app_count', sa.Integer(), nullable=False),
    sa.Column('client_ip', sa.String(length=64), nullable=True),
    sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.CheckConstraint('app_count >= 0', name=op.f('ck_script_runs_app_count_nonneg')),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], name=op.f('fk_script_runs_user_id_users'), ondelete='SET NULL'),
    sa.PrimaryKeyConstraint('id', name=op.f('pk_script_runs'))
    )
    op.create_index('ix_script_runs_user_created', 'script_runs', ['user_id', 'created_at'], unique=False)
    op.create_table('verification_tokens',
    sa.Column('id', sa.Uuid(), nullable=False),
    sa.Column('user_id', sa.Uuid(), nullable=False),
    sa.Column('token_hash', sa.String(length=64), nullable=False),
    sa.Column('purpose', sa.Enum('email_verify', 'password_reset', name='tokenpurpose', native_enum=False), nullable=False),
    sa.Column('expires_at', sa.TIMESTAMP(timezone=True), nullable=False),
    sa.Column('used_at', sa.TIMESTAMP(timezone=True), nullable=True),
    sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], name=op.f('fk_verification_tokens_user_id_users'), ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id', name=op.f('pk_verification_tokens')),
    sa.UniqueConstraint('token_hash', name=op.f('uq_verification_tokens_token_hash'))
    )
    op.create_index('ix_verification_tokens_expires_at', 'verification_tokens', ['expires_at'], unique=False)
    op.create_index(op.f('ix_verification_tokens_user_id'), 'verification_tokens', ['user_id'], unique=False)
    op.create_table('collection_apps',
    sa.Column('collection_id', sa.BigInteger(), nullable=False),
    sa.Column('app_id', sa.BigInteger(), nullable=False),
    sa.Column('position', sa.Integer(), server_default=sa.text('0'), nullable=False),
    sa.Column('added_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.CheckConstraint('position >= 0', name=op.f('ck_collection_apps_position_nonneg')),
    sa.ForeignKeyConstraint(['app_id'], ['apps.id'], name=op.f('fk_collection_apps_app_id_apps'), ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['collection_id'], ['collections.id'], name=op.f('fk_collection_apps_collection_id_collections'), ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('collection_id', 'app_id', name=op.f('pk_collection_apps'))
    )
    op.create_index('ix_collection_apps_app', 'collection_apps', ['app_id'], unique=False)
    op.create_table('favorites',
    sa.Column('user_id', sa.Uuid(), nullable=False),
    sa.Column('app_id', sa.BigInteger(), nullable=False),
    sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['app_id'], ['apps.id'], name=op.f('fk_favorites_app_id_apps'), ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], name=op.f('fk_favorites_user_id_users'), ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('user_id', 'app_id', name=op.f('pk_favorites'))
    )
    op.create_index('ix_favorites_app', 'favorites', ['app_id'], unique=False)
    op.create_table('package_references',
    sa.Column('id', sa.BigInteger(), autoincrement=True, nullable=False),
    sa.Column('app_id', sa.BigInteger(), nullable=False),
    sa.Column('manager', sa.Enum('winget', 'msstore', 'apt', 'dnf', 'pacman', 'flatpak', 'snap', 'direct', name='packagemanager', native_enum=False), nullable=False),
    sa.Column('identifier', sa.String(length=500), nullable=False),
    sa.Column('install_args', sa.String(length=500), nullable=True),
    sa.Column('priority', sa.Integer(), server_default=sa.text('100'), nullable=False),
    sa.Column('extra', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('updated_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.CheckConstraint('priority >= 0', name=op.f('ck_package_references_priority_nonneg')),
    sa.ForeignKeyConstraint(['app_id'], ['apps.id'], name=op.f('fk_package_references_app_id_apps'), ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id', name=op.f('pk_package_references')),
    sa.UniqueConstraint('app_id', 'manager', name='uq_package_app_manager')
    )
    op.create_index(op.f('ix_package_references_app_id'), 'package_references', ['app_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_package_references_app_id'), table_name='package_references')
    op.drop_table('package_references')
    op.drop_index('ix_favorites_app', table_name='favorites')
    op.drop_table('favorites')
    op.drop_index('ix_collection_apps_app', table_name='collection_apps')
    op.drop_table('collection_apps')
    op.drop_index(op.f('ix_verification_tokens_user_id'), table_name='verification_tokens')
    op.drop_index('ix_verification_tokens_expires_at', table_name='verification_tokens')
    op.drop_table('verification_tokens')
    op.drop_index('ix_script_runs_user_created', table_name='script_runs')
    op.drop_table('script_runs')
    op.drop_index(op.f('ix_refresh_tokens_user_id'), table_name='refresh_tokens')
    op.drop_index('ix_refresh_tokens_expires_at', table_name='refresh_tokens')
    op.drop_table('refresh_tokens')
    op.drop_index(op.f('ix_collections_user_id'), table_name='collections')
    op.drop_index('ix_collections_public_created', table_name='collections', postgresql_where=sa.text('is_public'))
    op.drop_table('collections')
    op.drop_index('ix_apps_summary_trgm', table_name='apps', postgresql_using='gin', postgresql_ops={'summary': 'gin_trgm_ops'})
    op.drop_index('ix_apps_platform_name', table_name='apps')
    op.drop_index('ix_apps_platform_category_name', table_name='apps')
    op.drop_index('ix_apps_name_trgm', table_name='apps', postgresql_using='gin', postgresql_ops={'name': 'gin_trgm_ops'})
    op.drop_index(op.f('ix_apps_category_id'), table_name='apps')
    op.drop_table('apps')
    op.drop_table('users')
    op.drop_table('categories')
    op.execute("DROP EXTENSION IF EXISTS pg_trgm")
