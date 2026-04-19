from flask import Blueprint, jsonify, request, current_app

from db import get_db_connection, release_db_connection
from flask_jwt_extended import jwt_required, get_jwt_identity
from routes.auth_decorators import citizen_required
from routes.auth_utils import get_current_user_id

leaderboard_bp = Blueprint("leaderboard", __name__)

# Maps period param -> SQL condition on points_log.created_at
PERIOD_FILTERS = {
    "daily":   "pl.created_at >= CURRENT_DATE",
    "weekly":  "pl.created_at >= date_trunc('week', CURRENT_DATE)",
    "monthly": "pl.created_at >= date_trunc('month', CURRENT_DATE)",
}


@leaderboard_bp.route("/api/leaderboard", methods=["GET"])
def leaderboards():
    connection = None
    cursor = None
    try:
        limit = request.args.get("limit", type=int, default=10)
        borough = (request.args.get("borough") or "").strip()
        period = (request.args.get("period") or "all_time").strip().lower()

        conditions = []
        params = []
        needs_reports_join = borough and borough.lower() != "all"

        if needs_reports_join:
            conditions.append("LOWER(r.borough) = LOWER(%s)")
            params.append(borough)

        period_sql = PERIOD_FILTERS.get(period)
        if period_sql:
            conditions.append(period_sql)

        where_clause = ("WHERE " + " AND ".join(conditions)) if conditions else ""
        reports_join = "JOIN reports r ON pl.report_id = r.id" if needs_reports_join else ""
        params.append(limit)

        connection = get_db_connection()
        cursor = connection.cursor()
        cursor.execute(f"""
            SELECT u.username, SUM(pl.points_earned) as total_points
            FROM points_log pl
            JOIN users u ON pl.user_id = u.id
            {reports_join}
            {where_clause}
            GROUP BY u.username
            ORDER BY total_points DESC
            LIMIT %s
        """, params)

        rows = cursor.fetchall()
        leaderboard = [{"rank": i, "username": r[0], "total_points": r[1]} for i, r in enumerate(rows, 1)]
        return jsonify({"success": True, "leaderboard": leaderboard}), 200
    except Exception as e:
        current_app.logger.error(f"Leaderboards failure: {e}")
        return jsonify({"success": False, "error": "Leaderboards failed to load"}), 500
    finally:
        if cursor:
            cursor.close()
        if connection:
            release_db_connection(connection)

@leaderboard_bp.route("/api/leaderboard/stats", methods=["GET"])
@citizen_required
def leaderboard_stats():
    connection = None
    cursor = None
    try:
        user_id = get_current_user_id()
        borough = (request.args.get("borough") or "").strip()
        period = (request.args.get("period") or "all_time").strip().lower()

        needs_reports_join = borough and borough.lower() != "all"
        period_sql = PERIOD_FILTERS.get(period)

        # Build shared WHERE conditions
        conditions = []
        base_params = []
        if needs_reports_join:
            conditions.append("LOWER(r.borough) = LOWER(%s)")
            base_params.append(borough)
        if period_sql:
            conditions.append(period_sql)

        where_clause = ("WHERE " + " AND ".join(conditions)) if conditions else ""
        reports_join = "JOIN reports r ON pl.report_id = r.id" if needs_reports_join else ""

        connection = get_db_connection()
        cursor = connection.cursor()
        cursor.execute("SELECT COUNT(*) FROM reports")
        total_reports = cursor.fetchone()[0]
        cursor.execute("""
            SELECT COUNT(DISTINCT user_id)
            FROM reports
            WHERE created_at >= date_trunc('month', CURRENT_DATE)
        """)
        active_users = cursor.fetchone()[0]

        cursor.execute(f"""
            SELECT username, total_points, rank
            FROM (
                SELECT u.id, u.username,
                       SUM(pl.points_earned) as total_points,
                       RANK() OVER (ORDER BY SUM(pl.points_earned) DESC) as rank
                FROM points_log pl
                JOIN users u ON pl.user_id = u.id
                {reports_join}
                {where_clause}
                GROUP BY u.id, u.username
            ) ranked
            WHERE id = %s
        """, base_params + [user_id])

        row = cursor.fetchone()
        user_rank   = row[2] if row else None
        user_points = row[1] if row else 0

        cursor.execute(f"""
            SELECT COUNT(DISTINCT pl.user_id)
            FROM points_log pl
            {reports_join}
            {where_clause}
        """, base_params)
        total_ranked = cursor.fetchone()[0]

        top_pct = round((user_rank / total_ranked) * 100) if user_rank and total_ranked else None
        return jsonify({
            "success": True,
            "total_reports": total_reports,
            "active_users": active_users,
            "user_rank": user_rank,
            "user_points": user_points,
            "top_pct": top_pct,
            "borough": borough if needs_reports_join else "all"
        }), 200
    except Exception as e:
        current_app.logger.error(f"Leaderboard stats failure: {e}")
        return jsonify({"success": False, "error": "Stats failed to load"}), 500
    finally:
        if cursor:
            cursor.close()
        if connection:
            release_db_connection(connection)