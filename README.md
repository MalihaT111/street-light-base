# Street Light Base

Street Light Base is a gamified civic reporting web application developed to help the NYC Department of Transportation (DOT) proactively detect and document damaged streetlight bases. Instead of relying solely on 311 reports, this platform transforms data collection into an engaging experience through leaderboards, challenges, badges, and achievement tiers — rewarding citizens who report damaged streetlight bases across NYC boroughs.

---

## Table of Contents

1. [Features](#features)
2. [Tech Stack](#tech-stack)
3. [Architecture](#architecture)
4. [Getting Started](#getting-started)
5. [Environment Variables](#environment-variables)
6. [Database Schema](#database-schema)
7. [API Documentation](#api-documentation)
8. [User Manual](#user-manual)
9. [Test Cases](#test-cases)
10. [Validation Rules](#validation-rules)
11. [Known Issues & Bug Reports](#known-issues--bug-reports)

---

## Features

### Citizen (Public) Features
- User registration with email verification
- Secure login and password reset via email
- Submit streetlight damage reports with GPS location, photos (up to 3), damage type, and condition rating
- View and manage personal reports
- Leaderboard rankings (daily, weekly, monthly, all-time; filterable by borough)
- Challenges and achievements system
- Progress page showing badges, tier level, and challenge completions
- Mission page explaining the platform's purpose
- Account settings (update profile, change password, delete account)

### DOT Admin Features
- Analytics dashboard with charts: damage breakdown, reports over time, heatmap, borough clusters
- View all submitted reports with filtering and pagination
- Download reports as GeoJSON (supports EPSG:4326 and EPSG:2263 spatial reference systems)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, React Router 7, Vite 7, D3.js, Leaflet |
| Backend | Python 3, Flask 3, Flask-JWT-Extended |
| Database | PostgreSQL (hosted on Neon) |
| Image Storage | Cloudinary |
| Authentication | JWT tokens + bcrypt password hashing |
| Deployment | Gunicorn (backend), Vite build (frontend) |

---

## Architecture

```
┌──────────────────────────────────────────────────────┐
│              Frontend (React + Vite)                  │
│  Port 5173 (HTTPS for mobile/geolocation testing)    │
│  Routes: /home, /reports, /leaderboard, /dashboard   │
└─────────────────────┬────────────────────────────────┘
                      │  /api/* proxy
                      ▼
┌──────────────────────────────────────────────────────┐
│              Backend (Flask + Python)                 │
│  Port 5000                                           │
│  13 route blueprints (auth, reports, analytics, ...) │
│  JWT authentication · role-based access control      │
└─────────────────────┬────────────────────────────────┘
                      │  psycopg2 (SSL)
                      ▼
┌──────────────────────────────────────────────────────┐
│           PostgreSQL Database (Neon)                  │
│  8 tables: users, reports, report_images,            │
│  points_log, user_challenges, user_achievements,     │
│  user_badges, leaderboard_snapshots                  │
└──────────────────────────────────────────────────────┘
                      │
                      ▼
┌──────────────────────────────────────────────────────┐
│           External Services                           │
│  Cloudinary — image upload & CDN                     │
│  Gmail SMTP — email verification & password reset    │
└──────────────────────────────────────────────────────┘
```

### Authentication Flow

1. User registers → email verification token sent (30 min expiry)
2. User clicks verification link → `email_verified` set to `true` in DB
3. User logs in → JWT access token issued, stored in browser cookie
4. Protected routes check JWT via `@jwt_required()` decorator
5. Role-based guards: `@citizen_required` and `@dot_admin_required`

### Role Model

| Role value in DB | Frontend role | Access |
|-----------------|--------------|--------|
| `citizen` | `citizen` | Citizen pages only |
| `dot_admin` | `admin` | DOT admin pages only |
| `ppl` | `admin` | Same as `dot_admin` |

---

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.10+
- A PostgreSQL database (local or Neon)
- A Cloudinary account (for image uploads)
- A Gmail account with App Password enabled (for email sending)

### Local Setup

**1. Clone the repository**
```bash
git clone <repo-url>
cd street-light-base
```

**2. Backend**
```bash
cd Backend
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env          # fill in your credentials
python app.py
```

**3. Frontend**
```bash
cd Frontend
npm install
npm run dev
```

The frontend dev server runs on `https://localhost:5173` and proxies `/api/*` requests to `http://localhost:5000`.

**4. Initialize the database**
```bash
psql $DATABASE_URL -f Backend/database/schema.sql
psql $DATABASE_URL -f Backend/database/seed.sql   # optional sample data
```

### Running Tests

```bash
cd Backend
pytest tests/ -v
```

Tests require a live PostgreSQL database. Configure `TEST_DATABASE_URL` in your `.env` file (or use `DATABASE_URL`).

---

## Environment Variables

Create a `.env` file inside `Backend/` with the following variables:

```
# Database (Neon or local PostgreSQL)
DATABASE_URL=postgresql://user:password@host:5432/dbname
# Or individual parts:
DB_HOST=
DB_NAME=
DB_USER=
DB_PASSWORD=
DB_PORT=5432

# For tests (can be same as DATABASE_URL)
TEST_DATABASE_URL=

# JWT
JWT_SECRET_KEY=your-secret-key-min-32-chars

# Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Email (Gmail with App Password)
MAIL=your-gmail@gmail.com
MAIL_PASSWORD=your-app-password

# Frontend URL (used in email links)
FRONTEND_URL=https://localhost:5173
```

---

## Database Schema

### Entity-Relationship Overview

```
users ──< reports ──< report_images
  │          │
  └──< points_log
  └──< user_challenges
  └──< user_achievements
  └──< user_badges
  └──< leaderboard_snapshots
```

### Table Definitions

#### `users`
Stores all registered accounts.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | SERIAL | PRIMARY KEY | Auto-increment user ID |
| `username` | VARCHAR(50) | NOT NULL, UNIQUE | Display name |
| `email` | VARCHAR(100) | NOT NULL, UNIQUE | Login email |
| `password_hash` | VARCHAR(255) | NOT NULL | bcrypt hash |
| `role` | VARCHAR(20) | NOT NULL, DEFAULT `citizen` | `citizen`, `dot_admin`, or `ppl` |
| `first_name` | VARCHAR(50) | | Optional first name |
| `last_name` | VARCHAR(50) | | Optional last name |
| `email_verified` | BOOLEAN | DEFAULT false | Must be true before login |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Account creation time |

#### `reports`
One row per submitted streetlight damage report.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | SERIAL | PRIMARY KEY | Auto-increment report ID |
| `user_id` | INTEGER | FK → users(id) ON DELETE CASCADE | Report author |
| `latitude` | FLOAT | NOT NULL | GPS latitude |
| `longitude` | FLOAT | NOT NULL | GPS longitude |
| `borough` | VARCHAR(50) | | NYC borough (auto-detected from coordinates) |
| `rating` | VARCHAR(10) | NOT NULL, CHECK IN ('good','fair','poor') | Condition rating |
| `damage_types` | TEXT[] | | PostgreSQL array of damage type strings |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Submission time |

#### `report_images`
Up to 3 Cloudinary photo URLs per report.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | SERIAL | PRIMARY KEY | |
| `report_id` | INTEGER | FK → reports(id) ON DELETE CASCADE | |
| `image_url` | VARCHAR(500) | NOT NULL | Cloudinary CDN URL |
| `created_at` | TIMESTAMP | DEFAULT NOW() | |

#### `points_log`
Audit log of all points earned (from reports and challenge completions).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | SERIAL | PRIMARY KEY | |
| `user_id` | INTEGER | FK → users(id) ON DELETE CASCADE | |
| `report_id` | INTEGER | FK → reports(id) ON DELETE SET NULL | NULL for challenge bonus points |
| `points_earned` | INTEGER | NOT NULL | Points awarded in this event |
| `created_at` | TIMESTAMP | DEFAULT NOW() | |

#### `user_challenges`
Records which challenges a user has completed (with period suffixes for daily/weekly challenges).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | SERIAL | PRIMARY KEY | |
| `user_id` | INTEGER | FK → users(id) ON DELETE CASCADE | |
| `challenge_key` | VARCHAR(100) | NOT NULL | e.g. `daily_reporter:2026-05-08` or `connector` |
| `created_at` | TIMESTAMP | DEFAULT NOW() | |
| | | UNIQUE(user_id, challenge_key) | Prevents double-awarding |

#### `user_achievements`
Records which tier milestones a user has reached.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | SERIAL | PRIMARY KEY | |
| `user_id` | INTEGER | FK → users(id) ON DELETE CASCADE | |
| `achievement_key` | VARCHAR(100) | NOT NULL | `beginner`, `explorer`, `elite`, `legendary` |
| `created_at` | TIMESTAMP | DEFAULT NOW() | |
| | | UNIQUE(user_id, achievement_key) | |

#### `user_badges`
Records badges earned by each user.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | SERIAL | PRIMARY KEY | |
| `user_id` | INTEGER | FK → users(id) ON DELETE CASCADE | |
| `badge_key` | VARCHAR(100) | NOT NULL | e.g. `rookie_reporter`, `community_guardian` |
| `created_at` | TIMESTAMP | DEFAULT NOW() | |
| | | UNIQUE(user_id, badge_key) | |

#### `leaderboard_snapshots`
Cached leaderboard rankings for performance.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | SERIAL | PRIMARY KEY | |
| `user_id` | INTEGER | FK → users(id) ON DELETE CASCADE | |
| `period` | VARCHAR(20) | CHECK IN ('daily','weekly','monthly','all_time') | |
| `borough` | VARCHAR(50) | DEFAULT 'all' | Borough filter or 'all' |
| `total_points` | INTEGER | DEFAULT 0 | Cached point total |
| `rank` | INTEGER | NOT NULL | Rank position |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Snapshot time |
| | | UNIQUE(user_id, period, borough) | |

---

## API Documentation

All endpoints are prefixed with `/api`. JSON responses include a `"success": true/false` field.

### Authentication

Most protected endpoints require a JWT bearer token:
```
Authorization: Bearer <access_token>
```

---

### Auth Endpoints

#### `POST /api/register`
Register a new user account. Sends an email verification link.

**Request body (JSON):**
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "SecurePass1!",
  "first_name": "John",
  "last_name": "Doe",
  "role": "citizen"
}
```

**Response `201`:**
```json
{
  "success": true,
  "user": { "id": 1, "username": "john_doe", "email": "john@example.com", "role": "citizen" }
}
```

**Errors:** `400` missing/invalid fields · `409` duplicate email or username

---

#### `POST /api/login`
Log in and receive a JWT access token.

**Request body (JSON):**
```json
{
  "email": "john@example.com",
  "password": "SecurePass1!",
  "role": "user"
}
```
Use `"role": "admin"` to log in as a DOT admin.

**Response `200`:**
```json
{
  "success": true,
  "access_token": "<jwt>",
  "user": { "id": 1, "username": "john_doe", "email": "john@example.com", "role": "citizen" }
}
```

**Errors:** `400` missing fields · `401` invalid credentials · `403` email not verified

---

#### `POST /api/forgot-password`
Send a password reset email.

**Request body:** `{ "email": "john@example.com" }`

**Response `200`:** Always returns success (prevents email enumeration).

---

#### `POST /api/reset-password` _(JWT required — reset token type)_
Set a new password using the token from the reset email.

**Request body:** `{ "new_password": "NewPass1!" }`

**Response `200`:** `{ "success": true, "message": "Password updated successfully" }`

---

#### `POST /api/email-verification` _(JWT required — verify_email token type)_
Confirm email address using the token from the verification email.

**Response `200`:** `{ "success": true, "message": "Email verified" }`

---

#### `POST /api/resend-verification`
Resend the email verification link.

**Request body:** `{ "email": "john@example.com" }`

---

### Reports Endpoints

#### `GET /api/reports`
Get all reports with optional filters and pagination. Public endpoint.

**Query parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `borough` | string | — | Filter by borough |
| `rating` | string | — | `good`, `fair`, or `poor` |
| `start_date` | ISO date | — | Filter by created_at >= |
| `end_date` | ISO date | — | Filter by created_at <= |
| `sort_by` | string | `created_at` | Sort field |
| `sort_order` | string | `desc` | `asc` or `desc` |
| `limit` | int | 20 | Page size |
| `offset` | int | 0 | Page offset |

**Response `200`:**
```json
{
  "success": true,
  "reports": [
    {
      "id": 1,
      "user_id": 3,
      "latitude": 40.7128,
      "longitude": -74.0060,
      "borough": "Manhattan",
      "rating": "poor",
      "damage_types": ["cracked_base", "missing_cover"],
      "created_at": "2026-05-01T10:30:00",
      "photo_urls": ["https://res.cloudinary.com/..."]
    }
  ],
  "pagination": { "limit": 20, "offset": 0, "count": 20, "total": 142 }
}
```

---

#### `GET /api/reports/poor`
Same as `GET /api/reports` but pre-filtered to `rating=poor`.

---

#### `GET /api/reports/mine` _(citizen required)_
Get only the authenticated user's own reports. Accepts the same query parameters as `GET /api/reports`.

---

#### `GET /api/reports/all` _(dot_admin required)_
Get all reports from all users. Accepts the same query parameters as `GET /api/reports`.

---

#### `POST /api/reports` _(citizen required)_
Submit a new streetlight damage report. Uses `multipart/form-data`.

**Form fields:**

| Field | Required | Description |
|-------|----------|-------------|
| `latitude` | Yes | GPS latitude |
| `longitude` | Yes | GPS longitude |
| `borough` | No | NYC borough |
| `rating` | Yes | `good`, `fair`, or `poor` |
| `damage_types` | No | JSON array string, e.g. `["cracked_base"]` |
| `photo` | No | First photo file |
| `photo_2` | No | Second photo file |
| `photo_3` | No | Third photo file |

**Response `201`:**
```json
{
  "success": true,
  "report_id": 57,
  "badges_awarded": [{ "key": "rookie_reporter", "name": "Rookie Reporter" }],
  "challenges_awarded": [{ "key": "daily_reporter", "name": "Daily Reporter", "points": 20 }],
  "tier_reached": "Explorer"
}
```

---

#### `PUT /api/reports/<report_id>` _(citizen required, own reports only)_
Update rating or damage types on an existing report.

**Request body (JSON):**
```json
{ "rating": "fair", "damage_types": ["cracked_base"] }
```

**Response `200`:** `{ "success": true, "report": { ...updated report... } }`

**Errors:** `403` if report belongs to another user · `404` report not found

---

#### `DELETE /api/reports/<report_id>` _(citizen required, own reports only)_
Delete a report and its images.

**Response `200`:** `{ "success": true, "message": "Report deleted" }`

---

### Analytics Endpoints _(dot_admin required)_

#### `GET /api/analytics/summary`
High-level report counts.

**Response `200`:**
```json
{
  "success": true,
  "total_reports": 342,
  "current_month_reports": 48,
  "last_month_reports": 71
}
```

---

#### `GET /api/reports/analytics`
Aggregated chart data. Accepts the same filter query params as `GET /api/reports`.

**Response `200`:**
```json
{
  "success": true,
  "analytics": {
    "counts_by_rating": [{ "rating": "poor", "count": 180 }],
    "counts_by_borough": [{ "borough": "Manhattan", "count": 95 }],
    "reports_over_time": [{ "bucket": "2026-04-01", "count": 42 }],
    "poor_reports_over_time": [{ "bucket": "2026-04-01", "count": 18 }],
    "damage_type_counts": [{ "damage_type": "cracked_base", "count": 120 }]
  }
}
```

---

#### `GET /api/reports/analytics/heatmap`
Geographic density buckets for the heatmap visualization.

**Additional query param:** `grid_size` (float, default `0.01`, max `10.0`) — bucket size in degrees.

**Response `200`:**
```json
{
  "success": true,
  "heatmap": [{ "latitude": 40.71, "longitude": -74.01, "count": 12 }]
}
```

---

### Leaderboard Endpoints

#### `GET /api/leaderboard`
Get the top-ranked users by points. Public endpoint.

**Query parameters:**

| Param | Default | Description |
|-------|---------|-------------|
| `period` | `all_time` | `daily`, `weekly`, `monthly`, or `all_time` |
| `borough` | `all` | Filter by borough or `all` |
| `limit` | `10` | Number of results |

**Response `200`:**
```json
{
  "success": true,
  "leaderboard": [
    { "rank": 1, "username": "jane_smith", "total_points": 4200 }
  ]
}
```

---

#### `GET /api/leaderboard/stats` _(citizen required)_
Get the current user's rank and stats on the leaderboard.

**Query parameters:** Same `period` and `borough` as above.

**Response `200`:**
```json
{
  "success": true,
  "total_reports": 342,
  "active_users": 28,
  "user_rank": 5,
  "user_points": 980,
  "top_pct": 18,
  "borough": "all"
}
```

---

### Gamification Endpoints _(citizen required)_

#### `GET /api/challenges`
Get all challenges and current progress for the authenticated user.

**Response `200`:**
```json
{
  "success": true,
  "challenges": [
    {
      "key": "daily_reporter",
      "name": "Daily Reporter",
      "description": "Submit your first report today",
      "type": "daily",
      "target": 1,
      "progress": 1,
      "points": 20,
      "completed": true
    }
  ]
}
```

**Challenge types:** `daily` (resets each day), `weekly` (resets each ISO week), `special` (one-time)

**All challenges:**

| Key | Type | Target | Points | Description |
|-----|------|--------|--------|-------------|
| `daily_reporter` | daily | 1 report | 20 | First report today |
| `active_reporter` | daily | 3 reports | 60 | Three reports today |
| `street_inspector` | daily | 5 reports | 100 | Five reports today |
| `neighborhood_guardian` | weekly | 10 reports | 200 | Ten reports this week |
| `streetlight_specialist` | weekly | 15 reports | 300 | Fifteen reports this week |
| `determined` | weekly | 5 streak days | 250 | Report 5 consecutive days |
| `first_step` | special | 1 badge | 50 | Earn your first badge |
| `connector` | special | 2 boroughs | 150 | Report from 2 different boroughs |
| `network_leader` | special | 3 boroughs | 200 | Report from 3 different boroughs |

---

#### `GET /api/badges`
Get all badges and whether the user has earned each one.

**Response `200`:**
```json
{
  "success": true,
  "badges": [
    {
      "key": "rookie_reporter",
      "name": "Rookie Reporter",
      "description": "Submit your first report",
      "earned": true,
      "earned_at": "2026-05-01T09:12:00"
    }
  ]
}
```

**All badges:**

| Key | Trigger | Description |
|-----|---------|-------------|
| `rookie_reporter` | 1 total report | Submit your first report |
| `community_guardian` | 50 total reports | Submit 50 reports |
| `century_reporter` | 100 total reports | Submit 100 reports |
| `across_the_boroughs` | 5 distinct boroughs | One report per borough |

---

#### `GET /api/achievements`
Get tier progress for the authenticated user.

**Response `200`:**
```json
{
  "success": true,
  "total_points": 1250,
  "current_tier": "Explorer",
  "progress_to_next": {
    "next_tier": "Elite",
    "points_earned": 250,
    "points_needed": 9000,
    "points_remaining": 8750
  },
  "tiers": [
    { "key": "beginner", "name": "Beginner", "min_points": 0, "max_points": 999, "reached": true }
  ]
}
```

**Tier thresholds:**

| Tier | Min Points | Max Points |
|------|-----------|------------|
| Beginner | 0 | 999 |
| Explorer | 1,000 | 9,999 |
| Elite | 10,000 | 99,999 |
| Legendary | 100,000 | — |

---

### User Settings Endpoints _(JWT required)_

#### `PUT /api/user`
Update username and email.

**Request body:** `{ "username": "new_name", "email": "new@example.com" }`

**Response `200`:** `{ "success": true, "user": { ...updated fields... } }`

---

#### `PUT /api/user/password`
Change password (requires current password).

**Request body:** `{ "currentPassword": "OldPass1!", "newPassword": "NewPass1!" }`

---

#### `DELETE /api/user`
Delete the authenticated user's account and all associated data (cascade).

**Response `200`:** `{ "success": true }`

---

### GeoJSON Export _(dot_admin required)_

#### `GET /api/admin/reports/export.geojson`
Download all reports as a GeoJSON FeatureCollection file.

**Query parameters:**

| Param | Description |
|-------|-------------|
| `borough` | Filter by borough |
| `rating` | `good`, `fair`, or `poor` |
| `srs` | Spatial reference: `4326` (WGS84, default) or `2263` (NY State Plane) |
| `updated_after` | ISO date — only include reports updated after this date |

**Response:** `Content-Type: application/geo+json` file download.

**Sample feature:**
```json
{
  "type": "Feature",
  "id": "57",
  "geometry": { "type": "Point", "coordinates": [-74.006, 40.7128] },
  "properties": {
    "report_id": 57,
    "rating": "poor",
    "damage_types": ["cracked_base"],
    "borough": "Manhattan",
    "photo_url": "https://res.cloudinary.com/...",
    "created_at": "2026-05-01T10:30:00"
  }
}
```

---

## User Manual

### Citizen User Guide

#### 1. Creating an Account

1. Navigate to the app and click **Sign Up**.
2. Fill in username, email, first/last name, and a password.
3. Password requirements: minimum 8 characters, at least one uppercase letter, one number, and one special character (`!@#$%^&*...`).
4. Check your email inbox for a verification link and click it within 30 minutes.
5. Return to the login page. Select the **User** tab and enter your credentials.

#### 2. Submitting a Report

1. From the **Home** page, tap or click **Submit Report**.
2. Allow the browser to access your location — this auto-fills your GPS coordinates and detects your NYC borough.
3. Take or upload up to 3 photos of the damaged streetlight base.
4. Select a **condition rating**: Good, Fair, or Poor. Use the reference guide (?) icon for examples.
5. Select one or more **damage types** from the checklist.
6. Click **Submit**. Any newly earned badges or challenges will be shown immediately.

#### 3. Managing Reports

- Go to **My Reports** to view all your past submissions.
- Click **Edit** on any report to update the rating or damage types.
- Click **Delete** to remove a report (this also removes it from your points history).

#### 4. Leaderboard

- View the **Leaderboard** to see top contributors by total points.
- Filter by period (Today, This Week, This Month, All Time) and borough using the dropdowns.
- Your own rank and points are shown at the top of the page.

#### 5. Challenges

- Visit the **Challenges** page to see available challenges.
- Daily challenges reset at midnight UTC; weekly challenges reset each Monday.
- Progress bars show your current progress toward each challenge target.
- Completing a challenge awards bonus points automatically on your next report submission.

#### 6. Progress & Badges

- The **Progress** page shows your total points, current tier, and badge collection.
- Badges are awarded automatically when you hit a milestone (e.g., 1st report, 50 reports).
- Tier levels (Beginner → Explorer → Elite → Legendary) unlock as you accumulate points.

#### 7. Account Settings

- Go to **Settings** to update your username, email, or password.
- You can also permanently delete your account from the Settings page.

---

### DOT Admin User Guide

#### 1. Logging In as Admin

1. On the login page, select the **DOT Admin** tab.
2. Enter your admin credentials.
3. You will be redirected to the **Dashboard** automatically.

#### 2. Analytics Dashboard

The dashboard provides five main visualizations:

| Chart | Description |
|-------|-------------|
| Summary Cards | Total reports, this month vs. last month |
| Bar Chart | Report counts by borough |
| Pie Chart | Reports broken down by damage type |
| Line Chart | Report volume over time (all ratings and poor only) |
| Heatmap | Geographic density map of report locations |

Use the date range and borough filters at the top to narrow the data.

#### 3. Viewing All Reports

- Navigate to **All Reports** from the admin navigation bar.
- Use the filter panel to search by borough, rating, and date range.
- Reports are paginated; use the navigation controls to move through pages.

#### 4. Downloading Reports as GeoJSON

1. Go to **Export** in the admin navigation bar.
2. Select optional filters (borough, rating, date range).
3. Choose the spatial reference system: **WGS84 (EPSG:4326)** for standard GPS or **NY State Plane (EPSG:2263)** for NYC-specific GIS tools.
4. Click **Download**. A `.json` GeoJSON file will be saved to your computer.
5. This file can be opened in QGIS, ArcGIS, or any GeoJSON-compatible mapping tool. It is also compatible with Cyclomedia for field inspection integration.

---

## Test Cases

Tests are located in `Backend/tests/` and run with pytest against a live database.

### Running Tests

```bash
cd Backend
pytest tests/ -v
pytest tests/test_challenges.py -v    # challenges only
pytest tests/test_reports_all.py -v   # report access control only
```

### Test Coverage Summary

#### Challenge System (`test_challenges.py`)

| Test | Description | Expected |
|------|-------------|----------|
| `test_streak_empty_list` | Consecutive streak with no dates | Returns 0 |
| `test_streak_single_day` | Streak with one day | Returns 1 |
| `test_streak_two_consecutive` | Two consecutive days | Returns 2 |
| `test_streak_five_consecutive` | Five consecutive days Mon–Fri | Returns 5 |
| `test_streak_gap_resets_count` | Gap on Wednesday resets count | Returns 3 (Thu–Sat) |
| `test_streak_all_separate` | Non-consecutive dates | Returns 1 |
| `test_daily_reporter_awarded_on_first_report` | Daily challenge after 1 report | Challenge key stored in DB |
| `test_active_reporter_awarded_on_three_reports` | Active Reporter after 3 reports | Challenge awarded |
| `test_street_inspector_awarded_on_five_reports` | Street Inspector after 5 reports | Challenge awarded |
| `test_all_three_daily_challenges_awarded_at_five_reports` | All three daily challenges at once | All three keys present |
| `test_challenge_not_awarded_early_two_reports` | Active Reporter NOT awarded at 2 reports | Key absent |
| `test_challenge_not_double_awarded` | Calling award function twice | Only 1 DB row |
| `test_no_duplicate_points_on_double_call` | Points not doubled on second call | Exactly 1 points entry |
| `test_correct_cumulative_points_for_five_reports` | Sum of daily challenge points | 20 + 60 + 100 = 180 |
| `test_points_log_null_report_id_for_challenge_award` | Challenge bonus uses NULL report_id | `report_id` is NULL |
| `test_weekly_streak_requires_consecutive_days` | "Determined" challenge on Mon–Fri streak | Awarded |
| `test_weekly_streak_not_awarded_with_gap` | "Determined" with a mid-week gap | Not awarded |
| `test_weekly_challenges_awarded_per_week` | Same challenge earned in W14 and W15 | Two distinct DB keys |
| `test_weekly_award_does_not_bleed_across_weeks` | W14 completion does not satisfy W15 | W15 key absent |
| `test_connector_awarded_on_two_distinct_boroughs` | Two different boroughs | "connector" awarded |
| `test_connector_not_awarded_on_one_borough` | Both reports same borough | "connector" absent |
| `test_network_leader_awarded_on_three_distinct_boroughs` | Three different boroughs | Awarded |
| `test_progress_never_exceeds_target` | Progress field capped at target | progress ≤ target |
| `test_completed_true_when_progress_equals_target` | API returns completed=true when done | `completed: true` |
| `test_get_challenges_requires_auth` | No token → 401 | HTTP 401 |
| `test_get_challenges_returns_expected_shape` | Response schema validation | All required fields present |
| `test_post_report_flips_daily_reporter_completed` | Report submission triggers challenge | `completed` flips to true |

#### Report Access Control (`test_reports_all.py`)

| Test | Description | Expected |
|------|-------------|----------|
| `test_all_reports_requires_dot_or_ppl_role` | Citizen cannot access `/api/reports/all` | HTTP 403 |
| `test_all_reports_returns_everyones_reports_for_dot_role` | DOT admin sees all users' reports | Both report IDs present |
| `test_all_reports_returns_everyones_reports_for_ppl_role` | `ppl` role has same access as `dot_admin` | Report ID present |
| `test_dot_cannot_edit_someone_elses_report` | Admin cannot edit a citizen's report | HTTP 403 |

---

## Validation Rules

### Password Requirements
- Minimum 8 characters
- At least 1 uppercase letter (A–Z)
- At least 1 number (0–9)
- At least 1 special character: `!@#$%^&*(),.?":{}|<>`

### Report Submission
- `latitude` and `longitude` must be present and valid (−90 to 90, −180 to 180)
- `rating` must be one of: `good`, `fair`, `poor`
- Coordinates of exactly `(0, 0)` are rejected (likely a GPS failure)
- Maximum 3 photos per report; uploaded to Cloudinary CDN
- `damage_types` is an optional array of strings; values are normalized (lowercased, trimmed)

### User Registration
- `username`, `email`, and `password` are required
- Email must be unique across all users
- Username must be unique across all users
- Email verification required before first login

### GeoJSON Export
- `srs` must be `4326` or `2263`
- `rating` must be `good`, `fair`, or `poor` if provided
- `status` must be one of: `pending`, `reviewed`, `resolved`, `rejected` if provided

### Leaderboard
- `period` must be `daily`, `weekly`, `monthly`, or `all_time`
- `limit` defaults to 10

---

## Known Issues & Bug Reports

### Resolved Issues

| Issue | Description | Resolution |
|-------|-------------|------------|
| Role access bug | Users with `ppl` or `admin` role strings were rejected by the DOT admin guard | Normalized role check now covers `admin`, `dot_admin`, `ppl` |
| GeoJSON null coordinates | Reports with `(0, 0)` coordinates were exported and corrupted heatmap data | Added filter to exclude `latitude = 0 AND longitude = 0` |
| Weekly challenge bleed | Completing a weekly challenge in week N was incorrectly satisfying week N+1 | ISO week suffix appended to challenge key (e.g., `2026-W14`) |
| Double points on challenge | Calling `check_and_award_challenges` twice gave double points | `ON CONFLICT DO NOTHING` on `user_challenges` insert; points only logged on successful insert |
| Email enumeration on forgot-password | Returning `"email not found"` revealed whether an email was registered | Endpoint now always returns the same success response |

### Open Issues

| Issue | Severity | Description |
|-------|----------|-------------|
| No rate limiting | Medium | `/api/register` and `/api/login` have no request rate limiting; brute-force attacks are possible |
| Borough auto-detection | Low | Borough is currently provided by the client (frontend reverse-geocoding); server does not independently validate it |
| No pagination on GeoJSON export | Low | Large exports fetch all rows at once; very large datasets may cause memory pressure |
| HTTPS not enforced in production | Medium | The dev setup uses a self-signed cert; production deployment should enforce HTTPS at the load balancer |
