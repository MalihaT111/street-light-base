"""
Pytest suite for the challenge/gamification system.

Run from Backend/:
    pytest tests/test_challenges.py -v

Requires a live database reachable via TEST_DATABASE_URL, NEON_DATABASE_URL,
or DATABASE_URL in the environment / .env file.
"""

import json
from datetime import date, datetime, timedelta, timezone
from unittest.mock import patch

import pytest

from routes.challenges import (
    CHALLENGES,
    _longest_consecutive_streak,
    _stored_key,
    check_and_award_challenges,
)

# ---------------------------------------------------------------------------
# Fixed reference point used by all tests that need deterministic timestamps.
# April 4 2026 is a Saturday → week starts Monday March 30 2026 → ISO 2026-W14
# ---------------------------------------------------------------------------
FAKE_NOW = datetime(2026, 4, 4, 12, 0, 0, tzinfo=timezone.utc)
FAKE_TODAY = FAKE_NOW.date()  # 2026-04-04
FAKE_WEEK_START = FAKE_TODAY - timedelta(days=FAKE_TODAY.weekday())  # 2026-03-30

FAKE_NOW_W15 = datetime(2026, 4, 11, 12, 0, 0, tzinfo=timezone.utc)
FAKE_TODAY_W15 = FAKE_NOW_W15.date()  # 2026-04-11
FAKE_WEEK_START_W15 = FAKE_TODAY_W15 - timedelta(days=FAKE_TODAY_W15.weekday())  # 2026-04-06


class _FakeDatetime:
    """Drops in for routes.challenges.datetime so _get_metrics/_period_suffix use FAKE_NOW."""

    _now = FAKE_NOW

    @classmethod
    def now(cls, tz=None):
        return cls._now


class _FakeDatetimeW15(_FakeDatetime):
    _now = FAKE_NOW_W15


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def insert_report(cur, user_id, created_at=None, borough="Manhattan"):
    if created_at is None:
        created_at = FAKE_NOW
    cur.execute(
        """
        INSERT INTO reports (user_id, latitude, longitude, borough, rating, created_at)
        VALUES (%s, %s, %s, %s, 'poor', %s)
        RETURNING id
        """,
        (user_id, 40.7128, -74.006, borough, created_at),
    )
    return cur.fetchone()[0]


def insert_reports_n(cur, user_id, n, created_at=None):
    return [insert_report(cur, user_id, created_at=created_at) for _ in range(n)]


def get_awarded_keys(cur, user_id):
    cur.execute(
        "SELECT challenge_key FROM user_challenges WHERE user_id = %s",
        (user_id,),
    )
    return {row[0] for row in cur.fetchall()}


def get_total_points(cur, user_id):
    cur.execute(
        "SELECT COALESCE(SUM(points_earned), 0) FROM points_log WHERE user_id = %s",
        (user_id,),
    )
    return cur.fetchone()[0]


def get_points_log_rows(cur, user_id):
    cur.execute(
        "SELECT points_earned FROM points_log WHERE user_id = %s ORDER BY id",
        (user_id,),
    )
    return [row[0] for row in cur.fetchall()]


def award_with_fake_now(cur, user_id, fake_cls=_FakeDatetime):
    with patch("routes.challenges.datetime", fake_cls):
        return check_and_award_challenges(cur, user_id)


# ---------------------------------------------------------------------------
# Unit tests: _longest_consecutive_streak
# ---------------------------------------------------------------------------

def test_streak_empty_list():
    assert _longest_consecutive_streak([]) == 0


def test_streak_single_day():
    assert _longest_consecutive_streak([date(2026, 4, 1)]) == 1


def test_streak_two_consecutive():
    days = [date(2026, 4, 1), date(2026, 4, 2)]
    assert _longest_consecutive_streak(days) == 2


def test_streak_five_consecutive():
    days = [date(2026, 3, 30) + timedelta(days=i) for i in range(5)]
    assert _longest_consecutive_streak(days) == 5


