from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from db import db_connection
from routes.auth_decorators import citizen_required

badges_bp = Blueprint("badges", __name__)

BADGES = {
    "rookie_reporter": {
        "name": "Rookie Reporter",
        "description": "Submit your first report",
        "metric": "total_reports",
        "target": 1,
    },
    "community_guardian": {
        "name": "Community Guardian",
        "description": "Submit 50 reports",
        "metric": "total_reports",
        "target": 50,
    },
    "century_reporter": {
        "name": "Century Reporter",
        "description": "Submit 100 reports",
        "metric": "total_reports",
        "target": 100,
    },
    "across_the_boroughs": {
        "name": "Across the Boroughs",
        "description": "Submit one report for every borough",
        "metric": "distinct_boroughs",
        "target": 5,
    },
}


def check_and_award_badges(cursor, user_id):
    """
    Called after every report submission.
    Checks all badge conditions and inserts newly earned badges.
    Returns a list of newly awarded badge dicts for the frontend.
    """
    cursor.execute(
        "SELECT COUNT(*) FROM reports WHERE user_id = %s",
        (user_id,),
    )
    total_reports = cursor.fetchone()[0]

    cursor.execute(
        "SELECT COUNT(DISTINCT borough) FROM reports WHERE user_id = %s AND borough IS NOT NULL",
        (user_id,),
    )
    distinct_boroughs = cursor.fetchone()[0]

    metrics = {
        "total_reports": total_reports,
        "distinct_boroughs": distinct_boroughs,
    }

    awarded = []
    for key, badge in BADGES.items():
        if metrics.get(badge["metric"], 0) < badge["target"]:
            continue

        cursor.execute(
            """
            INSERT INTO user_badges (user_id, badge_key)
            VALUES (%s, %s)
            ON CONFLICT (user_id, badge_key) DO NOTHING
            RETURNING badge_key
            """,
            (user_id, key),
        )
        if cursor.fetchone():
            awarded.append({"key": key, "name": badge["name"]})

    return awarded


@badges_bp.route("/api/badges", methods=["GET"])
@citizen_required
def get_badges():
    user_id = get_jwt_identity()
    connection = None
    cursor = None

    try:
        connection = db_connection()
        cursor = connection.cursor()

        cursor.execute(
            "SELECT badge_key, created_at FROM user_badges WHERE user_id = %s",
            (user_id,),
        )
        earned = {row[0]: row[1] for row in cursor.fetchall()}

        result = []
        for key, badge in BADGES.items():
            result.append(
                {
                    "key": key,
                    "name": badge["name"],
                    "description": badge["description"],
                    "earned": key in earned,
                    "earned_at": earned[key].isoformat() if key in earned else None,
                }
            )

        return jsonify({"success": True, "badges": result}), 200

    except Exception as e:
        print("get_badges error:", e)
        return jsonify({"success": False, "error": str(e)}), 500

    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()
