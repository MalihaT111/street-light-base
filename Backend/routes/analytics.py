from flask import Blueprint, jsonify, request
from db import db_connection
from routes.damage_type_utils import normalize_damage_type_value
from routes.report_query_utils import build_report_filters, parse_list_query_params

analytics_bp = Blueprint("analytics", __name__)


DEFAULT_HEATMAP_GRID_SIZE = 0.01
MAX_HEATMAP_GRID_SIZE = 10.0


def _parse_heatmap_grid_size():
    raw_grid_size = request.args.get("grid_size")
    if raw_grid_size is None:
        return DEFAULT_HEATMAP_GRID_SIZE

    try:
        grid_size = float(raw_grid_size)
    except (TypeError, ValueError) as error:
        raise ValueError("grid_size must be a number") from error

    if grid_size <= 0:
        raise ValueError("grid_size must be greater than 0")

    if grid_size > MAX_HEATMAP_GRID_SIZE:
        raise ValueError(f"grid_size must be at most {MAX_HEATMAP_GRID_SIZE}")

    return grid_size


def _fetch_grouped_counts(cur, filters, group_column):
    where_clauses, params = build_report_filters(filters)
    where_sql = f"WHERE {' AND '.join(where_clauses)}" if where_clauses else ""

    query = f"""
        SELECT {group_column}, COUNT(*)
        FROM reports
        {where_sql}
        GROUP BY {group_column}
        ORDER BY COUNT(*) DESC, {group_column} ASC
    """
    cur.execute(query, params)
    return cur.fetchall()


def _fetch_reports_over_time(cur, filters, rating=None):
    trend_filters = {
        "borough": filters.get("borough"),
        "rating": rating if rating is not None else filters.get("rating"),
        "start_date": filters.get("start_date"),
        "end_date": filters.get("end_date"),
    }
    where_clauses, params = build_report_filters(trend_filters)
    where_sql = f"WHERE {' AND '.join(where_clauses)}" if where_clauses else ""

    cur.execute(
        f"""
        SELECT DATE_TRUNC('month', created_at) AS bucket, COUNT(*)
        FROM reports
        {where_sql}
        GROUP BY bucket
        ORDER BY bucket ASC
        """,
        params,
    )
    return cur.fetchall()


def _fetch_damage_type_counts(cur, filters):
    where_clauses, params = build_report_filters(filters)
    where_sql = f"WHERE {' AND '.join(where_clauses)}" if where_clauses else ""

    cur.execute(
        f"""
        SELECT damage_type, COUNT(*)
        FROM (
            SELECT UNNEST(damage_types) AS damage_type
            FROM reports
            {where_sql}
        ) expanded_damage_types
        GROUP BY damage_type
        ORDER BY COUNT(*) DESC, damage_type ASC
        """,
        params,
    )
    return cur.fetchall()


def _normalize_damage_type_counts(rows):
    merged_counts = {}

    for raw_damage_type, count in rows:
        normalized_damage_type = normalize_damage_type_value(raw_damage_type)
        if not normalized_damage_type:
            continue

        merged_counts[normalized_damage_type] = (
            merged_counts.get(normalized_damage_type, 0) + count
        )

    return sorted(
        merged_counts.items(),
        key=lambda item: (-item[1], item[0]),
    )


def _fetch_heatmap_buckets(cur, filters, grid_size):
    where_clauses, filter_params = build_report_filters(filters, table_alias="r")

    # Exclude null, obviously invalid, and defaulted coordinates before bucketing.
    where_clauses.extend(
        [
            "r.latitude IS NOT NULL",
            "r.longitude IS NOT NULL",
            "r.latitude BETWEEN -90 AND 90",
            "r.longitude BETWEEN -180 AND 180",
            "NOT (r.latitude = 0 AND r.longitude = 0)",
        ]
    )
    where_sql = f"WHERE {' AND '.join(where_clauses)}"

    query = f"""
        SELECT
            ROUND((FLOOR(r.latitude / %s) * %s)::numeric, 6) AS bucket_latitude,
            ROUND((FLOOR(r.longitude / %s) * %s)::numeric, 6) AS bucket_longitude,
            COUNT(*) AS report_count
        FROM reports r
        {where_sql}
        GROUP BY bucket_latitude, bucket_longitude
        ORDER BY report_count DESC, bucket_latitude ASC, bucket_longitude ASC
    """
    cur.execute(
        query,
        [grid_size, grid_size, grid_size, grid_size, *filter_params],
    )
    return cur.fetchall()


