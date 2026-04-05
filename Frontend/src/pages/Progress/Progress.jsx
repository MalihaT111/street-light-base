import { useNavigate } from "react-router-dom";
import React, { useState, useEffect } from "react";
import styles from "./Progress.module.css";
import ChallengeCard from "../../components/ChallengeCard/ChallengeCard";
import Navbar from "../../components/Navbar/Navbar.jsx";
import {
    FaCheckCircle,
    FaLock,
    FaMedal,
    FaCrown,
    FaStar,
    FaLeaf,
    FaCompass,
    FaBolt,
    FaMapMarkerAlt,
    FaUserShield,
    FaNewspaper,
    FaCity,
} from "react-icons/fa";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5001";

const TIER_META = {
    beginner:  { icon: FaLeaf,    color: "#6B7280", bg: "#F3F4F6", label: "Beginner" },
    explorer:  { icon: FaCompass, color: "#2563EB", bg: "#EFF6FF", label: "Explorer" },
    elite:     { icon: FaStar,    color: "#D97706", bg: "#FFFBEB", label: "Elite"    },
    legendary: { icon: FaCrown,   color: "#7C3AED", bg: "#F5F3FF", label: "Legendary"},
};

const BADGE_ICON = {
    rookie_reporter:     FaNewspaper,
    community_guardian:  FaUserShield,
    century_reporter:    FaMedal,
    across_the_boroughs: FaCity,
};