def test_streak_gap_resets_count():
    # Mon Tue (gap Wed) Thu Fri Sat  →  longest = 3 (Thu-Fri-Sat)
    days = [
        date(2026, 3, 30),  # Mon
        date(2026, 3, 31),  # Tue
        date(2026, 4, 2),   # Thu
        date(2026, 4, 3),   # Fri
        date(2026, 4, 4),   # Sat
    ]
    assert _longest_consecutive_streak(days) == 3


def test_streak_all_separate():
    days = [date(2026, 4, 1), date(2026, 4, 3), date(2026, 4, 5)]
    assert _longest_consecutive_streak(days) == 1


# ---------------------------------------------------------------------------
# Core challenge logic: daily challenges
# ---------------------------------------------------------------------------

def test_daily_reporter_awarded_on_first_report(db_conn, test_user):
    cur = db_conn.cursor()
    insert_report(cur, test_user)
    db_conn.commit()

    award_with_fake_now(cur, test_user)
    db_conn.commit()

    key = f"daily_reporter:{FAKE_TODAY}"
    assert key in get_awarded_keys(cur, test_user)
    cur.close()


def test_active_reporter_awarded_on_three_reports(db_conn, test_user):
    cur = db_conn.cursor()
    insert_reports_n(cur, test_user, 3)
    db_conn.commit()

    award_with_fake_now(cur, test_user)
    db_conn.commit()

    awarded = get_awarded_keys(cur, test_user)
    assert f"active_reporter:{FAKE_TODAY}" in awarded
    cur.close()


def test_street_inspector_awarded_on_five_reports(db_conn, test_user):
    cur = db_conn.cursor()
    insert_reports_n(cur, test_user, 5)
    db_conn.commit()

    award_with_fake_now(cur, test_user)
    db_conn.commit()

    awarded = get_awarded_keys(cur, test_user)
    assert f"street_inspector:{FAKE_TODAY}" in awarded
    cur.close()


def test_all_three_daily_challenges_awarded_at_five_reports(db_conn, test_user):
    cur = db_conn.cursor()
    insert_reports_n(cur, test_user, 5)
    db_conn.commit()

    award_with_fake_now(cur, test_user)
    db_conn.commit()

    awarded = get_awarded_keys(cur, test_user)
    assert f"daily_reporter:{FAKE_TODAY}" in awarded
    assert f"active_reporter:{FAKE_TODAY}" in awarded
    assert f"street_inspector:{FAKE_TODAY}" in awarded
    cur.close()


def test_challenge_not_awarded_early_two_reports(db_conn, test_user):
    cur = db_conn.cursor()
    insert_reports_n(cur, test_user, 2)
    db_conn.commit()

    award_with_fake_now(cur, test_user)
    db_conn.commit()

    awarded = get_awarded_keys(cur, test_user)
    # active_reporter needs 3, street_inspector needs 5
    assert f"active_reporter:{FAKE_TODAY}" not in awarded
    assert f"street_inspector:{FAKE_TODAY}" not in awarded
    cur.close()


def test_challenge_not_awarded_early_four_reports(db_conn, test_user):
    cur = db_conn.cursor()
    insert_reports_n(cur, test_user, 4)
    db_conn.commit()

    award_with_fake_now(cur, test_user)
    db_conn.commit()

    awarded = get_awarded_keys(cur, test_user)
    assert f"street_inspector:{FAKE_TODAY}" not in awarded
    cur.close()


# ---------------------------------------------------------------------------
# Idempotency
# ---------------------------------------------------------------------------

def test_challenge_not_double_awarded(db_conn, test_user):
    cur = db_conn.cursor()
    insert_reports_n(cur, test_user, 1)
    db_conn.commit()

    award_with_fake_now(cur, test_user)
    db_conn.commit()
    award_with_fake_now(cur, test_user)
    db_conn.commit()

    cur.execute(
        "SELECT COUNT(*) FROM user_challenges WHERE user_id = %s AND challenge_key = %s",
        (test_user, f"daily_reporter:{FAKE_TODAY}"),
    )
    assert cur.fetchone()[0] == 1
    cur.close()


