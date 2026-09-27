"""FastAPI routes coordinating NLP inference and MySQL persistence."""

from contextlib import asynccontextmanager
import json
import logging
from pathlib import Path
from typing import AsyncIterator

import joblib
from fastapi import Depends, FastAPI, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.engine import Engine
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session, sessionmaker

from ticket_triage.config import (
    CORS_ORIGINS,
    DATABASE_URL,
    ENVIRONMENT,
    EVALUATION_PATH,
    LOG_LEVEL,
    MODEL_PATH,
    MODEL_VERSION,
)
from ticket_triage.database import (
    create_database_engine,
    create_session_factory,
    get_db,
    upgrade_schema,
    verify_database,
    verify_schema,
)
from ticket_triage.preprocessing import ensure_nlp_ready
from ticket_triage.schemas import (
    HealthResponse,
    MetricsResponse,
    StatisticsResponse,
    TicketListResponse,
    TicketRequest,
    TicketResponse,
)
from ticket_triage.services.prediction_service import PredictionService
from ticket_triage.services.ticket_service import TicketService, to_ticket_response
from ticket_triage.urgency import ensure_urgency_ready

LOGGER = logging.getLogger(__name__)


@asynccontextmanager
async def _lifespan(
    app: FastAPI,
    *,
    model_path: Path,
    database_url: str | None,
    classifier,
    provided_session_factory: sessionmaker[Session] | None,
) -> AsyncIterator[None]:
    engine: Engine | None = None
    owns_engine = provided_session_factory is None

    if classifier is None:
        if not model_path.is_file():
            raise RuntimeError(
                f"Trained model not found at {model_path}. Run `python -m ticket_triage.train` first."
            )
        try:
            classifier = joblib.load(model_path)
        except Exception as error:
            LOGGER.exception("NLP model could not be loaded during startup.")
            raise RuntimeError("NLP model could not be loaded.") from error

    try:
        ensure_nlp_ready()
        ensure_urgency_ready()
    except Exception as error:
        LOGGER.exception("Required NLP resources could not be loaded during startup.")
        raise RuntimeError("Required NLP resources could not be loaded.") from error

    if provided_session_factory is None:
        if not database_url:
            raise RuntimeError(
                "DATABASE_URL is required. Configure MySQL in the project .env file."
            )
        try:
            engine = create_database_engine(database_url)
            session_factory = create_session_factory(engine)
        except (SQLAlchemyError, ValueError) as error:
            LOGGER.exception("MySQL engine initialization failed.")
            raise RuntimeError("MySQL engine could not be initialized.") from error
    else:
        session_factory = provided_session_factory
        engine = session_factory.kw.get("bind")
        if engine is None:
            raise RuntimeError("The supplied SQLAlchemy session factory has no engine.")

    try:
        verify_database(engine)
        if owns_engine and ENVIRONMENT == "development":
            upgrade_schema(database_url)
        verify_schema(engine, require_migration_history=owns_engine)
    except Exception as error:
        LOGGER.exception("MySQL connection or schema verification failed.")
        if owns_engine:
            engine.dispose()
        raise RuntimeError(
            "MySQL is unavailable or the application schema is not current. "
            "Run `alembic upgrade head` after creating the database."
        ) from error

    app.state.engine = engine
    app.state.session_factory = session_factory
    app.state.classifier = classifier
    app.state.require_migration_history = owns_engine
    try:
        yield
    finally:
        if owns_engine:
            engine.dispose()


