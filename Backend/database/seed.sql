-- ============================================
-- Street Light Base -- Seed Data
-- ============================================

-- users
-- passwords are all "password123" hashed with bcrypt
INSERT INTO users (username, email, password_hash, role, first_name, last_name) VALUES
('maria_bklyn',     'maria@example.com',     '$2b$12$KIXabc1234fakehashabc1uO1234567890abcdefghijklmnopqrstu', 'citizen',   'Maria',   'Santos'),
('streetwatcher99', 'swatcher@example.com',  '$2b$12$KIXabc1234fakehashabc1uO1234567890abcdefghijklmnopqrstu', 'citizen',   'James',   'Park'),
('bx_patrol',       'bxpatrol@example.com',  '$2b$12$KIXabc1234fakehashabc1uO1234567890abcdefghijklmnopqrstu', 'citizen',   'Carlos',  'Rivera'),
('si_reporter',     'sireporter@example.com','$2b$12$KIXabc1234fakehashabc1uO1234567890abcdefghijklmnopqrstu', 'citizen',   'Angela',  'Greco'),
('fixnyc_dave',     'fixnyc@example.com',    '$2b$12$KIXabc1234fakehashabc1uO1234567890abcdefghijklmnopqrstu', 'citizen',   'David',   'Kim'),
('dot_admin',       'admin@dot.nyc.gov',     '$2b$12$KIXabc1234fakehashabc1uO1234567890abcdefghijklmnopqrstu', 'dot_admin', 'DOT',     'Admin');

-- reports
INSERT INTO reports (user_id, latitude, longitude, borough, rating, photo_url, damage_types) VALUES
(1, 40.6501, -73.9496, 'Brooklyn',     'poor',  'https://example.com/photos/r1.jpg', ARRAY['cracked_base', 'corrosion']),
(1, 40.6523, -73.9512, 'Brooklyn',     'fair',  'https://example.com/photos/r2.jpg', ARRAY['missing_cover']),
(1, 40.6478, -73.9480, 'Brooklyn',     'poor',  'https://example.com/photos/r3.jpg', ARRAY['corrosion']),
(2, 40.7549, -73.9840, 'Manhattan',    'fair',  'https://example.com/photos/r4.jpg', ARRAY['cracked_base']),
(2, 40.7580, -73.9850, 'Manhattan',    'poor',  'https://example.com/photos/r5.jpg', ARRAY['missing_cover', 'corrosion']),
(2, 40.7600, -73.9870, 'Manhattan',    'good',  'https://example.com/photos/r6.jpg', ARRAY['cracked_base']),
(3, 40.8448, -73.8648, 'Bronx',        'poor',  'https://example.com/photos/r7.jpg', ARRAY['corrosion', 'cracked_base']),
(3, 40.8460, -73.8660, 'Bronx',        'fair',  'https://example.com/photos/r8.jpg', ARRAY['missing_cover']),
(4, 40.5795, -74.1502, 'Staten Island','fair',  'https://example.com/photos/r9.jpg', ARRAY['cracked_base']),
(4, 40.5810, -74.1520, 'Staten Island','poor',  'https://example.com/photos/r10.jpg',ARRAY['corrosion']),
(5, 40.7282, -73.7949, 'Queens',       'good',  'https://example.com/photos/r11.jpg',ARRAY['missing_cover']),
(5, 40.7300, -73.7960, 'Queens',       'fair',  'https://example.com/photos/r12.jpg',ARRAY['cracked_base']);

-- points_log
INSERT INTO points_log (user_id, report_id, points_earned) VALUES
(1, 1,  10),
(1, 2,  10),
(1, 3,  20),
(2, 4,  10),
(2, 5,  20),
(2, 6,  10),
(3, 7,  20),
(3, 8,  10),
(4, 9,  10),
(4, 10, 20),
(5, 11, 10),
(5, 12, 10);

-- user_challenges
INSERT INTO user_challenges (user_id, challenge_key) VALUES
(1, 'daily_report'),
(1, 'weekly_streak'),
(1, 'three_boroughs'),
(2, 'daily_report'),
(2, 'weekly_streak'),
(3, 'daily_report'),
(3, 'three_boroughs'),
(4, 'daily_report'),
(5, 'daily_report');

-- user_achievements
INSERT INTO user_achievements (user_id, achievement_key) VALUES
(1, 'first_report'),
(1, 'ten_reports'),
(2, 'first_report'),
(2, 'ten_reports'),
(3, 'first_report'),
(4, 'first_report'),
(5, 'first_report');

-- user_badges
INSERT INTO user_badges (user_id, badge_key) VALUES
(1, 'top_reporter'),
(1, 'streak_7'),
(2, 'top_reporter'),
(3, 'borough_explorer'),
(4, 'streak_7'),
(5, 'first_badge');

-- leaderboard_snapshots
INSERT INTO leaderboard_snapshots (user_id, period, borough, total_points, rank) VALUES
-- all time, all boroughs
(1, 'all_time', 'all', 40,  1),
(2, 'all_time', 'all', 40,  2),
(3, 'all_time', 'all', 30,  3),
(4, 'all_time', 'all', 30,  4),
(5, 'all_time', 'all', 20,  5),
-- weekly, all boroughs
(1, 'weekly', 'all', 40, 1),
(2, 'weekly', 'all', 40, 2),
(3, 'weekly', 'all', 30, 3),
(4, 'weekly', 'all', 30, 4),
(5, 'weekly', 'all', 20, 5),
-- all time, by borough
(1, 'all_time', 'Brooklyn',     40, 1),
(2, 'all_time', 'Manhattan',    40, 1),
(3, 'all_time', 'Bronx',        30, 1),
(4, 'all_time', 'Staten Island',30, 1),
(5, 'all_time', 'Queens',       20, 1);
