import bcrypt
from flask import Blueprint, jsonify, request
from flask_jwt_extended import create_access_token

from db import db_connection


auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/api/test", methods=["GET", "OPTIONS"])
def test():
    return jsonify({"message": "CORS is working!", "success": True}), 200


@auth_bp.route("/api/register", methods=["POST"])
def register():
    connection = None
    cursor = None

    try:
        user_info = request.get_json() or {}
        username = user_info.get("username")
        email = user_info.get("email")
        first_name = user_info.get("first_name", "")
        last_name = user_info.get("last_name", "")
        role = "user"
        password = user_info.get("password")

        if not email:
            return jsonify({"success": False, "error": "Email is required"}), 400
        if not password:
            return jsonify({"success": False, "error": "Password is required"}), 400
        if not username:
            return jsonify({"success": False, "error": "Username is required"}), 400
        if len(password) < 8:
            return jsonify(
                {
                    "success": False,
                    "error": "Password must be at least 8 characters long",
                }
            ), 400

        password_hash = bcrypt.hashpw(
            password.encode("utf-8"), bcrypt.gensalt()
        ).decode("utf-8")

        connection = db_connection()
        cursor = connection.cursor()
        cursor.execute(
            "SELECT id FROM users WHERE email = %s OR username = %s",
            (email, username),
        )

        if cursor.fetchone():
            return jsonify({"success": False, "error": "User already exists"}), 409

        cursor.execute(
            """
            INSERT INTO users (username, email, password_hash, role, first_name, last_name)
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING id, username, email, role, first_name, last_name
            """,
            (username, email, password_hash, role, first_name, last_name),
        )
        new_user = cursor.fetchone()
        connection.commit()

        return jsonify(
            {
                "success": True,
                "user": {
                    "id": new_user[0],
                    "username": new_user[1],
                    "email": new_user[2],
                    "role": new_user[3],
                    "first_name": new_user[4],
                    "last_name": new_user[5],
                },
            }
        ), 201
    except Exception as error:
        print(f"Registration error: {error}")
        if connection:
            connection.rollback()
        return jsonify({"success": False, "error": str(error)}), 500
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()


@auth_bp.route("/api/login", methods=["POST"])
def login():
    connection = None
    cursor = None

    try:
        data = request.get_json() or {}
        username = data.get("username")
        email = data.get("email")
        password = data.get("password")

        login_identifier = email or username
        if not login_identifier or not password:
            return jsonify(
                {"success": False, "error": "Email/username and password required"}
            ), 400

        connection = db_connection()
        cursor = connection.cursor()
        cursor.execute(
            "SELECT id, username, email, password_hash, role FROM users WHERE email = %s OR username = %s",
            (login_identifier, login_identifier),
        )
        user = cursor.fetchone()

        if not user or not bcrypt.checkpw(
            password.encode("utf-8"), user[3].encode("utf-8")
        ):
            return jsonify({"success": False, "error": "Invalid credentials"}), 401

        access_token = create_access_token(identity=str(user[0]))
        return jsonify(
            {
                "success": True,
                "access_token": access_token,
                "user": {
                    "id": user[0],
                    "username": user[1],
                    "email": user[2],
                    "role": user[4],
                },
            }
        ), 200
    except Exception:
        return jsonify({"success": False, "error": "Login failed"}), 500
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()