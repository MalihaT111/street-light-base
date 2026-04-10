import { Link, useNavigate } from "react-router-dom";
import React, { useState, useEffect } from "react";
import { FaTrophy, FaArrowRight } from "react-icons/fa";
import Navbar from "../../components/Navbar/Navbar.jsx";
import styles from "./leaderboard.module.css";
import PageHero from "../../components/PageHero/PageHero.jsx";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5001";

const Leaderboard = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [leaderboard, setLeaderboard] = useState([]);
    const [stats, setStats] = useState(null);
    useEffect(() => {
        const savedUser = localStorage.getItem("user");

        if (!savedUser) {
            navigate("/home");
            return;
        }

        try {
            setUser(JSON.parse(savedUser));
        } catch (error) {
            console.error("Error parsing user data:", error);
            navigate("/home");
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    useEffect(() => {
    const token = localStorage.getItem("token");
    fetch(`${API_BASE}/api/leaderboard`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) setLeaderboard(data.leaderboard);
      })
      .catch(err => console.error("Leaderboard fetch failed:", err));
  }, []);
    useEffect(() => {
    const token = localStorage.getItem("token");
    fetch(`${API_BASE}/api/leaderboard/stats`, {
        headers: { Authorization: `Bearer ${token}` },
    })
        .then(res => res.json())
        .then(data => { if (data.success) setStats(data); })
        .catch(err => console.error("Stats fetch failed:", err));
    }, []);
    const username = user?.username || "Citizen";

    if(loading){
        return null;
    }

    const mockChallenges = [
    { title: 'Report 5 streetlights', progress: 3, total: 5, reward: 100 },
    { title: 'Maintain 7-day streak', progress: 7, total: 7, reward: 150 },
    { title: 'Earn 3 badges', progress: 3, total: 3, reward: 200 }
    ];
    
    return (
        <>
            <Navbar username= {username} activeTab="leaderboard" />

            <div className={styles["leaderboard-wrapper"]}>
                <PageHero
                    title="Leaderboard"
                    subtitle="See how you rank against other NYC citizens making the streets safer."
                />
                {/* Stat section */}
                <div className ={styles["stat-section"]}>
                    <div className={styles["stat-card"]}>
                        <div className={styles["stat-label"]}>TOTAL REPORTS</div>
                        <div className={styles["stat-value"]}>
                            {stats ? stats.total_reports.toLocaleString() : "—"}
                        </div>
                        <div className={styles["stat-sub"]}>↑ 12% this week</div>
                    </div>

                    <div className={styles["stat-card"]}>
                        <div className={styles["stat-label"]}>ACTIVE USERS</div>
                        <div className={styles["stat-value"]}>
                            {stats ? stats.active_users.toLocaleString() : "—"}
                        </div>
                        <div className={styles["stat-sub"]}>This month</div>
                    </div>

                    <div className={styles["stat-card"]}>
                        <div className={styles["stat-label"]}>YOUR RANK</div>
                        <div className={styles["stat-value"]}>
                            {stats?.user_rank ? `#${stats.user_rank}` : "—"}
                        </div>
                        <div className={styles["stat-sub"]}>
                            {stats ? `${stats.user_points} pts${stats.top_pct ? ` • TOP ${stats.top_pct}%` : ""}` : "—"}
                        </div>
                    </div>
                </div>
                {/* Podium section */}
                <section className={styles["podium"]}>
                    {leaderboard.slice(0, 3).map((player, index) => (
                        <div key={player.rank} className={`${styles["podium-item"]} ${styles[`podium-item${index}`]}`}>
                            <div className={styles["podium-avatar"]}>{player.username[0].toUpperCase()}</div>
                            <div className={styles["podium-name"]}>{player.username}</div>
                            <div className={styles["podium-pts"]}>{player.total_points} pts</div>
                            <div className={`${styles["podium-platform"]} ${styles[`platform${index}`]}`}>{player.rank}</div>
                        </div>
                    ))}
                </section>
                <div className={styles["section-wrapper"]}>
                    {/* Leaderboard Section */}
                    <div className={styles.leaderboardSection}>
                        <div className={styles.sectionHeader}>
                            <h2>Top Contributors</h2>
                            <div className={styles["leaderboard-btn"]}>
                                <button className = {styles["filter-tab"]}>All Time</button>
                                <button className = {styles["filter-tab"]}>Monthly</button>
                                <button className = {styles["filter-tab"]}>Weekly</button>
                                <button className = {styles["filter-tab"]}>Daily</button>
                            </div>
                        </div>
                        
                        <div className={styles.leaderboardTable}>
                        <div className={styles.tableHeader}>
                            <div className={styles.headerCell}>Rank</div>
                            <div className={styles.headerCell}>User</div>
                            <div className={styles.headerCell}>Points</div>
                        </div>
                        
                        {leaderboard.map((item) => (
                            <div key={item.rank} className={styles.tableRow}>
                            <div className={styles.rankCell}>
                                <span className=
                                                  {`${styles.rankBadge} 
                                                    ${item.rank === 1 ? styles.topRank1 : ''}
                                                    ${item.rank === 2 ? styles.topRank2 : ''}
                                                    ${item.rank === 3 ? styles.topRank3 : ''}`}
                                >
                                {item.rank}
                                </span>
                            </div>
                            <div className={styles.userCell}>
                                <div className={styles.userAvatarSmall}>
                                {item.username.charAt(0).toUpperCase()}
                                </div>
                                <span>{item.username}</span>
                            </div>
                            <div className={styles.pointsCell}>{item.total_points}</div>
                            </div>
                        ))}
                        </div>
                    </div>
                    {/* Borough filter */}
                    <div className={styles["borough-filter"]}>
                        <div className={styles["borough-filter-title"]}>Filter by Boroughs</div>
                        <div className={styles["borough-field"]}>
                            <select>
                                <option>All Boroughs</option>
                                <option>Manhattan</option>
                                <option>Brooklyn</option>
                                <option>Queens</option>
                                <option>The Bronx</option>
                                <option>Staten Island</option>
                            </select>
                        </div>
                        <div className={styles["borough-info-card"]}>
                            <div className={styles["borough-info-label"]}>Your borough rank</div>
                            <div className={styles["borough-info-rank"]}>#4</div>
                            <div className={styles["borough-info-city"]}>in Manhattan</div>
                        </div>   
                    </div>
                </div>
            </div>   
        </>
    );
};

export default Leaderboard;