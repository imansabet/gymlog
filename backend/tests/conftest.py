import os

import pytest
from sqlalchemy import create_engine, text
from sqlalchemy.engine import make_url
from sqlalchemy.orm import Session

_dev_url = make_url(os.environ["DATABASE_URL"])
TEST_URL = _dev_url.set(database="gymlog_test")
os.environ["DATABASE_URL"] = TEST_URL.render_as_string(hide_password=False)

from fastapi.testclient import TestClient  # noqa: E402

from app import models  # noqa: E402,F401
from app.db.base import Base  # noqa: E402
from app.db.session import get_db  # noqa: E402
from app.main import app as fastapi_app  # noqa: E402
from app.models import Exercise, ExerciseKind  # noqa: E402


@pytest.fixture(scope="session")
def engine():
    admin = create_engine(
        TEST_URL.set(database="postgres"), isolation_level="AUTOCOMMIT"
    )
    with admin.connect() as conn:
        exists = conn.scalar(
            text("SELECT 1 FROM pg_database WHERE datname = :n"),
            {"n": TEST_URL.database},
        )
        if not exists:
            conn.execute(text(f'CREATE DATABASE "{TEST_URL.database}"'))
    admin.dispose()

    eng = create_engine(TEST_URL)
    Base.metadata.drop_all(eng)
    Base.metadata.create_all(eng)
    yield eng
    eng.dispose()


@pytest.fixture
def db(engine):
    conn = engine.connect()
    outer = conn.begin()
    session = Session(
        bind=conn, join_transaction_mode="create_savepoint", expire_on_commit=False
    )
    yield session
    session.close()
    outer.rollback()
    conn.close()

@pytest.fixture
def client(db):
    def override():
        db.expire_all() 
        yield db

    fastapi_app.dependency_overrides[get_db] = override
    with TestClient(fastapi_app) as c:
        yield c
    fastapi_app.dependency_overrides.clear()

@pytest.fixture
def exercise(db):
    ex = Exercise(
        slug="weighted-pull-up",
        name_en="Weighted pull-up",
        name_fa="بارفیکس با وزنه",
        kind=ExerciseKind.bodyweight,
    )
    db.add(ex)
    db.commit()
    return ex
