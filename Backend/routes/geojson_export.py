import json
from datetime import date

from flask import Blueprint, current_app, jsonify, make_response, request
from pyproj import Transformer

from db import get_db_connection, release_db_connection
from routes.auth_decorators import dot_admin_required
from routes.report_query_utils import ALLOWED_RATINGS, parse_iso_date

geojson_export_bp = Blueprint("geojson_export", __name__)

ALLOWED_EXPORT_STATUSES = {"pending", "reviewed", "resolved", "rejected"}
ALLOWED_SRS = {"4326", "2263"}

# Created once at startup; pyproj Transformer is thread-safe.
_to_2263 = Transformer.from_crs("EPSG:4326", "EPSG:2263", always_xy=True)


def _check_report_columns(cursor):
    cursor.execute(
        "SELECT column_name FROM information_schema.columns WHERE table_name = 'reports'"
    )
    return {row[0] for row in cursor.fetchall()}


def _parse_export_params():
    borough = request.args.get("borough")
    rating = request.args.get("rating")
    status = request.args.get("status")
    srs = request.args.get("srs", "4326")
    updated_after = parse_iso_date(request.args.get("updated_after"), "updated_after")

    if rating and rating not in ALLOWED_RATINGS:
        raise ValueError(f"rating must be one of: {', '.join(sorted(ALLOWED_RATINGS))}")

    if status and status not in ALLOWED_EXPORT_STATUSES:
        raise ValueError(
            f"status must be one of: {', '.join(sorted(ALLOWED_EXPORT_STATUSES))}"
        )

    if srs not in ALLOWED_SRS:
        raise ValueError(f"srs must be one of: {', '.join(sorted(ALLOWED_SRS))}")

    return {
        "borough": borough,
        "rating": rating,
        "status": status,
        "updated_after": updated_after,
        "srs": srs,
    }


def _fetch_export_rows(cursor, filters, columns):
    has_deleted_at = "deleted_at" in columns
    has_status = "status" in columns
    has_updated_at = "updated_at" in columns
    has_version = "version" in columns

    col_meta = {
        "has_status": has_status,
        "has_updated_at": has_updated_at,
        "has_version": has_version,
    }

    select_fields = [
        "r.id",
        "r.latitude",
        "r.longitude",
        "r.borough",
        "r.rating",
        "r.damage_types",
        "r.created_at",
    ]
    if has_status:
        select_fields.append("r.status")
    if has_updated_at:
        select_fields.append("r.updated_at")
    if has_version:
        select_fields.append("r.version")

    # Photo subquery — same pattern as reports.py
    select_fields.append(
        """COALESCE((
            SELECT array_agg(ri.image_url ORDER BY ri.id)
            FROM report_images ri WHERE ri.report_id = r.id
        ), ARRAY[]::varchar[]) AS photo_urls"""
    )

    where_clauses = [
        "r.latitude IS NOT NULL",
        "r.longitude IS NOT NULL",
        "r.latitude BETWEEN -90 AND 90",
        "r.longitude BETWEEN -180 AND 180",
        "NOT (r.latitude = 0 AND r.longitude = 0)",
    ]
    params = []

    if has_deleted_at:
        where_clauses.append("r.deleted_at IS NULL")

    if has_status:
        if filters.get("status"):
            where_clauses.append("r.status = %s")
            params.append(filters["status"])
        else:
            # Exclude rejected by default when status column exists
            where_clauses.append("r.status != %s")
            params.append("rejected")

    if filters.get("borough"):
        where_clauses.append("r.borough = %s")
        params.append(filters["borough"])

    if filters.get("rating"):
        where_clauses.append("r.rating = %s")
        params.append(filters["rating"])

    if filters.get("updated_after"):
        date_column = "r.updated_at" if has_updated_at else "r.created_at"
        where_clauses.append(f"{date_column} >= %s")
        params.append(filters["updated_after"])

    where_sql = f"WHERE {' AND '.join(where_clauses)}"
    query = f"""
        SELECT {', '.join(select_fields)}
        FROM reports r
        {where_sql}
        ORDER BY r.id ASC
    """
    cursor.execute(query, params)
    return cursor.fetchall(), col_meta


