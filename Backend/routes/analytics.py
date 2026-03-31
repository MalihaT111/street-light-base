from db import db_connection
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity

analytics_bp = Blueprint("analytics", __name__)