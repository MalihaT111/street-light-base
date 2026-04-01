from datetime import datetime

from flask import request


ALLOWED_RATINGS = {"good", "fair", "poor"}
ALLOWED_SORT_FIELDS = {
    "created_at": "created_at",
    "borough": "borough",
    "rating": "rating",
    "id": "id",
}
ALLOWED_SORT_ORDERS = {"asc", "desc"}
DEFAULT_LIMIT = 50
MAX_LIMIT = 200


def parse_iso_date(value, field_name):
    if not value:
        return None

    try:
        return datetime.fromisoformat(value)
    except ValueError as error:
        raise ValueError(
            f"{field_name} must be a valid ISO date or datetime string"
        ) from error


def parse_positive_int(value, default, field_name, minimum=0, maximum=None):
    if value is None:
        return default

    try:
        parsed_value = int(value)
    except (TypeError, ValueError) as error:
        raise ValueError(f"{field_name} must be an integer") from error

    if parsed_value < minimum:
        raise ValueError(f"{field_name} must be at least {minimum}")

    if maximum is not None and parsed_value > maximum:
        raise ValueError(f"{field_name} must be at most {maximum}")

    return parsed_value


def parse_list_query_params():
    borough = request.args.get("borough")
    rating = request.args.get("rating")
    start_date = parse_iso_date(request.args.get("start_date"), "start_date")
    end_date = parse_iso_date(request.args.get("end_date"), "end_date")
    limit = parse_positive_int(
        request.args.get("limit"), DEFAULT_LIMIT, "limit", minimum=1, maximum=MAX_LIMIT
    )
    offset = parse_positive_int(request.args.get("offset"), 0, "offset", minimum=0)
    sort_by = request.args.get("sort_by", "created_at").lower()
    sort_order = request.args.get("sort_order", "desc").lower()

    if rating and rating not in ALLOWED_RATINGS:
        raise ValueError("rating must be one of: good, fair, poor")

    if sort_by not in ALLOWED_SORT_FIELDS:
        raise ValueError(
            f"sort_by must be one of: {', '.join(sorted(ALLOWED_SORT_FIELDS))}"
        )

    if sort_order not in ALLOWED_SORT_ORDERS:
        raise ValueError("sort_order must be either asc or desc")

    if start_date and end_date and start_date > end_date:
        raise ValueError("start_date must be before or equal to end_date")

    return {
        "borough": borough,
        "rating": rating,
        "start_date": start_date,
        "end_date": end_date,
        "limit": limit,
        "offset": offset,
        "sort_by": sort_by,
        "sort_order": sort_order,
    }


def build_report_filters(filters, table_alias=""):
    column_prefix = f"{table_alias}." if table_alias else ""
    where_clauses = []
    parameters = []

    if filters.get("user_id") is not None:
        where_clauses.append(f"{column_prefix}user_id = %s")
        parameters.append(filters["user_id"])

    if filters.get("borough"):
        where_clauses.append(f"{column_prefix}borough = %s")
        parameters.append(filters["borough"])

    if filters.get("rating"):
        where_clauses.append(f"{column_prefix}rating = %s")
        parameters.append(filters["rating"])

    if filters.get("start_date"):
        where_clauses.append(f"{column_prefix}created_at >= %s")
        parameters.append(filters["start_date"])

    if filters.get("end_date"):
        where_clauses.append(f"{column_prefix}created_at <= %s")
        parameters.append(filters["end_date"])

    return where_clauses, parameters


def serialize_report_row(row):
    # Column order (photo_url removed from reports table):
    # 0: id, 1: user_id, 2: latitude, 3: longitude, 4: borough,
    # 5: rating, 6: damage_types, 7: created_at, 8: photo_urls (subquery)
    photo_urls = list(row[8]) if len(row) > 8 and row[8] else []
    return {
        "id": row[0],
        "user_id": row[1],
        "latitude": row[2],
        "longitude": row[3],
        "borough": row[4],
        "rating": row[5],
        "photo_url": photo_urls[0] if photo_urls else None,
        "photo_urls": photo_urls,
        "damage_types": row[6] or [],
        "created_at": row[7].isoformat() if row[7] else None,
    }
