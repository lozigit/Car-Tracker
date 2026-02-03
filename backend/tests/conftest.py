import os
import uuid
from collections.abc import Generator

import pytest
from alembic.config import Config
from dotenv import load_dotenv
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

from alembic import command
from app.main import app

try:
    from app.db import get_db  # type: ignore
except Exception:
    from app.deps import get_db  # type: ignore


@pytest.fixture(scope="session", autouse=True)
def _load_test_env() -> None:
    # Run from backend/, so .env is in the cwd
    load_dotenv(".env", override=True)
    url = os.getenv("DATABASE_URL")
    assert url, "DATABASE_URL missing from backend/.env"
    assert "cartrack_test" in url, f"Refusing to run tests on non-test DB: {url}"


@pytest.fixture(scope="session")
def engine():
    url = os.environ["DATABASE_URL"]
    return create_engine(url, pool_pre_ping=True, future=True)


@pytest.fixture(scope="session", autouse=True)
def _apply_migrations() -> None:
    # Apply migrations once for the test DB
    alembic_cfg = Config("alembic.ini")
    command.upgrade(alembic_cfg, "head")


@pytest.fixture()
def db_session(engine):
    SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture(autouse=True)
def _clean_db(db_session):
    """
    Truncate all tables between tests.
    Adjust table names if your schema differs.
    """
    db_session.execute(text("TRUNCATE TABLE renewals RESTART IDENTITY CASCADE;"))
    db_session.execute(text("TRUNCATE TABLE reminder_preferences RESTART IDENTITY CASCADE;"))
    db_session.execute(text("TRUNCATE TABLE cars RESTART IDENTITY CASCADE;"))
    db_session.execute(text("TRUNCATE TABLE household_members RESTART IDENTITY CASCADE;"))
    db_session.execute(text("TRUNCATE TABLE households RESTART IDENTITY CASCADE;"))
    db_session.execute(text("TRUNCATE TABLE users RESTART IDENTITY CASCADE;"))
    db_session.commit()
    yield


@pytest.fixture()
def client(db_session) -> Generator[TestClient]:
    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()

@pytest.fixture()
def unique_email() -> str:
    return f"user_{uuid.uuid4().hex[:10]}@example.com"
