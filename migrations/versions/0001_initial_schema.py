"""Create runtime ticket and prediction tables.

Revision ID: 0001_initial
Revises:
Create Date: 2026-09-28
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0001_initial"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


PK_TYPE = sa.BigInteger().with_variant(sa.Integer(), "sqlite")


def upgrade() -> None:
    op.create_table(
        "tickets",
        sa.Column("id", PK_TYPE, primary_key=True, autoincrement=True),
        sa.Column("ticket_id", sa.String(100), nullable=False),
        sa.Column("text", sa.Text(), nullable=False),
        sa.Column("status", sa.String(20), server_default=sa.text("'open'"), nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
    )
    op.create_index("ix_tickets_ticket_id", "tickets", ["ticket_id"], unique=True)
    op.create_index("ix_tickets_created_at_id", "tickets", ["created_at", "id"])

    op.create_table(
        "predictions",
        sa.Column("id", PK_TYPE, primary_key=True, autoincrement=True),
        sa.Column("ticket_db_id", PK_TYPE, nullable=False),
        sa.Column("category", sa.String(100), nullable=False),
        sa.Column("assigned_team", sa.String(100), nullable=False),
        sa.Column("urgency_score", sa.Numeric(5, 4), nullable=False),
        sa.Column("urgency_level", sa.String(20), nullable=False),
        sa.Column("model_version", sa.String(40), nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.ForeignKeyConstraint(["ticket_db_id"], ["tickets.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_predictions_ticket_db_id", "predictions", ["ticket_db_id"])
    op.create_index("ix_predictions_category", "predictions", ["category"])
    op.create_index("ix_predictions_created_at_id", "predictions", ["created_at", "id"])


def downgrade() -> None:
    op.drop_index("ix_predictions_created_at_id", table_name="predictions")
    op.drop_index("ix_predictions_category", table_name="predictions")
    op.drop_index("ix_predictions_ticket_db_id", table_name="predictions")
    op.drop_table("predictions")
    op.drop_index("ix_tickets_ticket_id", table_name="tickets")
    op.drop_index("ix_tickets_created_at_id", table_name="tickets")
    op.drop_table("tickets")
