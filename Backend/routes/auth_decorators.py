from functools import wraps

from flask import jsonify
from flask_jwt_extended import get_jwt, jwt_required


def dot_admin_required(fn):
    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        claims = get_jwt()
        if claims.get("role") != "admin":
            return jsonify({"success": False, "error": "Forbidden"}), 403
        return fn(*args, **kwargs)
    return wrapper


def citizen_required(fn):
    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        claims = get_jwt()
        if claims.get("role") == "admin":
            return jsonify({"success": False, "error": "Forbidden"}), 403
        return fn(*args, **kwargs)
    return wrapper