def build_report_feature(row, col_meta, srs="4326"):
    has_status = col_meta["has_status"]
    has_updated_at = col_meta["has_updated_at"]
    has_version = col_meta["has_version"]

    idx = 0
    report_id = row[idx]; idx += 1
    lat = row[idx]; idx += 1
    lon = row[idx]; idx += 1
    borough = row[idx]; idx += 1
    rating = row[idx]; idx += 1
    damage_types = row[idx]; idx += 1
    created_at = row[idx]; idx += 1

    status = None
    if has_status:
        status = row[idx]; idx += 1

    updated_at = None
    if has_updated_at:
        updated_at = row[idx]; idx += 1

    version = None
    if has_version:
        version = row[idx]; idx += 1

    photo_urls = list(row[idx]) if row[idx] else []

    try:
        lat = float(lat)
        lon = float(lon)
    except (TypeError, ValueError):
        return None

    if not (-90 <= lat <= 90) or not (-180 <= lon <= 180):
        return None

    def to_iso(dt):
        return dt.isoformat() if dt and hasattr(dt, "isoformat") else None

    def safe_list(val):
        if val is None:
            return []
        return list(val) if isinstance(val, (list, tuple)) else [val]

    properties = {
        "report_id": report_id,
        "rating": rating,
        "damage_types": safe_list(damage_types),
        "borough": borough,
        "photo_url": photo_urls[0] if photo_urls else None,
        "created_at": to_iso(created_at),
    }

    if has_status:
        properties["status"] = status
    if has_updated_at:
        properties["updated_at"] = to_iso(updated_at)
    if has_version:
        properties["version"] = version

    if srs == "2263":
        x, y = _to_2263.transform(lon, lat)
        geometry = {"type": "Point", "coordinates": [round(x, 3), round(y, 3)]}
        # Preserve original WGS84 coordinates for reference
        properties["wgsGeometry"] = {
            "type": "Point",
            "coordinates": [lon, lat],
        }
    else:
        geometry = {"type": "Point", "coordinates": [lon, lat]}

    return {
        "type": "Feature",
        "id": str(report_id),
        "geometry": geometry,
        "properties": properties,
    }


def build_reports_geojson(rows, col_meta, srs="4326"):
    features = []
    for row in rows:
        feature = build_report_feature(row, col_meta, srs=srs)
        if feature is not None:
            features.append(feature)

    collection = {
        "type": "FeatureCollection",
        "name": "Streetlight Base Reports",
        "features": features,
    }

    if srs == "2263":
        collection["crs"] = {
            "type": "name",
            "properties": {"name": "EPSG:2263"},
        }

    return collection


def make_geojson_download_response(geojson, filename):
    body = json.dumps(geojson, ensure_ascii=False, indent=2)
    response = make_response(body, 200)
    response.headers["Content-Type"] = "application/geo+json"
    response.headers["Content-Disposition"] = f'attachment; filename="{filename}"'
    return response


@geojson_export_bp.route("/api/admin/reports/export.geojson", methods=["GET"])
@dot_admin_required
def export_reports_geojson():
    connection = None
    cursor = None

    try:
        filters = _parse_export_params()
        srs = filters["srs"]
        connection = get_db_connection()
        cursor = connection.cursor()

        columns = _check_report_columns(cursor)
        rows, col_meta = _fetch_export_rows(cursor, filters, columns)
        geojson = build_reports_geojson(rows, col_meta, srs=srs)

        today = date.today().isoformat()
        srs_tag = f"_{srs}" if srs != "4326" else ""
        filename = f"streetlight_base_reports{srs_tag}_{today}.json"
        return make_geojson_download_response(geojson, filename)

    except ValueError as error:
        return jsonify({"success": False, "error": str(error)}), 400
    except Exception as error:
        current_app.logger.error(f"GeoJSON export error: {error}")
        return jsonify({"success": False, "error": "Internal server error"}), 500
    finally:
        if cursor:
            cursor.close()
        if connection:
            release_db_connection(connection)
