from flask import Blueprint, jsonify, request

from db import db_connection

leaderboard_bp = Blueprint("leaderboard", __name__)


@leaderboard_bp.route("/api/leaderboard", methods=["GET"])
def leaderboards():
    connection = None
    cursor = None
    try:
        limit = request.args.get("limit", type=int, default=10)
        connection = db_connection()
        cursor = connection.cursor()
        cursor.execute(
            """
            SELECT u.username, SUM(pl.points_earned) as total_points
            FROM points_log pl
            JOIN users u ON pl.user_id = u.id
            GROUP BY u.username
            ORDER BY total_points DESC
            LIMIT %s
            """,
            (limit,),
        )
        rows = cursor.fetchall()
        leaderboard = [{"rank": i, "username": r[0], "total_points": r[1]} for i, r in enumerate(rows, 1)]
        return jsonify({"success": True, "leaderboard": leaderboard}), 200
    except Exception:
        return jsonify({"success": False, "error": "Leaderboards failed to load"}), 500
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()
