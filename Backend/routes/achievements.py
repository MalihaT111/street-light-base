from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from db import db_connection

achievements_bp = Blueprint("achievements", __name__)

# Tiers in ascending order; max_points=None means no upper bound
TIERS = [
    {"key": "beginner",   "name": "Beginner",   "min_points": 0,       "max_points": 999},
    {"key": "explorer",   "name": "Explorer",   "min_points": 1_000,   "max_points": 9_999},
    {"key": "elite",      "name": "Elite",      "min_points": 10_000,  "max_points": 99_999},
    {"key": "legendary",  "name": "Legendary",  "min_points": 100_000, "max_points": None},
]


def _current_tier(total_points):
    for tier in reversed(TIERS):
        if total_points >= tier["min_points"]:
            return tier
    return TIERS[0]


def check_and_award_tier(cursor, user_id):
    """
    Called after every report submission.
    Records newly reached tiers in user_achievements.
    Returns the name of the newly reached tier, or None.
    """
    cursor.execute(
        "SELECT COALESCE(SUM(points_earned), 0) FROM points_log WHERE user_id = %s",
        (user_id,),
    )
    total_points = cursor.fetchone()[0]

    tier = _current_tier(total_points)

    cursor.execute(
        """
        INSERT INTO user_achievements (user_id, achievement_key)
        VALUES (%s, %s)
        ON CONFLICT (user_id, achievement_key) DO NOTHING
        RETURNING achievement_key
        """,
        (user_id, tier["key"]),
    )
    if cursor.fetchone():
        return tier["name"]
    return None


@achievements_bp.route("/api/achievements", methods=["GET"])
@jwt_required()
def get_achievements():
    user_id = get_jwt_identity()
    connection = None
    cursor = None

    try:
        connection = db_connection()
        cursor = connection.cursor()

        cursor.execute(
            "SELECT COALESCE(SUM(points_earned), 0) FROM points_log WHERE user_id = %s",
            (user_id,),
        )
        total_points = cursor.fetchone()[0]

        tier = _current_tier(total_points)
        tier_index = next(i for i, t in enumerate(TIERS) if t["key"] == tier["key"])

        progress_to_next = None
        if tier_index < len(TIERS) - 1:
            next_tier = TIERS[tier_index + 1]
            progress_to_next = {
                "next_tier": next_tier["name"],
                "points_earned": total_points - tier["min_points"],
                "points_needed": next_tier["min_points"] - tier["min_points"],
                "points_remaining": next_tier["min_points"] - total_points,
            }

        cursor.execute(
            "SELECT achievement_key FROM user_achievements WHERE user_id = %s",
            (user_id,),
        )
        reached_keys = {row[0] for row in cursor.fetchall()}

        tiers = [
            {
                "key": t["key"],
                "name": t["name"],
                "min_points": t["min_points"],
                "max_points": t["max_points"],
                "reached": t["key"] in reached_keys,
            }
            for t in TIERS
        ]

        return jsonify(
            {
                "success": True,
                "total_points": total_points,
                "current_tier": tier["name"],
                "progress_to_next": progress_to_next,
                "tiers": tiers,
            }
        ), 200

    except Exception as e:
        print("get_achievements error:", e)
        return jsonify({"success": False, "error": str(e)}), 500

    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()
