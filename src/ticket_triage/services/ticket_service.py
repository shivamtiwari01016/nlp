"""Ticket read workflows and API DTO mapping."""

from datetime import date

from sqlalchemy.orm import Session

from ticket_triage.models import Ticket
from ticket_triage.repositories.ticket_repository import TicketRepository
from ticket_triage.schemas import StatisticsResponse, TicketResponse


def to_ticket_response(ticket: Ticket) -> TicketResponse:
    if not ticket.predictions:
        raise RuntimeError("Persisted ticket has no associated prediction.")
    prediction = ticket.predictions[0]
    return TicketResponse(
        ticket_id=ticket.ticket_id,
        text=ticket.text,
        status=ticket.status,
        category=prediction.category,
        assigned_team=prediction.assigned_team,
        urgency=float(prediction.urgency_score),
        urgency_level=prediction.urgency_level,
        created_at=ticket.created_at,
    )


class TicketService:
    def __init__(self, session: Session):
        self.repository = TicketRepository(session)

    def list_recent(self, limit: int) -> list[TicketResponse]:
        return [to_ticket_response(ticket) for ticket in self.repository.list_recent(limit)]

    def get_by_ticket_id(self, ticket_id: str) -> TicketResponse | None:
        ticket = self.repository.get_by_ticket_id(ticket_id)
        return to_ticket_response(ticket) if ticket is not None else None

    def search(
        self,
        *,
        limit: int,
        offset: int,
        category: str | None,
        urgency_level: str | None,
        search: str | None,
        start_date: date | None,
        end_date: date | None,
    ) -> list[TicketResponse]:
        tickets = self.repository.list_filtered(
            limit=limit,
            offset=offset,
            category=category,
            urgency_level=urgency_level,
            search=search,
            start_date=start_date,
            end_date=end_date,
        )
        return [to_ticket_response(ticket) for ticket in tickets]

    def urgency_timeline(self, limit: int) -> list[dict]:
        return self.repository.urgency_timeline(limit)

    def delete(self, ticket_id: str) -> bool:
        return self.repository.delete_by_ticket_id(ticket_id)

    def statistics(self) -> StatisticsResponse:
        return StatisticsResponse(**self.repository.statistics())
