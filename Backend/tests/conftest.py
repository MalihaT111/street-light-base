import os
import sys
import uuid

import psycopg2
import pytest
from dotenv import load_dotenv

# Ensure Backend/ is importable when pytest runs from Backend/tests/ or Backend/
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env"))


def _build_url_from_parts():
    from urllib.parse import quote_plus

    host = os.getenv("DB_HOST")
    name = os.getenv("DB_NAME")
    user = os.getenv("DB_USER")
    password = os.getenv("DB_PASSWORD")
    port = os.getenv("DB_PORT", "5432")
    if not all([host, name, user, password]):
        return None
    return f"postgresql://{quote_plus(user)}:{quote_plus(password)}@{host}:{port}/{name}"


def _raw_db_url():
    url = (
        os.getenv("TEST_DATABASE_URL")
        or os.getenv("NEON_DATABASE_URL")
        or os.getenv("DATABASE_URL")
        or os.getenv("POSTGRES_URL")
        or _build_url_from_parts()
    )
    if not url:
        raise RuntimeError(
            "No database URL configured. Set TEST_DATABASE_URL, NEON_DATABASE_URL, "
            "DATABASE_URL, or DB_HOST/DB_NAME/DB_USER/DB_PASSWORD."
        )
    return url


def make_test_conn():
    url = _raw_db_url()
    if "sslmode=" not in url:
        sep = "&" if "?" in url else "?"
        url = f"{url}{sep}sslmode=require"
    return psycopg2.connect(url, connect_timeout=15)


@pytest.fixture
def db_conn():
    conn = make_test_conn()
    yield conn
    conn.rollback()
    conn.close()


@pytest.fixture
def test_user(db_conn):
    tag = uuid.uuid4().hex[:10]
    username = f"_pytest_{tag}"
    email = f"{username}@test.invalid"
    pw_hash = "x" * 60  # placeholder, never used for auth in these tests

    cur = db_conn.cursor()
    cur.execute(
        "INSERT INTO users (username, email, password_hash) VALUES (%s, %s, %s) RETURNING id",
        (username, email, pw_hash),
    )
    user_id = cur.fetchone()[0]
    db_conn.commit()
    cur.close()

    yield user_id

    # ON DELETE CASCADE handles reports, points_log, user_challenges, user_badges
    cur = db_conn.cursor()
    cur.execute("DELETE FROM users WHERE id = %s", (user_id,))
    db_conn.commit()
    cur.close()


@pytest.fixture(scope="session")
def flask_app():
    from app import create_app

    app = create_app()
    app.config["TESTING"] = True
    app.config["JWT_SECRET_KEY"] = "test-secret-key-for-pytest-only-32b"
    return app


@pytest.fixture
def authed_client(flask_app, test_user):
    with flask_app.test_client() as client:
        with flask_app.app_context():
            from flask_jwt_extended import create_access_token

            token = create_access_token(
                identity=str(test_user),
                additional_claims={"role": "citizen"},
            )
        yield client, {"Authorization": f"Bearer {token}"}
