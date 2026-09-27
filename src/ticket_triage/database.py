"""SQLAlchemy engine, sessions, and database connectivity helpers."""

from collections.abc import Generator

from fastapi import Request
from alembic.config import Config
from alembic.script import ScriptDirectory
from sqlalchemy import Engine, create_engine, inspect, text
from sqlalchemy.engine import make_url
from sqlalchemy.orm import Session, sessionmaker

from ticket_triage.config import PROJECT_ROOT


def create_database_engine(database_url: str) -> Engine:
    """Create a runtime engine and reject non-MySQL URLs outside tests."""
    if make_url(database_url).drivername != "mysql+pymysql":
        raise ValueError("DATABASE_URL must use the mysql+pymysql:// driver.")
    return create_engine(database_url, pool_pre_ping=True)


def create_session_factory(engine: Engine) -> sessionmaker[Session]:
    return sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


def verify_database(engine: Engine) -> None:
    with engine.connect() as connection:
        connection.execute(text("SELECT 1"))


def verify_schema(engine: Engine, *, require_migration_history: bool = True) -> None:
    required_tables = {"tickets", "predictions"}
    if require_migration_history:
        required_tables.add("alembic_version")
    missing_tables = required_tables.difference(inspect(engine).get_table_names())
    if missing_tables:
        missing = ", ".join(sorted(missing_tables))
        raise RuntimeError(
            f"Database schema is incomplete (missing: {missing}). Run `alembic upgrade head`."
        )
    if require_migration_history:
        migration_config = Config(str(PROJECT_ROOT / "alembic.ini"))
        expected_revision = ScriptDirectory.from_config(migration_config).get_current_head()
        with engine.connect() as connection:
            applied_revision = connection.execute(
                text("SELECT version_num FROM alembic_version")
            ).scalar_one_or_none()
        if applied_revision != expected_revision:
            raise RuntimeError(
                "Database migration revision is not current. Run `alembic upgrade head`."
            )


def upgrade_schema(database_url: str) -> None:
    """Apply checked-in Alembic revisions to the configured database."""
    from alembic import command

    alembic_config = Config(str(PROJECT_ROOT / "alembic.ini"))
    alembic_config.set_main_option(
        "sqlalchemy.url", database_url.replace("%", "%%")
    )
    command.upgrade(alembic_config, "head")


def get_db(request: Request) -> Generator[Session, None, None]:
    """Yield one request-scoped session; routes never own session commits."""
    factory: sessionmaker[Session] = request.app.state.session_factory
    with factory() as session:
        yield session
