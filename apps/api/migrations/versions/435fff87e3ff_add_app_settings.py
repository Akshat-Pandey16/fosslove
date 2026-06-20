from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op


revision: str = '435fff87e3ff'
down_revision: str | None = '4166f2eba13d'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table('app_settings',
    sa.Column('id', sa.SmallInteger(), server_default=sa.text('1'), autoincrement=False, nullable=False),
    sa.Column('registration_enabled', sa.Boolean(), nullable=True),
    sa.Column('email_enabled', sa.Boolean(), nullable=True),
    sa.Column('rate_limit_enabled', sa.Boolean(), nullable=True),
    sa.Column('rate_limit_default', sa.String(length=50), nullable=True),
    sa.Column('rate_limit_auth', sa.String(length=50), nullable=True),
    sa.Column('email_backend', sa.String(length=10), nullable=True),
    sa.Column('email_from', sa.String(length=255), nullable=True),
    sa.Column('smtp_host', sa.String(length=255), nullable=True),
    sa.Column('smtp_port', sa.Integer(), nullable=True),
    sa.Column('smtp_user', sa.String(length=255), nullable=True),
    sa.Column('smtp_password', sa.String(length=500), nullable=True),
    sa.Column('smtp_use_tls', sa.Boolean(), nullable=True),
    sa.Column('project_name', sa.String(length=100), nullable=True),
    sa.Column('frontend_base_url', sa.String(length=500), nullable=True),
    sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('updated_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.CheckConstraint("email_backend IN ('console', 'smtp')", name=op.f('ck_app_settings_email_backend_valid')),
    sa.CheckConstraint('id = 1', name=op.f('ck_app_settings_singleton')),
    sa.CheckConstraint('smtp_port IS NULL OR smtp_port BETWEEN 1 AND 65535', name=op.f('ck_app_settings_smtp_port_range')),
    sa.PrimaryKeyConstraint('id', name=op.f('pk_app_settings'))
    )


def downgrade() -> None:
    op.drop_table('app_settings')
