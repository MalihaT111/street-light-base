import os


class Config:
    JWT_SECRET_KEY = os.getenv("SECRET_KEY")
    WTF_CSRF_ENABLED = False
    CORS_RESOURCES = {
        r"/*": {
            "origins": ["http://localhost:5173"],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"],
            "supports_credentials": True,
        }
    }