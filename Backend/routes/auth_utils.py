from flask_jwt_extended import get_jwt_identity


ADMIN_ROLES = {"admin", "dot_admin", "ppl"}


def normalize_role(role):
    return str(role or "").strip().lower()


def is_admin_role(role):
    return normalize_role(role) in ADMIN_ROLES


def client_role(role):
    return "admin" if is_admin_role(role) else "citizen"

def get_current_user_id():
    identity = get_jwt_identity()
    uid = identity.get("user_id") if isinstance(identity, dict) else identity
    return int(uid) if uid else None
