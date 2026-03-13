from flask import Flask, jsonify, request
from flask_cors import CORS
import psycopg2
import bcrypt
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
import os
from dotenv import load_dotenv
load_dotenv()
app = Flask(__name__)
app.config["JWT_SECRET_KEY"] = os.getenv("SECRET_KEY")
app.config['WTF_CSRF_ENABLED'] = False

# CORS configuration for Flask-CORS 4.0.0
CORS(app, resources={
    r"/*": {
        "origins": ["http://localhost:5173"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True
    }
})

jwt = JWTManager(app)

@app.route('/api/test', methods=['GET', 'OPTIONS'])
def test():
    return jsonify({'message': 'CORS is working!', 'success': True}), 200

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
        first_name = user_info.get('first_name', '')
        last_name = user_info.get('last_name', '')
        role = 'user'  # Force all registrations to 'user' role
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
            INSERT INTO users (username, email, password_hash, role, first_name, last_name)
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING id, username, email, role, first_name, last_name
            """,
            (username, email, password_hash, role, first_name, last_name)
        )
        new_user = cursor.fetchone()
        connection.commit()
        return jsonify({
            'success': True,
            'user': {
                'id': new_user[0],
                'username': new_user[1],
                'email': new_user[2],
                'role': new_user[3],
                'first_name': new_user[4],
                'last_name': new_user[5]
            }
        }), 201
        
    except Exception as e:
        print(f"Registration error: {e}")
        if connection:
            connection.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500
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
        
        # Accept either email or username
        login_identifier = email or username
        if not login_identifier or not password:
            return jsonify({'success': False, 'error': 'Email/username and password required'}), 400
        
        connection = db_connection()
        cursor = connection.cursor()
        
        # Check if login_identifier is email or username
        cursor.execute(
            "SELECT id, username, email, password_hash, role FROM users WHERE email = %s OR username = %s",
            (login_identifier, login_identifier)
        )
        user = cursor.fetchone()
        
        if not user or not bcrypt.checkpw(password.encode('utf-8'), user[3].encode('utf-8')):
            return jsonify({'success': False, 'error': 'Invalid credentials'}), 401
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
    app.run(host='0.0.0.0', port=5001, debug=os.getenv("FLASK_ENV") == "development")
