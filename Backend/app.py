import os

from dotenv import load_dotenv

load_dotenv()

from flask import Flask, jsonify
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

    @app.teardown_appcontext
    def shutdown_session(exception=None):
        # Placeholder for potential scoped session cleanup if using an ORM
        pass

    @app.route("/api/health")
    def health_check():
        return jsonify({"status": "healthy", "environment": os.getenv("FLASK_ENV", "production")}), 200

    @app.errorhandler(Exception)
    def handle_exception(e):
        # Log the actual error for the developer
        app.logger.error(f"Unhandled Exception: {str(e)}")
        # Return a generic message to the user
        return jsonify({"success": False, "error": "Internal server error"}), 500

    return app


app = create_app()


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=os.getenv("FLASK_ENV") == "development")