const Progress = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);

    const [challenges, setChallenges]       = useState([]);
    const [challengesLoading, setChallengesLoading] = useState(true);
    const [challengesError, setChallengesError]     = useState(null);

    const [badges, setBadges]               = useState([]);
    const [badgesLoading, setBadgesLoading] = useState(true);
    const [badgesError, setBadgesError]     = useState(null);

    const [achievements, setAchievements]   = useState(null);
    const [achLoading, setAchLoading]       = useState(true);
    const [achError, setAchError]           = useState(null);

    useEffect(() => {
        const savedUser = localStorage.getItem("user");
        if (!savedUser) { navigate("/"); return; }
        try { setUser(JSON.parse(savedUser)); }
        catch { navigate("/"); }
    }, [navigate]);

    useEffect(() => {
        if (!user) return;
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };

        fetch(`${API_BASE}/api/challenges`, { headers })
            .then((r) => r.json())
            .then((d) => {
                if (!d.success) throw new Error(d.error || "Failed to load challenges");
                setChallenges(
                    d.challenges.map((c) => ({
                        key: c.key, type: c.type, title: c.name,
                        description: c.description, progress: c.progress,
                        total: c.target, reward: c.points, completed: c.completed,
                    }))
                );
            })
            .catch((e) => setChallengesError(e.message))
            .finally(() => setChallengesLoading(false));

        fetch(`${API_BASE}/api/badges`, { headers })
            .then((r) => r.json())
            .then((d) => {
                if (!d.success) throw new Error(d.error || "Failed to load badges");
                setBadges(d.badges);
            })
            .catch((e) => setBadgesError(e.message))
            .finally(() => setBadgesLoading(false));

        fetch(`${API_BASE}/api/achievements`, { headers })
            .then((r) => r.json())
            .then((d) => {
                if (!d.success) throw new Error(d.error || "Failed to load achievements");
                setAchievements(d);
            })
            .catch((e) => setAchError(e.message))
            .finally(() => setAchLoading(false));
    }, [user]);

    if (!user) return null;

    const byType = (type) => challenges.filter((c) => c.type === type);

    const currentTierKey = achievements
        ? achievements.tiers.find((t) => t.name === achievements.current_tier)?.key
        : null;
    const meta = currentTierKey ? TIER_META[currentTierKey] : null;
    const prog = achievements?.progress_to_next;
    const progressPct = prog
        ? Math.min(100, Math.round((prog.points_earned / prog.points_needed) * 100))
        : 100;

    return (
        <>
            <Navbar username={user?.username || "Citizen"} activeTab="progress" />
            <div className={styles.wrapper}>

                {/* ── Page header ─────────────────────────────────────── */}
                <div className={styles.pageHeader}>
                    <h1 className={styles.pageTitle}>Progress</h1>
                    <p className={styles.pageSubtitle}>
                        Track your achievements, badges, and challenges all in one place
                    </p>
                </div>

                {/* ── Tier section ────────────────────────────────────── */}
                <section className={styles.section}>
                    <div className={styles.sectionLabel}>YOUR TIER</div>

                    {achLoading && <p className={styles.statusMsg}>Loading...</p>}
                    {achError   && <p className={styles.errorMsg}>{achError}</p>}

                    {!achLoading && !achError && achievements && (
                        <>
                            {/* Current tier banner */}
                            <div
                                className={styles.tierBanner}
                                style={{ borderColor: meta?.color, background: meta?.bg }}
                            >
                                <div className={styles.tierBannerLeft}>
                                    {meta && (
                                        <meta.icon
                                            className={styles.tierBannerIcon}
                                            style={{ color: meta.color }}
                                        />
                                    )}
                                    <div>
                                        <div className={styles.tierBannerName} style={{ color: meta?.color }}>
                                            {achievements.current_tier}
                                        </div>
                                        <div className={styles.tierBannerPoints}>
                                            {achievements.total_points.toLocaleString()} pts total
                                        </div>
                                    </div>
                                </div>

                                {prog ? (
                                    <div className={styles.tierBannerRight}>
                                        <div className={styles.tierProgressLabel}>
                                            {prog.points_earned.toLocaleString()} / {prog.points_needed.toLocaleString()} pts to {prog.next_tier}
                                        </div>
                                        <div className={styles.tierProgressTrack}>
                                            <div
                                                className={styles.tierProgressFill}
                                                style={{ width: `${progressPct}%`, background: meta?.color }}
                                            />
                                        </div>
                                        <div className={styles.tierProgressRemaining}>
                                            {prog.points_remaining.toLocaleString()} pts remaining
                                        </div>
                                    </div>
                                ) : (
                                    <div className={styles.tierMaxed}>
                                        Max tier reached!
                                    </div>
                                )}
                            </div>

                            {/* All tiers progression */}
                            <div className={styles.tierTrack}>
                                {achievements.tiers.map((tier, i) => {
                                    const m = TIER_META[tier.key];
                                    const Icon = m?.icon;
                                    const isCurrent = tier.name === achievements.current_tier;
                                    return (
                                        <React.Fragment key={tier.key}>
                                            <div className={`${styles.tierStep} ${tier.reached ? styles.tierReached : ""}`}>
                                                <div
                                                    className={styles.tierStepIcon}
                                                    style={tier.reached ? { background: m?.bg, borderColor: m?.color } : {}}
                                                >
                                                    {Icon && (
                                                        <Icon style={{ color: tier.reached ? m?.color : "#D1D5DB" }} />
                                                    )}
                                                    {isCurrent && <span className={styles.currentDot} style={{ background: m?.color }} />}
                                                </div>
                                                <div
                                                    className={styles.tierStepName}
                                                    style={{ color: tier.reached ? m?.color : "#9CA3AF" }}
                                                >
                                                    {tier.name}
                                                </div>
                                                <div className={styles.tierStepPts}>
                                                    {tier.min_points.toLocaleString()} pts
                                                </div>
                                            </div>
                                            {i < achievements.tiers.length - 1 && (
                                                <div className={`${styles.tierConnector} ${achievements.tiers[i + 1].reached ? styles.tierConnectorFilled : ""}`} />
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </section>

                {/* ── Badges section ──────────────────────────────────── */}
                <section className={styles.section}>
                    <div className={styles.sectionLabel}>BADGES</div>

                    {badgesLoading && <p className={styles.statusMsg}>Loading...</p>}
                    {badgesError   && <p className={styles.errorMsg}>{badgesError}</p>}

                    {!badgesLoading && !badgesError && (
                        <div className={styles.badgeGrid}>
                            {badges.map((badge) => {
                                const Icon = BADGE_ICON[badge.key] ?? FaMedal;
                                return (
                                    <div
                                        key={badge.key}
                                        className={`${styles.badgeCard} ${badge.earned ? styles.badgeEarned : styles.badgeLocked}`}
                                    >
                                        <div className={styles.badgeIconWrap}>
                                            {badge.earned
                                                ? <Icon className={styles.badgeIcon} />
                                                : <FaLock className={styles.badgeIconLocked} />
                                            }
                                        </div>
                                        <div className={styles.badgeContent}>
                                            <div className={styles.badgeName}>{badge.name}</div>
                                            <div className={styles.badgeDesc}>{badge.description}</div>
                                            {badge.earned && badge.earned_at && (
                                                <div className={styles.badgeDate}>
                                                    Earned {new Date(badge.earned_at).toLocaleDateString()}
                                                </div>
                                            )}
                                            {!badge.earned && (
                                                <div className={styles.badgeNotEarned}>Not yet earned</div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>

                {/* ── Challenges sections ─────────────────────────────── */}
                {challengesLoading && <p className={styles.statusMsg}>Loading challenges...</p>}
                {challengesError   && <p className={styles.errorMsg}>{challengesError}</p>}

                {!challengesLoading && !challengesError && (
                    <>
                        <section className={styles.section}>
                            <div className={styles.sectionLabel}>DAILY CHALLENGES</div>
                            <div className={styles.challengeGrid}>
                                {byType("daily").map((c) => <ChallengeCard key={c.key} challenge={c} />)}
                            </div>
                        </section>

                        <section className={styles.section}>
                            <div className={styles.sectionLabel}>WEEKLY CHALLENGES</div>
                            <div className={styles.challengeGrid}>
                                {byType("weekly").map((c) => <ChallengeCard key={c.key} challenge={c} />)}
                            </div>
                        </section>

                        <section className={styles.section}>
                            <div className={styles.sectionLabel}>SPECIAL CHALLENGES</div>
                            <div className={styles.challengeGrid}>
                                {byType("special").map((c) => <ChallengeCard key={c.key} challenge={c} />)}
                            </div>
                        </section>
                    </>
                )}
            </div>
        </>
    );
};

export default Progress;