@analytics_bp.route("/api/analytics/summary", methods=["GET"])
def get_analytics_summary():
    connection = None
    cursor = None

    try:
        connection = db_connection()
        cursor = connection.cursor()

        cursor.execute("SELECT current_database(), current_schema()")
        db_info = cursor.fetchone()
        print("DB info:", db_info)

        cursor.execute("SELECT COUNT(*) FROM reports")
        total_reports = cursor.fetchone()[0]

        cursor.execute(
            """
            SELECT
                COUNT(*) FILTER (
                    WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)
                ) AS current_month_reports,
                COUNT(*) FILTER (
                    WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
                    AND created_at < DATE_TRUNC('month', CURRENT_DATE)
                ) AS last_month_reports
            FROM reports
            """
        )
        current_month_reports, last_month_reports = cursor.fetchone()
        print("Total reports from API:", total_reports)
        print("DB connection details:", connection.dsn)
        return jsonify({
            "success": True,
            "total_reports": total_reports,
            "current_month_reports": current_month_reports,
            "last_month_reports": last_month_reports,
        }), 200

    except Exception as error:
        print(f"Analytics summary error: {error}")
        return jsonify({"success": False, "error": str(error)}), 500

    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()


@analytics_bp.route("/api/reports/analytics", methods=["GET"])
def get_reports_analytics():
    connection = None
    cursor = None

    try:
        filters = parse_list_query_params()
        connection = db_connection()
        cursor = connection.cursor()

        # Analytics endpoints return aggregated chart-ready data only.
        counts_by_rating_rows = _fetch_grouped_counts(cursor, filters, "rating")
        counts_by_borough_rows = _fetch_grouped_counts(cursor, filters, "borough")
        reports_over_time_rows = _fetch_reports_over_time(cursor, filters)
        poor_reports_over_time_rows = _fetch_reports_over_time(
            cursor, filters, rating="poor"
        )
        damage_type_rows = _normalize_damage_type_counts(
            _fetch_damage_type_counts(cursor, filters)
        )

        return jsonify(
            {
                "success": True,
                "analytics": {
                    "counts_by_rating": [
                        {"rating": rating, "count": count}
                        for rating, count in counts_by_rating_rows
                    ],
                    "counts_by_borough": [
                        {"borough": borough, "count": count}
                        for borough, count in counts_by_borough_rows
                    ],
                    "reports_over_time": [
                        {
                            "bucket": bucket.date().isoformat() if bucket else None,
                            "count": count,
                        }
                        for bucket, count in reports_over_time_rows
                    ],
                    "poor_reports_over_time": [
                        {
                            "bucket": bucket.date().isoformat() if bucket else None,
                            "count": count,
                        }
                        for bucket, count in poor_reports_over_time_rows
                    ],
                    "damage_type_counts": [
                        {"damage_type": damage_type, "count": count}
                        for damage_type, count in damage_type_rows
                    ],
                },
            }
        ), 200
    except ValueError as error:
        return jsonify({"success": False, "error": str(error)}), 400
    except Exception as error:
        print(f"Reports analytics error: {error}")
        return jsonify({"success": False, "error": str(error)}), 500
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()


@analytics_bp.route("/api/reports/analytics/heatmap", methods=["GET"])
def get_reports_heatmap():
    connection = None
    cursor = None

    try:
        filters = parse_list_query_params()
        grid_size = _parse_heatmap_grid_size()
        connection = db_connection()
        cursor = connection.cursor()

        # Heatmaps should return density buckets rather than paginated raw points.
        bucket_rows = _fetch_heatmap_buckets(cursor, filters, grid_size)
        heatmap = [
            {
                "latitude": float(row[0]),
                "longitude": float(row[1]),
                "count": row[2],
            }
            for row in bucket_rows
        ]

        return jsonify({"success": True, "heatmap": heatmap}), 200
    except ValueError as error:
        return jsonify({"success": False, "error": str(error)}), 400
    except Exception as error:
        print(f"Reports heatmap error: {error}")
        return jsonify({"success": False, "error": str(error)}), 500
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()
