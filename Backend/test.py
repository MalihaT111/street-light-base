#!/usr/bin/env python3
"""
Simple API smoke-test runner for the streetlight backend.

Examples:
  python3 Backend/test_api_endpoints.py
  python3 Backend/test_api_endpoints.py --base-url http://localhost:5001
  python3 Backend/test_api_endpoints.py --username alice --password secret123
  python3 Backend/test_api_endpoints.py --token "<jwt>" --image /path/to/photo.jpg --run-write-tests
"""

import argparse
import json
import mimetypes
import os
import sys
import uuid
from datetime import datetime, timedelta, timezone
from urllib import error, parse, request


DEFAULT_BASE_URL = "http://localhost:5001"


def build_url(base_url, path, query=None):
    query_string = f"?{parse.urlencode(query)}" if query else ""
    return f"{base_url.rstrip('/')}{path}{query_string}"


def preview_payload(payload, max_length=220):
    text = json.dumps(payload, indent=2, default=str)
    if len(text) <= max_length:
        return text
    return f"{text[:max_length]}..."


def perform_request(method, url, headers=None, json_body=None, form_body=None):
    headers = headers or {}
    body = None

    if json_body is not None:
        body = json.dumps(json_body).encode("utf-8")
        headers = {**headers, "Content-Type": "application/json"}
    elif form_body is not None:
        body = form_body

    req = request.Request(url, data=body, headers=headers, method=method)

    try:
        with request.urlopen(req, timeout=20) as response:
            raw = response.read().decode("utf-8")
            payload = json.loads(raw) if raw else {}
            return response.status, payload
    except error.HTTPError as exc:
        raw = exc.read().decode("utf-8")
        try:
            payload = json.loads(raw) if raw else {}
        except json.JSONDecodeError:
            payload = {"raw": raw}
        return exc.code, payload


def build_multipart_form(fields, file_field=None):
    boundary = f"----StreetlightBoundary{uuid.uuid4().hex}"
    chunks = []

    for name, value in fields.items():
        chunks.extend(
            [
                f"--{boundary}".encode("utf-8"),
                f'Content-Disposition: form-data; name="{name}"'.encode("utf-8"),
                b"",
                str(value).encode("utf-8"),
            ]
        )

    if file_field:
        field_name, file_path = file_field
        filename = os.path.basename(file_path)
        content_type = mimetypes.guess_type(filename)[0] or "application/octet-stream"
        with open(file_path, "rb") as file_handle:
            file_bytes = file_handle.read()
        chunks.extend(
            [
                f"--{boundary}".encode("utf-8"),
                (
                    f'Content-Disposition: form-data; name="{field_name}"; '
                    f'filename="{filename}"'
                ).encode("utf-8"),
                f"Content-Type: {content_type}".encode("utf-8"),
                b"",
                file_bytes,
            ]
        )

    chunks.append(f"--{boundary}--".encode("utf-8"))
    chunks.append(b"")
    return b"\r\n".join(chunks), boundary


def print_result(name, status, payload, expected_statuses):
    expecting_error = any(expected_status >= 400 for expected_status in expected_statuses)
    ok = status in expected_statuses and (
        expecting_error or payload.get("success", True) is not False
    )
    label = "PASS" if ok else "FAIL"
    print(f"[{label}] {name}: HTTP {status}")
    print(preview_payload(payload))
    print()
    return ok


def validate_heatmap_response(payload):
    if payload.get("success") is not True:
        return False, "response.success must be true"

    heatmap = payload.get("heatmap")
    if not isinstance(heatmap, list):
        return False, "response.heatmap must be a list"

    for index, bucket in enumerate(heatmap):
        if not isinstance(bucket, dict):
            return False, f"heatmap[{index}] must be an object"

        if set(bucket.keys()) != {"latitude", "longitude", "count"}:
            return (
                False,
                f"heatmap[{index}] must only include latitude, longitude, and count",
            )

        latitude = bucket["latitude"]
        longitude = bucket["longitude"]
        count = bucket["count"]

        if not isinstance(latitude, (int, float)):
            return False, f"heatmap[{index}].latitude must be numeric"

        if not isinstance(longitude, (int, float)):
            return False, f"heatmap[{index}].longitude must be numeric"

        if not isinstance(count, int) or count < 1:
            return False, f"heatmap[{index}].count must be a positive integer"

    for previous, current in zip(heatmap, heatmap[1:]):
        if previous["count"] < current["count"]:
            return False, "heatmap buckets must be sorted by count descending"

    return True, None


def print_heatmap_result(name, status, payload, expected_statuses):
    base_ok = print_result(name, status, payload, expected_statuses)
    if not base_ok or status not in expected_statuses or status >= 400:
        return base_ok

    valid, reason = validate_heatmap_response(payload)
    if valid:
        print("[PASS] Heatmap response shape")
        print()
        return True

    print(f"[FAIL] Heatmap response shape: {reason}")
    print()
    return False


