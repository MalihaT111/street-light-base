import React, { useState, useMemo } from "react";
import styles from "./Progress.module.css";
import Navbar from "../../components/Navbar/Navbar.jsx";
import PageHero from "../../components/PageHero/PageHero.jsx";
import useAuth from "../../hooks/useAuth";
import useFetch from "../../hooks/useFetch";
import TierSection from "./components/TierSection";
import BadgeSection from "./components/BadgeSection";
import ChallengeSection from "./components/ChallengeSection";
import {
    FaMedal,
    FaCrown,
    FaStar,
    FaLeaf,
    FaCompass,
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
    const { user, loading: userLoading } = useAuth();
    const [activeChallenge, setActiveChallenge] = useState("daily");

    const token = localStorage.getItem("token");
    const authHeaders = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

    const { 
        data: challengesRaw, 
        loading: challengesLoading, 
        error: challengesError 
    } = useFetch(user ? `${API_BASE}/api/challenges` : null, { headers: authHeaders });

    const { 
        data: badgesRaw, 
        loading: badgesLoading, 
        error: badgesError 
    } = useFetch(user ? `${API_BASE}/api/badges` : null, { headers: authHeaders });

    const { 
        data: achievementsRaw, 
        loading: achLoading, 
        error: achError 
    } = useFetch(user ? `${API_BASE}/api/achievements` : null, { headers: authHeaders });

    const challenges = useMemo(() => {
        return (challengesRaw?.challenges || []).map((c) => ({
            key: c.key, type: c.type, title: c.name,
            description: c.description, progress: c.progress,
            total: c.target, reward: c.points, completed: c.completed,
        }));
    }, [challengesRaw]);

    const badges = useMemo(() => badgesRaw?.badges || [], [badgesRaw]);
    const achievements = achievementsRaw || null;
    const challengeGroups = useMemo(() => ({
        daily: challenges.filter((challenge) => challenge.type === "daily"),
        weekly: challenges.filter((challenge) => challenge.type === "weekly"),
        special: challenges.filter((challenge) => challenge.type === "special"),
    }), [challenges]);

    if (userLoading || !user) return null;

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

                {/* ── Hero ────────────────────────────────────────────── */}
                <PageHero
                    title="Your Progress"
                    subtitle="Track your tier, badges, and challenges — every report gets you closer to Legendary."
                />

                <TierSection
                    styles={styles}
                    achievements={achievements}
                    achLoading={achLoading}
                    achError={achError}
                    meta={meta}
                    progressPct={progressPct}
                    tierMeta={TIER_META}
                />

                <BadgeSection
                    styles={styles}
                    badges={badges}
                    badgesLoading={badgesLoading}
                    badgesError={badgesError}
                    badgeIconMap={BADGE_ICON}
                />

                <ChallengeSection
                    styles={styles}
                    challengeGroups={challengeGroups}
                    activeChallenge={activeChallenge}
                    setActiveChallenge={setActiveChallenge}
                    challengesLoading={challengesLoading}
                    challengesError={challengesError}
                />

            </div>
        </>
    );
};

export default Progress;
