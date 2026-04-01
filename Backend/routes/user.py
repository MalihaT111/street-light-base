import bcrypt
from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from db import db_connection

user_bp = Blueprint("user", __name__)


@user_bp.route("/api/user", methods=["PUT"])
@jwt_required()
def update_user():
    connection = None
    cursor = None
    try:
        user_id = get_jwt_identity()
        data = request.get_json() or {}
        username = data.get("username", "").strip()
        email = data.get("email", "").strip()

        if not username:
            return jsonify({"success": False, "error": "Name is required"}), 400
        if not email:
            return jsonify({"success": False, "error": "Email is required"}), 400

        connection = db_connection()
        cursor = connection.cursor()

        # Check email/username not taken by another user
        cursor.execute(
            "SELECT id FROM users WHERE (email = %s OR username = %s) AND id != %s",
            (email, username, int(user_id)),
        )
        if cursor.fetchone():
            return jsonify({"success": False, "error": "Email or username already in use"}), 409

        cursor.execute(
            "UPDATE users SET username = %s, email = %s WHERE id = %s RETURNING id, username, email, role",
            (username, email, int(user_id)),
        )
        row = cursor.fetchone()
        if not row:
            return jsonify({"success": False, "error": "User not found"}), 404
        connection.commit()

        return jsonify({
            "success": True,
            "user": {"id": row[0], "username": row[1], "email": row[2], "role": row[3]},
        }), 200
    except Exception as e:
        if connection:
            connection.rollback()
        return jsonify({"success": False, "error": str(e)}), 500
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()


@user_bp.route("/api/user/password", methods=["PUT"])
@jwt_required()
def update_password():
    connection = None
    cursor = None
    try:
        user_id = get_jwt_identity()
        data = request.get_json() or {}
        current_password = data.get("currentPassword", "")
        new_password = data.get("newPassword", "")

        if not current_password or not new_password:
            return jsonify({"success": False, "error": "All password fields are required"}), 400
        if len(new_password) < 8:
            return jsonify({"success": False, "error": "Password must be at least 8 characters"}), 400

        connection = db_connection()
        cursor = connection.cursor()
        cursor.execute("SELECT password_hash FROM users WHERE id = %s", (int(user_id),))
        row = cursor.fetchone()
        if not row:
            return jsonify({"success": False, "error": "User not found"}), 404

        if not bcrypt.checkpw(current_password.encode("utf-8"), row[0].encode("utf-8")):
            return jsonify({"success": False, "error": "Current password is incorrect"}), 401

        new_hash = bcrypt.hashpw(new_password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
        cursor.execute("UPDATE users SET password_hash = %s WHERE id = %s", (new_hash, int(user_id)))
        connection.commit()

        return jsonify({"success": True}), 200
    except Exception as e:
        if connection:
            connection.rollback()
        return jsonify({"success": False, "error": str(e)}), 500
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()


@user_bp.route("/api/user", methods=["DELETE"])
@jwt_required()
def delete_user():
    connection = None
    cursor = None
    try:
        user_id = get_jwt_identity()

        connection = db_connection()
        cursor = connection.cursor()
        cursor.execute("DELETE FROM users WHERE id = %s", (int(user_id),))
        if cursor.rowcount == 0:
            return jsonify({"success": False, "error": "User not found"}), 404
        connection.commit()

        return jsonify({"success": True}), 200
    except Exception as e:
        if connection:
            connection.rollback()
        return jsonify({"success": False, "error": str(e)}), 500
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()
