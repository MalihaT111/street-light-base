from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta, timezone
from db import db_connection
from routes.auth_decorators import citizen_required

challenges_bp = Blueprint("challenges", __name__)

CHALLENGES = {
    # Daily
    "daily_reporter": {
        "name": "Daily Reporter",
        "description": "Submit your first report today",
        "type": "daily",
        "target": 1,
        "points": 20,
        "metric": "daily_reports",
    },
    "active_reporter": {
        "name": "Active Reporter",
        "description": "Submit three reports today",
        "type": "daily",
        "target": 3,
        "points": 60,
        "metric": "daily_reports",
    },
    "street_inspector": {
        "name": "Street Inspector",
        "description": "Submit five reports today",
        "type": "daily",
        "target": 5,
        "points": 100,
        "metric": "daily_reports",
    },
    # Weekly
    "determined": {
        "name": "Determined",
        "description": "Report for five days in a row this week",
        "type": "weekly",
        "target": 5,
        "points": 250,
        "metric": "weekly_streak_days",
    },
    "neighborhood_guardian": {
        "name": "Neighborhood Guardian",
        "description": "Submit ten reports this week",
        "type": "weekly",
        "target": 10,
        "points": 200,
        "metric": "weekly_reports",
    },
    "streetlight_specialist": {
        "name": "Streetlight Specialist",
        "description": "Submit fifteen reports this week",
        "type": "weekly",
        "target": 15,
        "points": 300,
        "metric": "weekly_reports",
    },
    # Special (one-time)
    "first_step": {
        "name": "First Step",
        "description": "Earn your first badge",
        "type": "special",
        "target": 1,
        "points": 50,
        "metric": "badges",
    },
    "connector": {
        "name": "Connector",
        "description": "Submit a report for two different boroughs",
        "type": "special",
        "target": 2,
        "points": 150,
        "metric": "distinct_boroughs",
    },
    "network_leader": {
        "name": "Network Leader",
        "description": "Submit a report for three different boroughs",
        "type": "special",
        "target": 3,
        "points": 200,
        "metric": "distinct_boroughs",
    },
}


def _period_suffix(challenge_type):
    now = datetime.now(timezone.utc)
    if challenge_type == "daily":
        return now.strftime("%Y-%m-%d")
    if challenge_type == "weekly":
        return now.strftime("%G-W%V")
    return None


def _stored_key(key, challenge_type):
    suffix = _period_suffix(challenge_type)
    return f"{key}:{suffix}" if suffix else key


def _longest_consecutive_streak(dates):
    """
    dates: sorted list of unique date objects
    returns longest consecutive-day streak length
    """
    if not dates:
        return 0

    longest = 1
    current = 1

    for i in range(1, len(dates)):
        if dates[i] == dates[i - 1] + timedelta(days=1):
            current += 1
            longest = max(longest, current)
        else:
            current = 1

    return longest


def _get_metrics(cursor, user_id):
    now = datetime.now(timezone.utc)
    today = now.date()
    week_start = today - timedelta(days=today.weekday())  # Monday

    cursor.execute(
        "SELECT COUNT(*) FROM reports WHERE user_id = %s AND created_at::date = %s",
        (user_id, today),
    )
    daily_reports = cursor.fetchone()[0]

    cursor.execute(
        "SELECT COUNT(*) FROM reports WHERE user_id = %s AND created_at::date >= %s",
        (user_id, week_start),
    )
    weekly_reports = cursor.fetchone()[0]

    cursor.execute(
        """
        SELECT DISTINCT created_at::date
        FROM reports
        WHERE user_id = %s AND created_at::date >= %s
        ORDER BY created_at::date
        """,
        (user_id, week_start),
    )
    active_dates = [row[0] for row in cursor.fetchall()]

    weekly_streak_days = _longest_consecutive_streak(active_dates)

    cursor.execute(
        "SELECT COUNT(*) FROM user_badges WHERE user_id = %s",
        (user_id,),
    )
    badges = cursor.fetchone()[0]

    cursor.execute(
        """
        SELECT COUNT(DISTINCT borough)
        FROM reports
        WHERE user_id = %s AND borough IS NOT NULL
        """,
        (user_id,),
    )
    distinct_boroughs = cursor.fetchone()[0]

    return {
        "daily_reports": daily_reports,
        "weekly_reports": weekly_reports,
        "weekly_streak_days": weekly_streak_days,
        "badges": badges,
        "distinct_boroughs": distinct_boroughs,
    }


def check_and_award_challenges(cursor, user_id):
    """
    Called automatically after every report submission.
    Checks all challenges and awards any that are newly completed.
    Returns a list of newly awarded challenges for the frontend to display.

    Requires a UNIQUE constraint on:
        user_challenges (user_id, challenge_key)
    """
    metrics = _get_metrics(cursor, user_id)
    awarded = []

    for key, challenge in CHALLENGES.items():
        sk = _stored_key(key, challenge["type"])
        metric_value = metrics.get(challenge["metric"], 0)

        if metric_value < challenge["target"]:
            continue

        cursor.execute(
            """
            INSERT INTO user_challenges (user_id, challenge_key)
            VALUES (%s, %s)
            ON CONFLICT (user_id, challenge_key) DO NOTHING
            RETURNING challenge_key
            """,
            (user_id, sk),
        )

        inserted_row = cursor.fetchone()

        if inserted_row:
            cursor.execute(
                """
                INSERT INTO points_log (user_id, report_id, points_earned)
                VALUES (%s, NULL, %s)
                """,
                (user_id, challenge["points"]),
            )

            awarded.append(
                {
                    "key": key,
                    "name": challenge["name"],
                    "points": challenge["points"],
                }
            )

    return awarded


@challenges_bp.route("/api/challenges", methods=["GET"])
@citizen_required
def get_challenges():
    user_id = get_jwt_identity()
    connection = None
    cursor = None

    try:
        connection = db_connection()
        cursor = connection.cursor()

        cursor.execute(
            "SELECT challenge_key FROM user_challenges WHERE user_id = %s",
            (user_id,),
        )
        completed_keys = {row[0] for row in cursor.fetchall()}

        metrics = _get_metrics(cursor, user_id)

        result = []
        for key, challenge in CHALLENGES.items():
            sk = _stored_key(key, challenge["type"])
            completed = sk in completed_keys
            progress = min(metrics.get(challenge["metric"], 0), challenge["target"])

            result.append(
                {
                    "key": key,
                    "name": challenge["name"],
                    "description": challenge["description"],
                    "type": challenge["type"],
                    "target": challenge["target"],
                    "progress": progress,
                    "points": challenge["points"],
                    "completed": completed,
                }
            )

        return jsonify({"success": True, "challenges": result}), 200

    except Exception as e:
        print("get_challenges error:", e)
        return jsonify({"success": False, "error": str(e)}), 500

    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()