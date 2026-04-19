from functools import wraps

from flask import jsonify
from flask_jwt_extended import get_jwt, jwt_required
from routes.auth_utils import is_admin_role


def dot_admin_required(fn):
    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        claims = get_jwt()
        if not is_admin_role(claims.get("role")):
            return jsonify({"success": False, "error": "Forbidden"}), 403
        return fn(*args, **kwargs)
    return wrapper


def citizen_required(fn):
    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        claims = get_jwt()
        if is_admin_role(claims.get("role")):
            return jsonify({"success": False, "error": "Forbidden"}), 403
        return fn(*args, **kwargs)
    return wrapper
