import json

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required
from routes.badges import check_and_award_badges
from routes.challenges import check_and_award_challenges
from routes.achievements import check_and_award_tier

from db import db_connection
from routes.damage_type_utils import normalize_damage_types
from routes.report_query_utils import (
    ALLOWED_SORT_FIELDS,
    build_report_filters,
    parse_list_query_params,
    serialize_report_row,
)
from services.cloudinary_service import upload_image

reports_bp = Blueprint("reports", __name__)


def _run_report_list_query(base_filters):
    conn = None
    cur = None

    try:
        conn = db_connection()
        cur = conn.cursor()

        # Raw report endpoints return database rows directly, with pagination metadata.
        where_clauses, filter_params = build_report_filters(base_filters)
        where_sql = f"WHERE {' AND '.join(where_clauses)}" if where_clauses else ""
        order_by = ALLOWED_SORT_FIELDS[base_filters["sort_by"]]
        sort_order = base_filters["sort_order"].upper()

        count_query = f"""
            SELECT COUNT(*)
            FROM reports
            {where_sql}
        """
        cur.execute(count_query, filter_params)
        total = cur.fetchone()[0]

        data_query = f"""
            SELECT id, user_id, latitude, longitude, borough, rating, damage_types, created_at,
                   COALESCE((
                       SELECT array_agg(ri.image_url ORDER BY ri.id)
                       FROM report_images ri WHERE ri.report_id = reports.id
                   ), ARRAY[]::varchar[]) AS photo_urls
            FROM reports
            {where_sql}
            ORDER BY {order_by} {sort_order}, id DESC
            LIMIT %s OFFSET %s
        """
        cur.execute(
            data_query,
            [*filter_params, base_filters["limit"], base_filters["offset"]],
        )
        reports = [serialize_report_row(row) for row in cur.fetchall()]

        return {
            "success": True,
            "reports": reports,
            "pagination": {
                "limit": base_filters["limit"],
                "offset": base_filters["offset"],
                "count": len(reports),
                "total": total,
            },
            "filters": {
                "borough": base_filters["borough"],
                "rating": base_filters["rating"],
                "start_date": (
                    base_filters["start_date"].isoformat()
                    if base_filters["start_date"]
                    else None
                ),
                "end_date": (
                    base_filters["end_date"].isoformat()
                    if base_filters["end_date"]
                    else None
                ),
                "sort_by": base_filters["sort_by"],
                "sort_order": base_filters["sort_order"],
            },
        }, 200
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()


@reports_bp.route("/api/reports", methods=["GET"])
def get_reports():
    try:
        filters = parse_list_query_params()
        response, status_code = _run_report_list_query(filters)
        return jsonify(response), status_code
    except ValueError as error:
        return jsonify({"success": False, "error": str(error)}), 400
    except Exception as error:
        print("ERROR:", error)
        return jsonify({"success": False, "error": str(error)}), 500


@reports_bp.route("/api/reports/poor", methods=["GET"])
def get_poor_reports():
    try:
        filters = parse_list_query_params()
        filters["rating"] = "poor"
        response, status_code = _run_report_list_query(filters)
        return jsonify(response), status_code
    except ValueError as error:
        return jsonify({"success": False, "error": str(error)}), 400
    except Exception as error:
        print("ERROR:", error)
        return jsonify({"success": False, "error": str(error)}), 500


@reports_bp.route("/api/reports/mine", methods=["GET"])
@jwt_required()
def get_my_reports():
    try:
        identity = get_jwt_identity()
        user_id = identity.get("user_id") if isinstance(identity, dict) else identity

        filters = parse_list_query_params()
        filters["user_id"] = user_id

        response, status_code = _run_report_list_query(filters)
        return jsonify(response), status_code
    except ValueError as error:
        return jsonify({"success": False, "error": str(error)}), 400
    except Exception as error:
        print("ERROR:", error)
        return jsonify({"success": False, "error": str(error)}), 500


