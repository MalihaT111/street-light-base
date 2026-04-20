import os
from urllib.parse import quote_plus, urlparse

import psycopg2
import psycopg2.pool


NEON_HOST_MARKER = "neon.tech"
_db_pool = None


def _build_database_url_from_parts():
    host = os.getenv("DB_HOST")
    name = os.getenv("DB_NAME")
    user = os.getenv("DB_USER")
    password = os.getenv("DB_PASSWORD")
    port = os.getenv("DB_PORT", "5432")

    if not all([host, name, user, password]):
        return None

    return (
        f"postgresql://{quote_plus(user)}:{quote_plus(password)}@{host}:{port}/{name}"
        "?sslmode=require"
    )


def _get_neon_database_url():
    database_url = (
        os.getenv("NEON_DATABASE_URL")
        or os.getenv("DATABASE_URL")
        or os.getenv("POSTGRES_URL")
        or _build_database_url_from_parts()
    )

    if not database_url:
        raise RuntimeError(
            "Neon database connection is not configured. "
            "Set NEON_DATABASE_URL (preferred) or Neon-backed DB_* variables."
        )

    parsed = urlparse(database_url)
    hostname = parsed.hostname or os.getenv("DB_HOST", "")
    if NEON_HOST_MARKER not in hostname:
        raise RuntimeError(
            "Database host must point to Neon. "
            "Update your env vars to use the Neon hostname."
        )

    if "sslmode=" not in database_url:
        separator = "&" if "?" in database_url else "?"
        database_url = f"{database_url}{separator}sslmode=require"

    return database_url


def get_db_pool():
    global _db_pool
    if _db_pool is None:
        _db_pool = psycopg2.pool.ThreadedConnectionPool(
            1,  # Minimum connections
            20, # Maximum connections
            _get_neon_database_url(),
            connect_timeout=10
        )
    return _db_pool


def get_db_connection():
    return get_db_pool().getconn()


def release_db_connection(conn):
    if conn:
        get_db_pool().putconn(conn)
