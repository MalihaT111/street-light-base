import os
from datetime import timedelta


class Config:
    JWT_SECRET_KEY = os.getenv("SECRET_KEY")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(days=7)
    DATABASE_URL = (
        os.getenv("NEON_DATABASE_URL")
        or os.getenv("DATABASE_URL")
        or os.getenv("POSTGRES_URL")
    )
    WTF_CSRF_ENABLED = False
    JWT_SKIP_REVOCATION_CHECKS = False
    JWT_EXEMPT_METHODS = {"OPTIONS"}
    FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
    CORS_RESOURCES = {
        r"/*": {
            "origins": [FRONTEND_URL],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"],
            "supports_credentials": True,
        }
    }
