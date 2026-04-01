import os
import smtplib
from datetime import timedelta
from email.message import EmailMessage

import bcrypt
from flask import Blueprint, jsonify, request
from flask_jwt_extended import create_access_token, get_jwt, get_jwt_identity, jwt_required

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
        role = user_info.get("role", "user")
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


def _send_reset_email(recipient_email, token):
    sender_email = os.getenv("MAIL")
    sender_password = os.getenv("MAIL_PASSWORD")
    reset_link = f"http://localhost:5173/reset-password?token={token}"
    msg = EmailMessage()
    msg["Subject"] = "Password Reset Request"
    msg["From"] = sender_email
    msg["To"] = recipient_email
    msg.set_content(
        f"""Hello,

Please click the link below to set a new password:

{reset_link}

If you did not request this, please ignore this email.
This link will expire in 30 minutes.
"""
    )
    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
        server.login(sender_email, sender_password)
        server.send_message(msg)


@auth_bp.route("/api/forgot-password", methods=["POST"])
def forget_password():
    connection = None
    cursor = None
    try:
        data = request.get_json() or {}
        email = data.get("email")
        if not email:
            return jsonify({"success": False, "error": "Email is required"}), 400
        connection = db_connection()
        cursor = connection.cursor()
        cursor.execute("SELECT id FROM users WHERE email = %s", (email,))
        user = cursor.fetchone()
        if not user:
            return jsonify({"success": True, "message": "If that email exists, a reset link has been sent."}), 200
        user_id = user[0]
        reset_token = create_access_token(
            identity=str(user_id),
            additional_claims={"type": "reset"},
            expires_delta=timedelta(minutes=30),
        )
        _send_reset_email(email, reset_token)
        return jsonify({"success": True, "message": "If email exists, a reset link has been sent to the corresponding email."}), 200
    except Exception:
        return jsonify({"success": False, "error": "Reset failed"}), 500
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()


@auth_bp.route("/api/reset-password", methods=["POST"])
@jwt_required()
def reset_password():
    connection = None
    cursor = None
    try:
        data = request.get_json() or {}
        new_password = data.get("new_password")
        if not new_password:
            return jsonify({"success": False, "error": "Password is required"}), 400
        if len(new_password) < 8:
            return jsonify({"success": False, "error": "Password must be at least 8 characters long"}), 400
        jwt_claim = get_jwt()
        user_id = get_jwt_identity()
        if jwt_claim.get("type") != "reset":
            return jsonify({"success": False, "error": "Invalid reset token"}), 400
        password_hash = bcrypt.hashpw(new_password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
        connection = db_connection()
        cursor = connection.cursor()
        cursor.execute("UPDATE users SET password_hash = %s WHERE id = %s", (password_hash, int(user_id)))
        if cursor.rowcount == 0:
            return jsonify({"success": False, "error": "User not found"}), 404
        connection.commit()
        return jsonify({"success": True, "message": "Password updated successfully"}), 200
    except Exception as e:
        if connection:
            connection.rollback()
        print("RESET ERROR:", e)
        return jsonify({"success": False, "error": str(e)}), 500
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()
def _send_verification_email(recipient_email, token):
    sender_email = os.getenv('MAIL')
    sender_password = os.getenv('MAIL_PASSWORD')
    link = f"http://localhost:5173/verify-email?token={token}"
    msg = EmailMessage()
    msg["Subject"] = "Email Verification Request"
    msg["From"] = sender_email
    msg["To"] = recipient_email
    msg.set_content(f'Click the link to verify your email:\n{link}\n\nExpires in 10 minutes.')
    with smtplib.SMTP_SSL('smtp.gmail.com', 465) as server:
        server.login(sender_email, sender_password)
        server.send_message(msg)
@auth_bp.route("/api/send-verification", methods=['POST'])
@jwt_required()
def send_verification():
    connection = None
    cursor = None
    try:
        user_id = get_jwt_identity()
        token = create_access_token(
            identity=str(user_id),
            additional_claims={"type": "verify_email"},
            expires_delta=timedelta(minutes=30)
        )
        connection = db_connection()
        cursor = connection.cursor()
        cursor.execute("SELECT email FROM users WHERE id = %s", (user_id,))
        row = cursor.fetchone()
        if not row:
            return jsonify({"success": False, "error": "User not found"}), 404
        _send_verification_email(row[0], token)
        return jsonify({"success": True, "message": "Verification email sent"}), 200
    except Exception as e:
        return jsonify({"success": False, "error": "Failed to send"}), 500
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()
@auth_bp.route("/api/email-verification", methods=['POST'])
@jwt_required()
def email_verification():
    connection = None
    cursor = None
    try:
        jwt_claim = get_jwt()
        user_id = get_jwt_identity()
        if jwt_claim.get("type") != "verify_email":
            return jsonify({"success": False, "error": "Invalid token"}), 400
        connection = db_connection()
        cursor = connection.cursor()
        cursor.execute("UPDATE users SET email_verified = TRUE WHERE id = %s", (int(user_id),))
        connection.commit()
        return jsonify({"success": True, "message": "Email verified"}), 200
    except Exception as e:
        print(f"Verify email error: {e}")
        if connection:
            connection.rollback()
        return jsonify({"success": False, "error": "Verification failed"}), 500
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()