def login_if_needed(base_url, username, password):
    if not username or not password:
        return None

    status, payload = perform_request(
        "POST",
        build_url(base_url, "/api/login"),
        json_body={"username": username, "password": password},
    )

    success = status == 200 and payload.get("success") and payload.get("access_token")
    print_result("POST /api/login", status, payload, {200})
    if success:
        return payload["access_token"]
    return None


def run_read_tests(base_url):
    now = datetime.now(timezone.utc)
    seven_days_ago = now - timedelta(days=7)

    test_cases = [
        (
            "GET /api/test",
            "GET",
            "/api/test",
            {},
            {200},
        ),
        (
            "GET /api/analytics/summary",
            "GET",
            "/api/analytics/summary",
            {},
            {200},
        ),
        (
            "GET /api/reports",
            "GET",
            "/api/reports",
            {"limit": 5, "offset": 0, "sort_by": "created_at", "sort_order": "desc"},
            {200},
        ),
        (
            "GET /api/reports filtered",
            "GET",
            "/api/reports",
            {
                "limit": 5,
                "rating": "poor",
                "start_date": seven_days_ago.isoformat(),
                "end_date": now.isoformat(),
            },
            {200},
        ),
        (
            "GET /api/reports/poor",
            "GET",
            "/api/reports/poor",
            {"limit": 5, "offset": 0},
            {200},
        ),
        (
            "GET /api/reports/analytics",
            "GET",
            "/api/reports/analytics",
            {"start_date": seven_days_ago.isoformat(), "end_date": now.isoformat()},
            {200},
        ),
        (
            "GET /api/reports/analytics/heatmap",
            "GET",
            "/api/reports/analytics/heatmap",
            {"rating": "poor", "grid_size": 0.01},
            {200},
        ),
        (
            "GET /api/reports/analytics/heatmap filtered",
            "GET",
            "/api/reports/analytics/heatmap",
            {
                "borough": "Manhattan",
                "start_date": seven_days_ago.isoformat(),
                "end_date": now.isoformat(),
                "grid_size": 0.02,
            },
            {200},
        ),
        (
            "GET /api/reports/analytics/heatmap invalid grid size",
            "GET",
            "/api/reports/analytics/heatmap",
            {"grid_size": 0},
            {400},
        ),
        (
            "GET /api/reports invalid sort",
            "GET",
            "/api/reports",
            {"sort_by": "not_a_column"},
            {400},
        ),
    ]

    results = []
    for name, method, path, query, expected_statuses in test_cases:
        status, payload = perform_request(method, build_url(base_url, path, query=query))
        if path == "/api/reports/analytics/heatmap" and 200 in expected_statuses:
            results.append(print_heatmap_result(name, status, payload, expected_statuses))
        else:
            results.append(print_result(name, status, payload, expected_statuses))
    return results


def run_write_test(base_url, token, image_path):
    if not token:
        print("[SKIP] POST /api/reports: no JWT provided and login did not succeed\n")
        return None

    if not image_path:
        print("[SKIP] POST /api/reports: no --image path provided\n")
        return None

    if not os.path.exists(image_path):
        print(f"[SKIP] POST /api/reports: image not found at {image_path}\n")
        return None

    fields = {
        "latitude": "40.7128",
        "longitude": "-74.0060",
        "borough": "Manhattan",
        "rating": "poor",
        "damage_types": json.dumps(["cracked base", "corrosion"]),
    }
    multipart_body, boundary = build_multipart_form(fields, ("photo", image_path))
    status, payload = perform_request(
        "POST",
        build_url(base_url, "/api/reports"),
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": f"multipart/form-data; boundary={boundary}",
        },
        form_body=multipart_body,
    )
    return print_result("POST /api/reports", status, payload, {201})


def main():
    parser = argparse.ArgumentParser(description="Smoke-test streetlight API endpoints.")
    parser.add_argument("--base-url", default=DEFAULT_BASE_URL, help="API base URL")
    parser.add_argument("--username", help="Username for /api/login")
    parser.add_argument("--password", help="Password for /api/login")
    parser.add_argument("--token", help="JWT token for protected endpoints")
    parser.add_argument(
        "--image",
        help="Path to a local image file for POST /api/reports",
    )
    parser.add_argument(
        "--run-write-tests",
        action="store_true",
        help="Also test POST /api/reports",
    )
    args = parser.parse_args()

    print(f"Testing API at {args.base_url}\n")

    token = args.token or login_if_needed(args.base_url, args.username, args.password)
    results = run_read_tests(args.base_url)

    if args.run_write_tests:
        write_result = run_write_test(args.base_url, token, args.image)
        if write_result is not None:
            results.append(write_result)

    passed = sum(result is True for result in results)
    failed = sum(result is False for result in results)
    skipped = sum(result is None for result in results)

    print("Summary")
    print(f"Passed: {passed}")
    print(f"Failed: {failed}")
    print(f"Skipped: {skipped}")

    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
