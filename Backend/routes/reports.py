import json

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

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
            SELECT id, user_id, latitude, longitude, borough, rating, photo_url, damage_types, created_at
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
    conn = None
    cur = None
    try:
        identity = get_jwt_identity()
        user_id = identity.get("user_id") if isinstance(identity, dict) else identity

        filters = parse_list_query_params()
        conn = db_connection()
        cur = conn.cursor()

        where_clauses, filter_params = build_report_filters(filters)
        where_clauses.append("user_id = %s")
        filter_params.append(user_id)
        where_sql = f"WHERE {' AND '.join(where_clauses)}"
        order_by = ALLOWED_SORT_FIELDS[filters["sort_by"]]
        sort_order = filters["sort_order"].upper()

        cur.execute(f"SELECT COUNT(*) FROM reports {where_sql}", filter_params)
        total = cur.fetchone()[0]

        data_query = f"""
            SELECT id, user_id, latitude, longitude, borough, rating, photo_url, damage_types, created_at
            FROM reports
            {where_sql}
            ORDER BY {order_by} {sort_order}, id DESC
            LIMIT %s OFFSET %s
        """
        cur.execute(data_query, [*filter_params, filters["limit"], filters["offset"]])
        reports = [serialize_report_row(row) for row in cur.fetchall()]

        return jsonify({
            "success": True,
            "reports": reports,
            "pagination": {
                "limit": filters["limit"],
                "offset": filters["offset"],
                "count": len(reports),
                "total": total,
            },
        }), 200
    except ValueError as error:
        return jsonify({"success": False, "error": str(error)}), 400
    except Exception as error:
        print("ERROR:", error)
        return jsonify({"success": False, "error": str(error)}), 500
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()


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
        damage_types = normalize_damage_types(data.get("damage_types", []))

        if rating and rating not in {"good", "fair", "poor"}:
            return jsonify({"success": False, "error": "Invalid rating"}), 400

        conn = db_connection()
        cur = conn.cursor()

        cur.execute("SELECT user_id FROM reports WHERE id = %s", (report_id,))
        row = cur.fetchone()
        if not row:
            return jsonify({"success": False, "error": "Report not found"}), 404
        if str(row[0]) != str(user_id):
            return jsonify({"success": False, "error": "Forbidden"}), 403

        cur.execute(
            """
            UPDATE reports
            SET rating = COALESCE(%s, rating),
                damage_types = %s
            WHERE id = %s
            RETURNING id, user_id, latitude, longitude, borough, rating, photo_url, damage_types, created_at
            """,
            (rating, damage_types, report_id),
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

        photo = request.files.get("photo")
        latitude = request.form.get("latitude")
        longitude = request.form.get("longitude")
        borough = request.form.get("borough")
        rating = request.form.get("rating")
        damage_types = normalize_damage_types(
            json.loads(request.form.get("damage_types", "[]"))
        )

        photo_url = None
        if photo:
            photo_url = upload_image(photo)
            print(f"Cloudinary URL: {photo_url}")

        conn = db_connection()
        cur = conn.cursor()
        cur.execute(
            """
            INSERT INTO reports (user_id, latitude, longitude, borough, rating, photo_url, damage_types)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            RETURNING id
            """,
            (user_id, latitude, longitude, borough, rating, photo_url, damage_types),
        )
        report_id = cur.fetchone()[0]
        conn.commit()

        return (
            jsonify(
                {
                    "success": True,
                    "message": "Report submitted",
                    "report_id": report_id,
                    "photo_url": photo_url,
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