def create_app(
    model_path: str | Path = MODEL_PATH,
    evaluation_path: str | Path = EVALUATION_PATH,
    database_url: str | None = DATABASE_URL,
    classifier=None,
    session_factory: sessionmaker[Session] | None = None,
) -> FastAPI:
    logging.basicConfig(
        level=getattr(logging, LOG_LEVEL, logging.INFO),
        format="%(asctime)s %(levelname)s %(name)s %(message)s",
    )
    resolved_model_path = Path(model_path).resolve()
    resolved_evaluation_path = Path(evaluation_path).resolve()

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        async with _lifespan(
            app,
            model_path=resolved_model_path,
            database_url=database_url,
            classifier=classifier,
            provided_session_factory=session_factory,
        ):
            yield

    app = FastAPI(
        title="Support Ticket Triage API",
        version="1.0.0",
        description="Explainable ticket classification with MySQL-backed ticket history.",
        lifespan=lifespan,
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=list(CORS_ORIGINS),
        allow_methods=["GET", "POST"],
        allow_headers=["Content-Type"],
    )

    @app.exception_handler(SQLAlchemyError)
    async def database_exception_handler(request: Request, error: SQLAlchemyError):
        LOGGER.error(
            "Database request failed method=%s path=%s error_type=%s",
            request.method,
            request.url.path,
            type(error).__name__,
        )
        return JSONResponse(
            status_code=503,
            content={"detail": "The database service is unavailable. Please try again shortly."},
        )

    @app.exception_handler(Exception)
    async def unexpected_exception_handler(request: Request, error: Exception):
        LOGGER.error(
            "Unhandled request failure method=%s path=%s error_type=%s",
            request.method,
            request.url.path,
            type(error).__name__,
        )
        return JSONResponse(
            status_code=500,
            content={"detail": "An unexpected server error occurred."},
        )

    @app.get("/api/v1/health", response_model=HealthResponse, summary="Check application readiness")
    @app.get("/health", response_model=HealthResponse, include_in_schema=False)
    def health(request: Request) -> dict[str, str]:
        try:
            verify_database(request.app.state.engine)
            verify_schema(
                request.app.state.engine,
                require_migration_history=request.app.state.require_migration_history,
            )
        except (SQLAlchemyError, RuntimeError) as error:
            LOGGER.error("Health check failed error_type=%s", type(error).__name__)
            raise HTTPException(
                status_code=503,
                detail={
                    "status": "unavailable",
                    "database": "unavailable",
                    "model": "loaded",
                },
            ) from error
        return {
            "status": "ok",
            "database": "connected",
            "model": "loaded",
            "nlp": "ready",
        }

    @app.post(
        "/api/v1/predictions",
        response_model=TicketResponse,
        summary="Predict and persist a support ticket",
        description="Runs the existing NLP classifier and urgency heuristic, then stores the ticket and prediction atomically.",
        responses={422: {"description": "Ticket text is invalid"}, 503: {"description": "Database is unavailable or persistence failed"}},
    )
    @app.post("/predict", response_model=TicketResponse, include_in_schema=False)
    def predict(
        ticket: TicketRequest,
        request: Request,
        session: Session = Depends(get_db),
    ) -> TicketResponse:
        cleaned_text = ticket.text.strip()
        if not cleaned_text:
            raise HTTPException(status_code=422, detail="Please enter a valid support ticket.")

        try:
            ticket_record = PredictionService(
                classifier=request.app.state.classifier,
                model_version=MODEL_VERSION,
            ).predict_and_persist(session, cleaned_text)
        except SQLAlchemyError as error:
            LOGGER.error(
                "Ticket prediction transaction failed and was rolled back error_type=%s",
                type(error).__name__,
            )
            raise HTTPException(
                status_code=503,
                detail="The prediction could not be saved. Please retry the request.",
            ) from error
        except Exception as error:
            LOGGER.error("Ticket prediction workflow failed error_type=%s", type(error).__name__)
            raise HTTPException(
                status_code=500,
                detail="The NLP service could not process this ticket.",
            ) from error

        return to_ticket_response(ticket_record)

    @app.get(
        "/api/v1/tickets",
        response_model=list[TicketListResponse],
        summary="List recent persisted tickets",
        description="Returns tickets ordered by creation time, constrained to between 1 and 100 records.",
    )
    @app.get("/tickets", response_model=list[TicketListResponse], include_in_schema=False)
    def list_tickets(
        limit: int = Query(default=20, ge=1, le=100),
        session: Session = Depends(get_db),
    ) -> list[TicketResponse]:
        return TicketService(session).list_recent(limit)

    @app.get(
        "/api/v1/tickets/{ticket_id}",
        response_model=TicketResponse,
        summary="Get a persisted ticket by public ID",
        responses={404: {"description": "No ticket has this public ID"}},
    )
    @app.get("/tickets/{ticket_id}", response_model=TicketResponse, include_in_schema=False)
    def read_ticket(ticket_id: str, session: Session = Depends(get_db)) -> TicketResponse:
        ticket = TicketService(session).get_by_ticket_id(ticket_id)
        if ticket is None:
            raise HTTPException(status_code=404, detail="Ticket not found.")
        return ticket

    @app.get(
        "/api/v1/statistics",
        response_model=StatisticsResponse,
        summary="Get runtime ticket statistics",
        description="Aggregates ticket count, average prediction urgency, and category counts from MySQL.",
    )
    @app.get("/statistics", response_model=StatisticsResponse, include_in_schema=False)
    def statistics(session: Session = Depends(get_db)) -> StatisticsResponse:
        return TicketService(session).statistics()

    @app.get(
        "/api/v1/metrics",
        response_model=MetricsResponse,
        summary="Get held-out model metrics",
        description="Reads metrics from the training evaluation artifact; never computes accuracy from live ticket history.",
    )
    @app.get("/metrics", response_model=MetricsResponse, include_in_schema=False)
    def metrics() -> MetricsResponse:
        try:
            evaluation = json.loads(resolved_evaluation_path.read_text(encoding="utf-8"))
            return MetricsResponse(
                accuracy=evaluation["accuracy"],
                precision=evaluation["weighted_precision"],
                recall=evaluation["weighted_recall"],
                f1_score=evaluation["weighted_f1"],
                macro_precision=evaluation["macro_precision"],
                macro_recall=evaluation["macro_recall"],
                macro_f1=evaluation["macro_f1"],
                majority_baseline_accuracy=evaluation["majority_baseline_accuracy"],
                dataset_rows=evaluation["dataset_rows"],
                test_rows=evaluation["test_rows"],
            )
        except (OSError, ValueError, KeyError, TypeError) as error:
            LOGGER.exception("Training evaluation metrics are unavailable or invalid.")
            raise HTTPException(
                status_code=503,
                detail="Training evaluation metrics are unavailable.",
            ) from error

    return app


app = create_app()