def test_no_duplicate_points_on_double_call(db_conn, test_user):
    cur = db_conn.cursor()
    insert_reports_n(cur, test_user, 1)
    db_conn.commit()

    award_with_fake_now(cur, test_user)
    db_conn.commit()
    award_with_fake_now(cur, test_user)
    db_conn.commit()

    rows = get_points_log_rows(cur, test_user)
    daily_reporter_points = CHALLENGES["daily_reporter"]["points"]
    assert rows.count(daily_reporter_points) == 1
    cur.close()


def test_idempotent_with_multiple_challenges(db_conn, test_user):
    cur = db_conn.cursor()
    insert_reports_n(cur, test_user, 5)
    db_conn.commit()

    award_with_fake_now(cur, test_user)
    db_conn.commit()

    first_total = get_total_points(cur, test_user)

    award_with_fake_now(cur, test_user)
    db_conn.commit()

    assert get_total_points(cur, test_user) == first_total
    cur.close()


# ---------------------------------------------------------------------------
# Points correctness
# ---------------------------------------------------------------------------

def test_correct_points_for_daily_reporter(db_conn, test_user):
    cur = db_conn.cursor()
    insert_reports_n(cur, test_user, 1)
    db_conn.commit()

    award_with_fake_now(cur, test_user)
    db_conn.commit()

    rows = get_points_log_rows(cur, test_user)
    assert CHALLENGES["daily_reporter"]["points"] in rows
    cur.close()


def test_correct_cumulative_points_for_five_reports(db_conn, test_user):
    cur = db_conn.cursor()
    insert_reports_n(cur, test_user, 5)
    db_conn.commit()

    award_with_fake_now(cur, test_user)
    db_conn.commit()

    expected = (
        CHALLENGES["daily_reporter"]["points"]
        + CHALLENGES["active_reporter"]["points"]
        + CHALLENGES["street_inspector"]["points"]
    )
    assert get_total_points(cur, test_user) == expected
    cur.close()


def test_points_only_added_once_per_challenge(db_conn, test_user):
    cur = db_conn.cursor()
    insert_reports_n(cur, test_user, 1)
    db_conn.commit()

    for _ in range(3):
        award_with_fake_now(cur, test_user)
        db_conn.commit()

    cur.execute(
        "SELECT COUNT(*) FROM points_log WHERE user_id = %s AND points_earned = %s",
        (test_user, CHALLENGES["daily_reporter"]["points"]),
    )
    assert cur.fetchone()[0] == 1
    cur.close()


def test_points_log_null_report_id_for_challenge_award(db_conn, test_user):
    cur = db_conn.cursor()
    insert_reports_n(cur, test_user, 1)
    db_conn.commit()

    award_with_fake_now(cur, test_user)
    db_conn.commit()

    cur.execute(
        "SELECT report_id FROM points_log WHERE user_id = %s AND points_earned = %s",
        (test_user, CHALLENGES["daily_reporter"]["points"]),
    )
    row = cur.fetchone()
    assert row is not None
    assert row[0] is None  # challenge awards use NULL report_id
    cur.close()


# ---------------------------------------------------------------------------
# Weekly streak: "determined" (5 consecutive days in the week)
# ---------------------------------------------------------------------------

def test_weekly_streak_requires_consecutive_days(db_conn, test_user):
    cur = db_conn.cursor()
    # Insert one report per day Mon–Fri of fake week
    for i in range(5):
        day = datetime(
            FAKE_WEEK_START.year,
            FAKE_WEEK_START.month,
            FAKE_WEEK_START.day,
            12, 0, 0,
            tzinfo=timezone.utc,
        ) + timedelta(days=i)
        insert_report(cur, test_user, created_at=day)
    db_conn.commit()

    award_with_fake_now(cur, test_user)
    db_conn.commit()

    iso_week = FAKE_NOW.strftime("%G-W%V")
    assert f"determined:{iso_week}" in get_awarded_keys(cur, test_user)
    cur.close()


