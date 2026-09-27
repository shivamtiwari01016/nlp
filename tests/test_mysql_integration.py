"""MySQL integration tests; skipped unless a dedicated test database is configured."""

import os
from urllib.parse import urlparse

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import delete

from ticket_triage.api import create_app
from ticket_triage.config import MODEL_PATH
from ticket_triage.database import create_database_engine, create_session_factory, upgrade_schema
from ticket_triage.models import Prediction, Ticket

TEST_DATABASE_URL = os.getenv("MYSQL_TEST_DATABASE_URL")


class IntegrationClassifier:
    def predict(self, texts):
        return ["Billing" for _ in texts]


@pytest.fixture

def mysql_session_factory():
    if not TEST_DATABASE_URL:
        pytest.skip("Set MYSQL_TEST_DATABASE_URL to an isolated MySQL test database.")
    parsed_url = urlparse(TEST_DATABASE_URL)
    if parsed_url.hostname not in {"localhost", "127.0.0.1", "::1"} or not parsed_url.path.rstrip("/").endswith("_test"):
        pytest.fail("MYSQL_TEST_DATABASE_URL must target a local database ending in _test.")

    upgrade_schema(TEST_DATABASE_URL)
    engine = create_database_engine(TEST_DATABASE_URL)
    session_factory = create_session_factory(engine)
    with session_factory() as session:
        session.execute(delete(Prediction))
        session.execute(delete(Ticket))
        session.commit()

    yield session_factory

    with session_factory() as session:
        session.execute(delete(Prediction))
        session.execute(delete(Ticket))
        session.commit()
    engine.dispose()


def test_mysql_versioned_prediction_persists_and_can_be_retrieved(mysql_session_factory):
    app = create_app(
        model_path=MODEL_PATH,
        database_url=TEST_DATABASE_URL,
        classifier=IntegrationClassifier(),
        session_factory=mysql_session_factory,
    )

    with TestClient(app) as client:
        response = client.post(
            "/api/v1/predictions",
            json={"text": "I was charged twice and need a refund."},
        )
        assert response.status_code == 200
        ticket = response.json()
        assert ticket["ticket_id"].startswith("TKT-")
        assert ticket["status"] == "open"
        assert ticket["category"] == "Billing"
        assert ticket["assigned_team"] == "Billing Team"
        assert 0 <= ticket["urgency"] <= 1

        assert client.get(f"/api/v1/tickets/{ticket['ticket_id']}").json() == ticket
        assert client.get("/api/v1/tickets?limit=10").json() == [ticket]
        statistics = client.get("/api/v1/statistics").json()
        assert statistics["total_tickets"] == 1
        assert statistics["category_distribution"] == {"Billing": 1}
