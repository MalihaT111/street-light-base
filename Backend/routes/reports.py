from flask import Blueprint, request, jsonify
import json
from flask_jwt_extended import jwt_required, get_jwt_identity
from db import db_connection
from services.cloudinary_service import upload_image

reports_bp = Blueprint("reports", __name__)


@reports_bp.route("/api/reports", methods=["POST"])
@jwt_required()
def submit_report():
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
        damage_types = json.loads(request.form.get("damage_types", "[]"))

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
        cur.close()
        conn.close()

        return jsonify({"message": "Report submitted", "report_id": report_id, "photo_url": photo_url}), 201

    except Exception as e:
        print("ERROR:", e)
        return jsonify({"error": str(e)}), 500