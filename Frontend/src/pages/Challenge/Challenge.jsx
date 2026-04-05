import { useNavigate } from "react-router-dom";
import React, { useState, useEffect } from "react";
import styles from "./Challenge.module.css";
import ChallengeCard from "../../components/ChallengeCard/ChallengeCard";
import Navbar from "../../components/Navbar/Navbar.jsx";
import PageHero from "../../components/PageHero/PageHero.jsx";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5001";

const Challenge = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [challenges, setChallenges] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const savedUser = localStorage.getItem("user");
        if (!savedUser) {
            navigate("/");
            return;
        }
        try {
            setUser(JSON.parse(savedUser));
        } catch {
            navigate("/");
        }
    }, [navigate]);

    useEffect(() => {
        if (!user) return;

        const token = localStorage.getItem("token");
        setLoading(true);
        setError(null);

        fetch(`${API_BASE}/api/challenges`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => res.json())
            .then((data) => {
                if (!data.success) throw new Error(data.error || "Failed to load challenges");
                // Map API field names to what ChallengeCard expects
                setChallenges(
                    data.challenges.map((c) => ({
                        key: c.key,
                        type: c.type,
                        title: c.name,
                        description: c.description,
                        progress: c.progress,
                        total: c.target,
                        reward: c.points,
                        completed: c.completed,
                    }))
                );
            })
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
    }, [user]);

    const username = user?.username || "Citizen";

    if (!user) return null;

    const byType = (type) => challenges.filter((c) => c.type === type);

    return (
        <>
            <Navbar username={username} activeTab="challenge" />
            <div className={styles["challenge-wrapper"]}>
                <PageHero
                    title="Challenges"
                    subtitle="Complete daily, weekly, and special challenges to earn bonus points and climb the leaderboard."
                    pills={[
                        ...(!loading && !error ? [{ label: `${challenges.filter(c => c.completed).length} / ${challenges.length} completed` }] : []),
                    ]}
                />

                    {loading && <p className={styles["status-message"]}>Loading challenges...</p>}
                    {error && <p className={styles["error-message"]}>{error}</p>}

                    {!loading && !error && (
                        <>
                            <section className={styles["daily-challenge"]}>
                                <div className={styles["challenge-type"]}>DAILY CHALLENGES</div>
                                <div className={styles["challenge-cards"]}>
                                    {byType("daily").map((c) => (
                                        <ChallengeCard key={c.key} challenge={c} />
                                    ))}
                                </div>
                            </section>

                            <section className={styles["weekly-challenge"]}>
                                <div className={styles["challenge-type"]}>WEEKLY CHALLENGES</div>
                                <div className={styles["challenge-cards"]}>
                                    {byType("weekly").map((c) => (
                                        <ChallengeCard key={c.key} challenge={c} />
                                    ))}
                                </div>
                            </section>

                            <section className={styles["special-challenge"]}>
                                <div className={styles["challenge-type"]}>SPECIAL CHALLENGES</div>
                                <div className={styles["challenge-cards"]}>
                                    {byType("special").map((c) => (
                                        <ChallengeCard key={c.key} challenge={c} />
                                    ))}
                                </div>
                            </section>
                        </>
                    )}
            </div>
        </>
    );
};

export default Challenge;