"""Inference, urgency scoring, routing, and persistence workflow."""

from sqlalchemy.orm import Session

from ticket_triage.repositories.ticket_repository import TicketRepository
from ticket_triage.services.routing_service import assign_team
from ticket_triage.urgency import score_urgency


class PredictionService:
    def __init__(self, classifier, model_version: str):
        self.classifier = classifier
        self.model_version = model_version

    def predict_and_persist(self, session: Session, text: str):
        category = str(self.classifier.predict([text])[0])
        urgency = score_urgency(text)
        team = assign_team(category)
        return TicketRepository(session).create_with_prediction(
            text=text,
            category=category,
            assigned_team=team,
            urgency_score=float(urgency["score"]) / 100,
            urgency_level=str(urgency["level"]),
            model_version=self.model_version,
        )