def test_weekly_streak_not_awarded_with_gap(db_conn, test_user):
    cur = db_conn.cursor()
    # Mon Tue (skip Wed) Thu Fri Sat — longest run = 3 (Thu–Sat), target = 5
    days_offsets = [0, 1, 3, 4, 5]  # Mon, Tue, Thu, Fri, Sat relative to week_start
    for offset in days_offsets:
        day = datetime(
            FAKE_WEEK_START.year,
            FAKE_WEEK_START.month,
            FAKE_WEEK_START.day,
            12, 0, 0,
            tzinfo=timezone.utc,
        ) + timedelta(days=offset)
        insert_report(cur, test_user, created_at=day)
    db_conn.commit()

    award_with_fake_now(cur, test_user)
    db_conn.commit()

    iso_week = FAKE_NOW.strftime("%G-W%V")
    assert f"determined:{iso_week}" not in get_awarded_keys(cur, test_user)
    cur.close()


def test_weekly_streak_four_consecutive_not_enough(db_conn, test_user):
    cur = db_conn.cursor()
    # Tue–Fri: 4 consecutive days, target is 5
    for i in range(1, 5):
        day = datetime(
            FAKE_WEEK_START.year,
            FAKE_WEEK_START.month,
            FAKE_WEEK_START.day,
            12, 0, 0,
            tzinfo=timezone.utc,
        ) + timedelta(days=i)
        insert_report(cur, test_user, created_at=day)
    db_conn.commit()

    award_with_fake_now(cur, test_user)
    db_conn.commit()

    iso_week = FAKE_NOW.strftime("%G-W%V")
    assert f"determined:{iso_week}" not in get_awarded_keys(cur, test_user)
    cur.close()


# ---------------------------------------------------------------------------
# Weekly reset: challenges awarded separately per ISO week
# ---------------------------------------------------------------------------

def test_weekly_challenges_awarded_per_week(db_conn, test_user):
    cur = db_conn.cursor()

    # ── Week 14: insert 10 reports within W14 ──────────────────────────────
    for i in range(10):
        day = datetime(
            FAKE_WEEK_START.year,
            FAKE_WEEK_START.month,
            FAKE_WEEK_START.day,
            12, 0, 0,
            tzinfo=timezone.utc,
        ) + timedelta(hours=i)
        insert_report(cur, test_user, created_at=day)
    db_conn.commit()

    award_with_fake_now(cur, test_user, fake_cls=_FakeDatetime)
    db_conn.commit()

    # ── Week 15: insert 10 reports within W15 ──────────────────────────────
    for i in range(10):
        day = datetime(
            FAKE_WEEK_START_W15.year,
            FAKE_WEEK_START_W15.month,
            FAKE_WEEK_START_W15.day,
            12, 0, 0,
            tzinfo=timezone.utc,
        ) + timedelta(hours=i)
        insert_report(cur, test_user, created_at=day)
    db_conn.commit()

    award_with_fake_now(cur, test_user, fake_cls=_FakeDatetimeW15)
    db_conn.commit()

    awarded = get_awarded_keys(cur, test_user)
    w14 = FAKE_NOW.strftime("%G-W%V")
    w15 = FAKE_NOW_W15.strftime("%G-W%V")

    assert f"neighborhood_guardian:{w14}" in awarded
    assert f"neighborhood_guardian:{w15}" in awarded
    # Two distinct weeks → two distinct stored keys
    assert w14 != w15
    cur.close()


def test_weekly_award_does_not_bleed_across_weeks(db_conn, test_user):
    """Completing W14 should not satisfy W15's stored key."""
    cur = db_conn.cursor()

    for i in range(10):
        day = datetime(
            FAKE_WEEK_START.year,
            FAKE_WEEK_START.month,
            FAKE_WEEK_START.day,
            12, 0, 0,
            tzinfo=timezone.utc,
        ) + timedelta(hours=i)
        insert_report(cur, test_user, created_at=day)
    db_conn.commit()

    award_with_fake_now(cur, test_user, fake_cls=_FakeDatetime)
    db_conn.commit()

    # Advance to W15 without adding W15 reports
    award_with_fake_now(cur, test_user, fake_cls=_FakeDatetimeW15)
    db_conn.commit()

    awarded = get_awarded_keys(cur, test_user)
    w15 = FAKE_NOW_W15.strftime("%G-W%V")
    assert f"neighborhood_guardian:{w15}" not in awarded
    cur.close()