@reports_bp.route("/api/reports/<int:report_id>", methods=["PUT"])
@jwt_required()
def edit_report(report_id):
    conn = None
    cur = None
    try:
        identity = get_jwt_identity()
        user_id = identity.get("user_id") if isinstance(identity, dict) else identity

        data = request.get_json()
        rating = data.get("rating")

        if rating and rating not in {"good", "fair", "poor"}:
            return jsonify({"success": False, "error": "Invalid rating"}), 400

        set_clauses = []
        params = []

        if rating is not None:
            set_clauses.append("rating = %s")
            params.append(rating)

        if "damage_types" in data:
            set_clauses.append("damage_types = %s")
            params.append(normalize_damage_types(data["damage_types"]))

        if not set_clauses:
            return jsonify({"success": False, "error": "No fields to update"}), 400

        conn = db_connection()
        cur = conn.cursor()

        cur.execute("SELECT user_id FROM reports WHERE id = %s", (report_id,))
        row = cur.fetchone()
        if not row:
            return jsonify({"success": False, "error": "Report not found"}), 404
        if str(row[0]) != str(user_id):
            return jsonify({"success": False, "error": "Forbidden"}), 403

        params.append(report_id)
        cur.execute(
            f"""
            UPDATE reports
            SET {', '.join(set_clauses)}
            WHERE id = %s
            """,
            params,
        )
        cur.execute(
            """
            SELECT id, user_id, latitude, longitude, borough, rating, damage_types, created_at,
                   COALESCE((
                       SELECT array_agg(ri.image_url ORDER BY ri.id)
                       FROM report_images ri WHERE ri.report_id = reports.id
                   ), ARRAY[]::varchar[]) AS photo_urls
            FROM reports WHERE id = %s
            """,
            (report_id,),
        )
        updated = serialize_report_row(cur.fetchone())
        conn.commit()

        return jsonify({"success": True, "report": updated}), 200
    except Exception as error:
        if conn:
            conn.rollback()
        print("ERROR:", error)
        return jsonify({"success": False, "error": str(error)}), 500
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()


@reports_bp.route("/api/reports/<int:report_id>", methods=["DELETE"])
@jwt_required()
def delete_report(report_id):
    conn = None
    cur = None
    try:
        identity = get_jwt_identity()
        user_id = identity.get("user_id") if isinstance(identity, dict) else identity

        conn = db_connection()
        cur = conn.cursor()

        cur.execute("SELECT user_id FROM reports WHERE id = %s", (report_id,))
        row = cur.fetchone()
        if not row:
            return jsonify({"success": False, "error": "Report not found"}), 404
        if str(row[0]) != str(user_id):
            return jsonify({"success": False, "error": "Forbidden"}), 403

        cur.execute("DELETE FROM reports WHERE id = %s", (report_id,))
        conn.commit()

        return jsonify({"success": True, "message": "Report deleted"}), 200
    except Exception as error:
        if conn:
            conn.rollback()
        print("ERROR:", error)
        return jsonify({"success": False, "error": str(error)}), 500
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()


@reports_bp.route("/api/reports", methods=["POST"])
@jwt_required()
def submit_report():
    conn = None
    cur = None

    try:
        identity = get_jwt_identity()
        if isinstance(identity, dict):
            user_id = identity.get("user_id")
        else:
            user_id = identity

        latitude = request.form.get("latitude")
        longitude = request.form.get("longitude")
        borough = request.form.get("borough")
        rating = request.form.get("rating")
        damage_types = normalize_damage_types(
            json.loads(request.form.get("damage_types", "[]"))
        )

        # Upload up to 3 photos (photo, photo_2, photo_3)
        photo_files = [
            request.files.get("photo"),
            request.files.get("photo_2"),
            request.files.get("photo_3"),
        ]
        uploaded_urls = []
        for f in photo_files:
            if f:
                url = upload_image(f)
                print(f"Cloudinary URL: {url}")
                uploaded_urls.append(url)

        conn = db_connection()
        cur = conn.cursor()
        cur.execute(
            """
            INSERT INTO reports (user_id, latitude, longitude, borough, rating, damage_types)
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING id
            """,
            (user_id, latitude, longitude, borough, rating, damage_types),
        )
        report_id = cur.fetchone()[0]

        # Populate report_images for all uploaded photos
        for url in uploaded_urls:
            cur.execute(
                """
                INSERT INTO report_images (report_id, image_url)
                VALUES (%s, %s)
                """,
                (report_id, url),
            )
        badges_awarded = check_and_award_badges(cur, user_id)
        awarded = check_and_award_challenges(cur, user_id)
        tier_reached = check_and_award_tier(cur, user_id)


        conn.commit()

        return (
            jsonify(
                {
                    "success": True,
                    "message": "Report submitted",
                    "report_id": report_id,
                    "badges_awarded": badges_awarded,
                    "challenges_awarded": awarded,
                    "tier_reached": tier_reached,
                }
            ),
            201,
        )
    except Exception as error:
        if conn:
            conn.rollback()
        print("ERROR:", error)
        return jsonify({"success": False, "error": str(error)}), 500
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()
