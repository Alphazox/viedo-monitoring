"""globally-unique user email, per-org-unique site name

Revision ID: 0002_email_and_site_uniqueness
Revises: 0001_initial_schema
Create Date: 2026-08-18

"""
from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "0002_email_and_site_uniqueness"
down_revision: str | None = "0001_initial_schema"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.drop_index("ix_users_email", table_name="users")
    op.create_index("ix_users_email_lower_unique", "users", [sa.text("lower(email)")], unique=True)
    op.create_unique_constraint("uq_sites_organization_id_name", "sites", ["organization_id", "name"])


def downgrade() -> None:
    op.drop_constraint("uq_sites_organization_id_name", "sites", type_="unique")
    op.drop_index("ix_users_email_lower_unique", table_name="users")
    op.create_index("ix_users_email", "users", ["email"])
