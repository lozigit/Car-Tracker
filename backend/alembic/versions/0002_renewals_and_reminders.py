"""add renewals + reminder preferences

Revision ID: 0002_renewals_and_reminders
Revises: 0001_init
Create Date: 2026-01-28
"""

from __future__ import annotations

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from alembic import op

revision = "0002_renewals_and_reminders"
down_revision = "0001_init"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create enum type in a fully idempotent way (safe if it already exists)
    op.execute(
        """
        DO $$
        BEGIN
            CREATE TYPE renewal_kind AS ENUM ('INSURANCE', 'MOT', 'TAX');
        EXCEPTION
            WHEN duplicate_object THEN
                NULL;
        END $$;
        """
    )

    # IMPORTANT: use postgresql.ENUM(create_type=False) so SQLAlchemy won't try CREATE TYPE again
    renewal_kind = postgresql.ENUM(
        "INSURANCE",
        "MOT",
        "TAX",
        name="renewal_kind",
        create_type=False,
    )

    op.create_table(
        "renewals",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "car_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("cars.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("kind", renewal_kind, nullable=False),
        sa.Column("valid_from", sa.Date(), nullable=False),
        sa.Column("valid_to", sa.Date(), nullable=False),
        sa.Column("provider", sa.String(length=120), nullable=True),
        sa.Column("reference", sa.String(length=120), nullable=True),
        sa.Column("cost_pence", sa.Integer(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("is_deleted", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_renewals_car_id", "renewals", ["car_id"])
    op.create_index("ix_renewals_kind", "renewals", ["kind"])

    op.create_table(
        "reminder_preferences",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
            unique=True,
        ),
        sa.Column("preferences_json", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("reminder_preferences")
    op.drop_index("ix_renewals_kind", table_name="renewals")
    op.drop_index("ix_renewals_car_id", table_name="renewals")
    op.drop_table("renewals")

    op.execute("DROP TYPE IF EXISTS renewal_kind;")
