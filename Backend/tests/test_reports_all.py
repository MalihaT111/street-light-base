import uuid

from flask_jwt_extended import create_access_token


def insert_user(cur, role="citizen"):
    tag = uuid.uuid4().hex[:10]
    username = f"reports_{role}_{tag}"
    email = f"{username}@test.invalid"
    cur.execute(
        """
        INSERT INTO users (username, email, password_hash, role)
        VALUES (%s, %s, %s, %s)
        RETURNING id
        """,
        (username, email, "x" * 60, role),
    )
    return cur.fetchone()[0]


def insert_report(cur, user_id, borough="Manhattan", rating="poor"):
    cur.execute(
        """
        INSERT INTO reports (user_id, latitude, longitude, borough, rating, damage_types)
        VALUES (%s, %s, %s, %s, %s, %s)
        RETURNING id
        """,
        (user_id, 40.7128, -74.0060, borough, rating, ["cracked_base"]),
    )
    return cur.fetchone()[0]


def make_auth_headers(flask_app, user_id):
    with flask_app.app_context():
        token = create_access_token(identity=str(user_id))
    return {"Authorization": f"Bearer {token}"}


def test_all_reports_requires_dot_or_ppl_role(db_conn, flask_app):
    cur = db_conn.cursor()
    citizen_id = insert_user(cur, role="citizen")
    insert_report(cur, citizen_id)
    db_conn.commit()
    cur.close()

    with flask_app.test_client() as client:
        response = client.get(
            "/api/reports/all",
            headers=make_auth_headers(flask_app, citizen_id),
        )

    assert response.status_code == 403
    assert response.get_json()["success"] is False


def test_all_reports_returns_everyones_reports_for_dot_role(db_conn, flask_app):
    cur = db_conn.cursor()
    dot_id = insert_user(cur, role="dot_admin")
    citizen_one = insert_user(cur, role="citizen")
    citizen_two = insert_user(cur, role="citizen")
    report_one = insert_report(cur, citizen_one, borough="Brooklyn", rating="poor")
    report_two = insert_report(cur, citizen_two, borough="Queens", rating="fair")
    db_conn.commit()
    cur.close()

    with flask_app.test_client() as client:
        response = client.get(
            "/api/reports/all?limit=200",
            headers=make_auth_headers(flask_app, dot_id),
        )

    assert response.status_code == 200
    payload = response.get_json()
    returned_ids = {report["id"] for report in payload["reports"]}
    assert report_one in returned_ids
    assert report_two in returned_ids


def test_all_reports_returns_everyones_reports_for_ppl_role(db_conn, flask_app):
    cur = db_conn.cursor()
    ppl_id = insert_user(cur, role="ppl")
    citizen_id = insert_user(cur, role="citizen")
    report_id = insert_report(cur, citizen_id, borough="Bronx", rating="good")
    db_conn.commit()
    cur.close()

    with flask_app.test_client() as client:
        response = client.get(
            "/api/reports/all",
            headers=make_auth_headers(flask_app, ppl_id),
        )

    assert response.status_code == 200
    payload = response.get_json()
    assert any(report["id"] == report_id for report in payload["reports"])


def test_dot_cannot_edit_someone_elses_report(db_conn, flask_app):
    cur = db_conn.cursor()
    dot_id = insert_user(cur, role="dot_admin")
    citizen_id = insert_user(cur, role="citizen")
    report_id = insert_report(cur, citizen_id)
    db_conn.commit()
    cur.close()

    with flask_app.test_client() as client:
        response = client.put(
            f"/api/reports/{report_id}",
            headers=make_auth_headers(flask_app, dot_id),
            json={"rating": "fair"},
        )

    assert response.status_code == 403
    assert response.get_json()["success"] is False
