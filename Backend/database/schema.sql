-- ============================================
-- Street Light Base -- Database Schema
-- ============================================

-- Core: users
CREATE TABLE IF NOT EXISTS users (
    id            SERIAL PRIMARY KEY,
    username      VARCHAR(50)  NOT NULL UNIQUE,
    email         VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role          VARCHAR(20)  NOT NULL DEFAULT 'citizen',
    first_name    VARCHAR(50),
    last_name     VARCHAR(50),
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Core: reports
CREATE TABLE reports (
    id           SERIAL PRIMARY KEY,
    user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    latitude     FLOAT NOT NULL,
    longitude    FLOAT NOT NULL,
    borough      VARCHAR(50),
    rating       VARCHAR(10) NOT NULL CHECK (rating IN ('good', 'fair', 'poor')),
    damage_types TEXT[],
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Images for reports (supports up to 3 photos per report)
CREATE TABLE IF NOT EXISTS report_images (
    id          SERIAL PRIMARY KEY,
    report_id   INTEGER NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    image_url   VARCHAR(500) NOT NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Gamification: points_log
CREATE TABLE points_log (
    id            SERIAL PRIMARY KEY,
    user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    report_id     INTEGER REFERENCES reports(id) ON DELETE SET NULL,
    points_earned INTEGER NOT NULL,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Junction: user_challenges (definitions live in app code)
CREATE TABLE user_challenges (
    id            SERIAL PRIMARY KEY,
    user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    challenge_key VARCHAR(100) NOT NULL,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, challenge_key)
);

-- Junction: user_achievements (definitions live in app code)
CREATE TABLE user_achievements (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    achievement_key VARCHAR(100) NOT NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, achievement_key)
);

-- Junction: user_badges (definitions live in app code)
CREATE TABLE user_badges (
    id         SERIAL PRIMARY KEY,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    badge_key  VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, badge_key)
);

-- Analytics: leaderboard_snapshots
CREATE TABLE leaderboard_snapshots (
    id           SERIAL PRIMARY KEY,
    user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    period       VARCHAR(20) NOT NULL CHECK (period IN ('daily', 'weekly', 'monthly', 'all_time')),
    borough      VARCHAR(50) NOT NULL DEFAULT 'all',
    total_points INTEGER NOT NULL DEFAULT 0,
    rank         INTEGER NOT NULL,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, period, borough)
);