# ---------------------------------------------------------------------------
# Special challenges
# ---------------------------------------------------------------------------

def test_connector_awarded_on_two_distinct_boroughs(db_conn, test_user):
    cur = db_conn.cursor()
    insert_report(cur, test_user, borough="Manhattan")
    insert_report(cur, test_user, borough="Brooklyn")
    db_conn.commit()

    award_with_fake_now(cur, test_user)
    db_conn.commit()

    assert "connector" in get_awarded_keys(cur, test_user)
    cur.close()


def test_connector_not_awarded_on_one_borough(db_conn, test_user):
    cur = db_conn.cursor()
    insert_reports_n(cur, test_user, 2)  # both default to Manhattan
    db_conn.commit()

    award_with_fake_now(cur, test_user)
    db_conn.commit()

    assert "connector" not in get_awarded_keys(cur, test_user)
    cur.close()


def test_network_leader_awarded_on_three_distinct_boroughs(db_conn, test_user):
    cur = db_conn.cursor()
    for borough in ("Manhattan", "Brooklyn", "Queens"):
        insert_report(cur, test_user, borough=borough)
    db_conn.commit()

    award_with_fake_now(cur, test_user)
    db_conn.commit()

    assert "network_leader" in get_awarded_keys(cur, test_user)
    cur.close()


def test_network_leader_not_awarded_on_two_boroughs(db_conn, test_user):
    cur = db_conn.cursor()
    for borough in ("Manhattan", "Brooklyn"):
        insert_report(cur, test_user, borough=borough)
    db_conn.commit()

    award_with_fake_now(cur, test_user)
    db_conn.commit()

    assert "network_leader" not in get_awarded_keys(cur, test_user)
    cur.close()


def test_special_challenges_have_no_period_suffix(db_conn, test_user):
    cur = db_conn.cursor()
    for borough in ("Manhattan", "Brooklyn"):
        insert_report(cur, test_user, borough=borough)
    db_conn.commit()

    award_with_fake_now(cur, test_user)
    db_conn.commit()

    awarded = get_awarded_keys(cur, test_user)
    # Special challenges stored without date suffix
    assert "connector" in awarded
    assert not any(k.startswith("connector:") for k in awarded)
    cur.close()


# ---------------------------------------------------------------------------
# Progress limits via GET /api/challenges
# ---------------------------------------------------------------------------

def test_progress_never_exceeds_target(db_conn, test_user, authed_client):
    client, headers = authed_client
    cur = db_conn.cursor()
    insert_reports_n(cur, test_user, 10)  # daily target is 5 at most
    db_conn.commit()
    cur.close()

    response = client.get("/api/challenges", headers=headers)
    assert response.status_code == 200
    data = response.get_json()

    for c in data["challenges"]:
        assert c["progress"] <= c["target"], (
            f"{c['key']}: progress {c['progress']} exceeds target {c['target']}"
        )


def test_completed_true_when_progress_equals_target(db_conn, test_user, authed_client):
    client, headers = authed_client
    cur = db_conn.cursor()
    # Use real current time so the API's _get_metrics and the stored key suffix agree.
    insert_report(cur, test_user, created_at=datetime.now(timezone.utc))
    db_conn.commit()

    check_and_award_challenges(cur, test_user)
    db_conn.commit()
    cur.close()

    response = client.get("/api/challenges", headers=headers)
    assert response.status_code == 200
    data = response.get_json()

    daily_reporter = next(c for c in data["challenges"] if c["key"] == "daily_reporter")
    assert daily_reporter["progress"] == daily_reporter["target"]
    assert daily_reporter["completed"] is True


