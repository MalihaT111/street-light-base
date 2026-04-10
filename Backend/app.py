import os

from dotenv import load_dotenv

load_dotenv()

from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager

from config import Config
from routes.auth import auth_bp
from routes.analytics import analytics_bp
from routes.leaderboard import leaderboard_bp
from routes.reports import reports_bp
from routes.user import user_bp
from routes.challenges import challenges_bp
from routes.badges import badges_bp
from routes.achievements import achievements_bp

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    CORS(app, resources=app.config["CORS_RESOURCES"])
    JWTManager(app)
    app.register_blueprint(auth_bp)
    app.register_blueprint(analytics_bp)
    app.register_blueprint(leaderboard_bp)
    app.register_blueprint(reports_bp)
    app.register_blueprint(user_bp)
    app.register_blueprint(challenges_bp)
    app.register_blueprint(badges_bp)
    app.register_blueprint(achievements_bp)

    return app


app = create_app()


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=os.getenv("FLASK_ENV") == "development")
