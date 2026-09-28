"""SQLAlchemy persistence operations for tickets and prediction history."""

from datetime import date, datetime, time, timedelta
from decimal import Decimal
from secrets import token_hex

from sqlalchemy import func, or_, select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session, selectinload

from ticket_triage.models import Prediction, Ticket


def generate_ticket_id() -> str:
    return f"TKT-{token_hex(6).upper()}"


class TicketRepository:
    def __init__(self, session: Session):
        self.session = session

    def create_with_prediction(
        self,
        *,
        text: str,
        category: str,
        assigned_team: str,
        urgency_score: float,
        urgency_level: str,
        model_version: str,
    ) -> Ticket:
        """Commit ticket and prediction together, rolling both back on failure."""
        ticket = Ticket(ticket_id=generate_ticket_id(), text=text, status="open")
        ticket.predictions.append(
            Prediction(
                category=category,
                assigned_team=assigned_team,
                urgency_score=Decimal(str(round(urgency_score, 4))),
                urgency_level=urgency_level,
                model_version=model_version,
            )
        )
        self.session.add(ticket)

        try:
            self.session.flush()
            self.session.refresh(ticket)
            self.session.commit()
            return ticket
        except SQLAlchemyError:
            self.session.rollback()
            raise

    def list_recent(self, limit: int) -> list[Ticket]:
        statement = (
            select(Ticket)
            .options(selectinload(Ticket.predictions))
            .order_by(Ticket.created_at.desc(), Ticket.id.desc())
            .limit(limit)
        )
        return list(self.session.scalars(statement).all())

    def get_by_ticket_id(self, ticket_id: str) -> Ticket | None:
        statement = (
            select(Ticket)
            .options(selectinload(Ticket.predictions))
            .where(Ticket.ticket_id == ticket_id)
        )
        return self.session.scalar(statement)

    def delete_by_ticket_id(self, ticket_id: str) -> bool:
        """Delete ticket and cascade predictions. Returns True if a row was deleted."""
        ticket = self.session.scalar(
            select(Ticket).options(selectinload(Ticket.predictions)).where(Ticket.ticket_id == ticket_id)
        )
        if ticket is None:
            return False
        self.session.delete(ticket)
        try:
            self.session.commit()
        except SQLAlchemyError:
            self.session.rollback()
            raise
        return True

    def list_filtered(
        self,
        *,
        limit: int = 100,
        offset: int = 0,
        category: str | None = None,
        urgency_level: str | None = None,
        status: str | None = None,
        search: str | None = None,
        start_date: date | None = None,
        end_date: date | None = None,
    ) -> list[Ticket]:
        """Return tickets matching optional filter criteria."""
        statement = (
            select(Ticket)
            .join(Ticket.predictions)
            .options(selectinload(Ticket.predictions))
            .order_by(Ticket.created_at.desc(), Ticket.id.desc())
        )
        if category:
            statement = statement.where(Prediction.category == category)
        if urgency_level:
            statement = statement.where(Prediction.urgency_level == urgency_level)
        if status:
            statement = statement.where(Ticket.status == status)
        if search:
            statement = statement.where(
                or_(Ticket.text.ilike(f"%{search}%"), Ticket.ticket_id.ilike(f"%{search}%"))
            )
        if start_date:
            statement = statement.where(
                Ticket.created_at >= datetime.combine(start_date, time.min)
            )
        if end_date:
            statement = statement.where(
                Ticket.created_at < datetime.combine(end_date + timedelta(days=1), time.min)
            )
        statement = statement.offset(offset).limit(limit)
        return list(self.session.scalars(statement).all())

    def urgency_timeline(self, limit: int = 30) -> list[dict]:
        """Return recent tickets with date and urgency score for charting."""
        rows = self.session.execute(
            select(Ticket.ticket_id, Ticket.created_at, Prediction.urgency_score, Prediction.category)
            .join(Ticket.predictions)
            .order_by(Ticket.created_at.desc(), Ticket.id.desc())
            .limit(limit)
        ).all()
        return [
            {
                "ticket_id": r.ticket_id,
                "created_at": r.created_at.isoformat(),
                "urgency_score": round(float(r.urgency_score), 4),
                "category": r.category,
            }
            for r in reversed(rows)
        ]

    def statistics(self) -> dict:
        total_tickets = self.session.scalar(select(func.count(Ticket.id))) or 0
        average_urgency = self.session.scalar(select(func.avg(Prediction.urgency_score)))
        category_counts = self.session.execute(
            select(Prediction.category, func.count(Prediction.id)).group_by(
                Prediction.category
            )
        ).all()
        return {
            "total_tickets": int(total_tickets),
            "average_urgency": (
                round(float(average_urgency), 4) if average_urgency is not None else 0.0
            ),
            "category_distribution": {
                category: int(count) for category, count in category_counts
            },
        }