def test_completed_false_before_target(db_conn, test_user, authed_client):
    client, headers = authed_client
    cur = db_conn.cursor()
    insert_reports_n(cur, test_user, 2)  # active_reporter needs 3
    db_conn.commit()
    cur.close()

    response = client.get("/api/challenges", headers=headers)
    assert response.status_code == 200
    data = response.get_json()

    active_reporter = next(c for c in data["challenges"] if c["key"] == "active_reporter")
    assert active_reporter["completed"] is False


# ---------------------------------------------------------------------------
# API integration: POST /api/reports → GET /api/challenges
# ---------------------------------------------------------------------------

def test_get_challenges_requires_auth(flask_app):
    with flask_app.test_client() as client:
        response = client.get("/api/challenges")
    assert response.status_code == 401


def test_get_challenges_rejects_invalid_token(flask_app):
    with flask_app.test_client() as client:
        response = client.get(
            "/api/challenges",
            headers={"Authorization": "Bearer not.a.valid.token"},
        )
    assert response.status_code in (401, 422)


def test_get_challenges_returns_expected_shape(authed_client):
    client, headers = authed_client
    response = client.get("/api/challenges", headers=headers)
    assert response.status_code == 200

    data = response.get_json()
    assert data["success"] is True
    assert isinstance(data["challenges"], list)
    assert len(data["challenges"]) == len(CHALLENGES)

    required_fields = {"key", "name", "description", "type", "target", "progress", "points", "completed"}
    for c in data["challenges"]:
        assert required_fields <= set(c.keys()), f"missing fields in {c}"
        assert isinstance(c["completed"], bool)
        assert isinstance(c["progress"], int)
        assert c["progress"] >= 0
        assert c["progress"] <= c["target"]


def test_get_challenges_returns_all_nine_keys(authed_client):
    client, headers = authed_client
    response = client.get("/api/challenges", headers=headers)
    data = response.get_json()

    returned_keys = {c["key"] for c in data["challenges"]}
    expected_keys = set(CHALLENGES.keys())
    assert returned_keys == expected_keys


def test_get_challenges_correct_type_counts(authed_client):
    client, headers = authed_client
    response = client.get("/api/challenges", headers=headers)
    data = response.get_json()

    for ctype, expected in [("daily", 3), ("weekly", 3), ("special", 3)]:
        actual = sum(1 for c in data["challenges"] if c["type"] == ctype)
        assert actual == expected, f"expected {expected} {ctype} challenges, got {actual}"


def test_post_report_increases_daily_progress(db_conn, test_user, authed_client):
    client, headers = authed_client

    before = client.get("/api/challenges", headers=headers).get_json()
    before_progress = next(
        c["progress"] for c in before["challenges"] if c["key"] == "daily_reporter"
    )

    response = client.post(
        "/api/reports",
        data={
            "latitude": "40.7128",
            "longitude": "-74.0060",
            "borough": "Manhattan",
            "rating": "poor",
        },
        content_type="multipart/form-data",
        headers=headers,
    )
    assert response.status_code == 201

    after = client.get("/api/challenges", headers=headers).get_json()
    after_progress = next(
        c["progress"] for c in after["challenges"] if c["key"] == "daily_reporter"
    )
    assert after_progress > before_progress


def test_post_report_flips_daily_reporter_completed(db_conn, test_user, authed_client):
    client, headers = authed_client

    # Ensure no prior reports exist for this fresh test user
    before = client.get("/api/challenges", headers=headers).get_json()
    dr_before = next(c for c in before["challenges"] if c["key"] == "daily_reporter")
    assert dr_before["completed"] is False

    client.post(
        "/api/reports",
        data={
            "latitude": "40.7128",
            "longitude": "-74.0060",
            "borough": "Manhattan",
            "rating": "poor",
        },
        content_type="multipart/form-data",
        headers=headers,
    )

    after = client.get("/api/challenges", headers=headers).get_json()
    dr_after = next(c for c in after["challenges"] if c["key"] == "daily_reporter")
    assert dr_after["completed"] is True
    assert dr_after["progress"] == 1
