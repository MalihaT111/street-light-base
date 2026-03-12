from flask import Flask, jsonify, request
import psycopg2
import bcrypt
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
import os
from dotenv import load_dotenv
load_dotenv()
app = Flask(__name__)
app.config["JWT_SECRET_KEY"] = os.getenv("SECRET_KEY")
app.config['WTF_CSRF_ENABLED'] = False
jwt = JWTManager(app)
def db_connection():
    return psycopg2.connect(dbname=os.getenv("DB_NAME"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        host=os.getenv("DB_HOST"),
        port=os.getenv("DB_PORT"))
@app.route('/api/register', methods=['POST'])
def register():
    connection = None
    cursor = None
    try:
        user_info = request.get_json()
        username = user_info.get('username')
        email = user_info.get('email')
        role = user_info.get('role')
        password = user_info.get('password')
        if not user_info.get('email'):
            return jsonify({'success': False, 'error': 'Email is required'}), 400
        if not user_info.get('password'):
            return jsonify({'success': False, 'error': 'Password is required'}), 400
        if not user_info.get('username'):
            return jsonify({'success': False, 'error': 'Username is required'}), 400
        if len(password) < 8:  # For security purposes, we want a secure password that's at least 8 characters long
            return jsonify({
                'success': False,
                'error': 'Password must be at least 8 characters long'
            }), 400
        password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8') #store hashed pass in db
        connection = db_connection()
        cursor = connection.cursor()
        cursor.execute(
            "SELECT id FROM users WHERE email = %s OR username = %s",
            (email, username)
        )
        if cursor.fetchone():
            return jsonify({'success': False, 'error': 'User already exists'}), 409
        cursor.execute(
            """
            INSERT INTO users (username, email, password_hash, role)
            VALUES (%s, %s, %s, %s)
            RETURNING id, username, email, role
            """,
            (username, email, password_hash, role)
        )
        new_user = cursor.fetchone()
        connection.commit()
        return jsonify({
            'success': True,
            'user': {
                'id': new_user[0],
                'username': new_user[1],
                'email': new_user[2],
                'role': new_user[3]
            }
        }), 201
    except Exception as e:
        return jsonify({'success': False, 'error': 'Registration failed'}), 500
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()

@app.route('/api/login', methods=['POST'])
def login():
    connection = None
    cursor = None
    try:
        data = request.get_json()
        username = data.get('username')
        email = data.get('email')
        role = data.get('role')
        password = data.get('password')
        if not email or not password:
            return jsonify({'success': False, 'error': 'Email and password required'}), 400
        connection = db_connection()
        cursor = connection.cursor()
        cursor.execute(
            "SELECT id, username, email, password_hash, role FROM users WHERE email = %s",
            (email,)
        )
        user = cursor.fetchone()
        if not user: #check if email exists
            return jsonify({'success': False, 'error': 'User not found'}), 401
        if not bcrypt.checkpw(password.encode('utf-8'), user[3].encode('utf-8')): #check if pass entered matches
            return jsonify({'success': False, 'error': 'Wrong password'}), 401
        access_token = create_access_token(identity={
            'user_id': user[0],
            'username': user[1],
            'email': user[2],
            'role': user[4]
        })
        return jsonify({
            'success': True,
            'access_token': access_token,
            'user': {
                'id': user[0],
                'username': user[1],
                'email': user[2],
                'role': user[4]
            }
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': 'Login failed'}), 500
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()
if __name__ == "__main__":
    app.run(debug=True)
