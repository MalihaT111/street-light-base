from flask import Blueprint, jsonify, request

from db import db_connection
from flask_jwt_extended import jwt_required, get_jwt_identity

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
@leaderboard_bp.route("/api/leaderboard/stats", methods=["GET"])
@jwt_required()
def leaderboard_stats():
    connection = None
    cursor = None
    try:
        user_id = int(get_jwt_identity())
        connection = db_connection()
        cursor = connection.cursor()
        cursor.execute("SELECT COUNT(*) FROM reports")
        total_reports = cursor.fetchone()[0]
        cursor.execute("""
            SELECT COUNT(DISTINCT user_id)
            FROM reports
            WHERE created_at >= date_trunc('month', CURRENT_DATE)
        """)
        active_users = cursor.fetchone()[0]
        cursor.execute("""
            SELECT username, total_points, rank
            FROM (
                SELECT u.id, u.username,
                       SUM(pl.points_earned) as total_points,
                       RANK() OVER (ORDER BY SUM(pl.points_earned) DESC) as rank
                FROM points_log pl
                JOIN users u ON pl.user_id = u.id
                GROUP BY u.id, u.username
            ) ranked
            WHERE id = %s
        """, (user_id,))
        row = cursor.fetchone()
        user_rank   = row[2] if row else None
        user_points = row[1] if row else 0
        cursor.execute("SELECT COUNT(DISTINCT user_id) FROM points_log")
        total_ranked = cursor.fetchone()[0]
        top_pct = round((user_rank / total_ranked) * 100) if user_rank and total_ranked else None
        return jsonify({
            "success": True,
            "total_reports": total_reports,
            "active_users": active_users,
            "user_rank": user_rank,
            "user_points": user_points,
            "top_pct": top_pct
        }), 200
    except Exception as e:
        return jsonify({"success": False, "error": "Stats failed to load"}), 500
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()