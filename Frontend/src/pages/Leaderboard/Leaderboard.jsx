import { Link, useNavigate } from "react-router-dom";
import React, { useState, useEffect } from "react";
import { FaTrophy, FaArrowRight } from "react-icons/fa";
import Navbar from "../../components/Navbar/Navbar.jsx";
import styles from "./leaderboard.module.css";

const Leaderboard = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const savedUser = localStorage.getItem("user");

        if (!savedUser) {
            navigate("/");
            return;
        }

        try {
            setUser(JSON.parse(savedUser));
        } catch (error) {
            console.error("Error parsing user data:", error);
            navigate("/");
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    const username = user?.username || "Citizen";

    if(loading){
        return null;
    }

    const mockChallenges = [
    { title: 'Report 5 streetlights', progress: 3, total: 5, reward: 100 },
    { title: 'Maintain 7-day streak', progress: 7, total: 7, reward: 150 },
    { title: 'Earn 3 badges', progress: 3, total: 3, reward: 200 }
    ];
    const mockLeaderboard = [
    { rank: 1, name: 'alex_nyc', points: 1250, reports: 18 },
    { rank: 2, name: 'mike_bk', points: 1100, reports: 16 },
    { rank: 3, name: 'sarah_q', points: 980, reports: 14 },
    { rank: 4, name: 'john_man', points: 850, reports: 12 },
    { rank: 5, name: 'lisa_brx', points: 720, reports: 10 }
  ];
    return (
        <>
            <Navbar username= {username} activeTab="leaderboard" />

            <div className={styles["leaderboard-wrapper"]}>
                <div className={styles["top-title"]}>
                    <h1 className = {styles["leaderboard-title"]}>Leaderboard</h1>
                    <p className = {styles["leaderboard-subtitle"]}>Top reporters helping keep NYC's streets safe</p>
                </div>
                {/* Stat section */}
                <section className={styles["stat-section"]}>    
                    <div className={styles["stat-card"]}>
                        <div className={styles["stat-label"]}>TOTAL REPORTS</div>
                        <div className={styles["stat-value"]}>4,821</div>
                        <div className={styles["stat-sub"]}>↑ 12% this week</div>
                    </div>

                    <div className={styles["stat-card"]}>
                        <div className={styles["stat-label"]}>ACTIVE USERS</div>
                        <div className={styles["stat-value"]}>1,204</div>
                        <div className={styles["stat-sub"]}>This month</div>
                    </div>

                    <div className={styles["stat-card"]}>
                        <div className={styles["stat-label"]}>YOUR RANK</div>
                        <div className={styles["stat-value"]}>#12</div>
                        <div className={styles["stat-sub"]}>340 pts • TOP 1%</div>
                    </div>
                </section>
                {/* Podium section */}
                <section className={styles["podium"]}>
                    {mockLeaderboard.slice(0,3).map((player, index) => (
                        <div key={player.id || index} className={`${styles["podium-item"]} ${styles[`podium-item${index}`]}`}>
                            <div className={styles["podium-avatar"]}>{player.name[0].toUpperCase()}</div>
                            <div className={styles["podium-name"]}>{player.name}</div>
                            <div className={styles["podium-pts"]}>{player.points} pts</div>
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
                            <div className={styles.headerCell}>Reports</div>
                        </div>
                        
                        {mockLeaderboard.map((item) => (
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
                                {item.name.charAt(0).toUpperCase()}
                                </div>
                                <span>{item.name}</span>
                            </div>
                            <div className={styles.pointsCell}>{item.points}</div>
                            <div className={styles.reportsCell}>{item.reports}</div>
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