from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = 'c3a1f2b4d5e6'
down_revision: str | None = '435fff87e3ff'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS citext")

    op.alter_column(
        'users',
        'email',
        type_=postgresql.CITEXT(),
        existing_type=sa.String(length=320),
        existing_nullable=False,
        postgresql_using='email::citext',
    )

    op.add_column(
        'verification_tokens',
        sa.Column('new_email', postgresql.CITEXT(), nullable=True),
    )

    op.add_column('refresh_tokens', sa.Column('user_agent', sa.String(length=400), nullable=True))
    op.add_column('refresh_tokens', sa.Column('client_ip', sa.String(length=64), nullable=True))
    op.add_column(
        'refresh_tokens',
        sa.Column('last_used_at', sa.TIMESTAMP(timezone=True), nullable=True),
    )

    op.create_unique_constraint('uq_collection_user_name', 'collections', ['user_id', 'name'])

    op.create_index(
        'ix_apps_active_platform_category_name',
        'apps',
        ['platform', 'category_id', 'name'],
        unique=False,
        postgresql_where=sa.text('is_active'),
    )

    op.create_table(
        'activity_logs',
        sa.Column('id', sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column('user_id', sa.Uuid(), nullable=True),
        sa.Column('action', sa.String(length=80), nullable=False),
        sa.Column('status', sa.String(length=20), server_default=sa.text("'ok'"), nullable=False),
        sa.Column('target_type', sa.String(length=60), nullable=True),
        sa.Column('target_id', sa.String(length=80), nullable=True),
        sa.Column('client_ip', sa.String(length=64), nullable=True),
        sa.Column('request_id', sa.String(length=64), nullable=True),
        sa.Column('user_agent', sa.String(length=400), nullable=True),
        sa.Column('detail', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column(
            'created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False
        ),
        sa.ForeignKeyConstraint(
            ['user_id'],
            ['users.id'],
            name=op.f('fk_activity_logs_user_id_users'),
            ondelete='SET NULL',
        ),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_activity_logs')),
    )
    op.create_index('ix_activity_logs_created', 'activity_logs', ['created_at'], unique=False)
    op.create_index(
        'ix_activity_logs_action_created', 'activity_logs', ['action', 'created_at'], unique=False
    )
    op.create_index(
        'ix_activity_logs_user_created', 'activity_logs', ['user_id', 'created_at'], unique=False
    )
    op.create_index(
        'ix_activity_logs_target', 'activity_logs', ['target_type', 'target_id'], unique=False
    )


def downgrade() -> None:
    op.drop_index('ix_activity_logs_target', table_name='activity_logs')
    op.drop_index('ix_activity_logs_user_created', table_name='activity_logs')
    op.drop_index('ix_activity_logs_action_created', table_name='activity_logs')
    op.drop_index('ix_activity_logs_created', table_name='activity_logs')
    op.drop_table('activity_logs')

    op.drop_index(
        'ix_apps_active_platform_category_name',
        table_name='apps',
        postgresql_where=sa.text('is_active'),
    )
    op.drop_constraint('uq_collection_user_name', 'collections', type_='unique')

    op.drop_column('refresh_tokens', 'last_used_at')
    op.drop_column('refresh_tokens', 'client_ip')
    op.drop_column('refresh_tokens', 'user_agent')
    op.drop_column('verification_tokens', 'new_email')

    op.alter_column(
        'users',
        'email',
        type_=sa.String(length=320),
        existing_type=postgresql.CITEXT(),
        existing_nullable=False,
        postgresql_using='email::varchar(320)',
    )
