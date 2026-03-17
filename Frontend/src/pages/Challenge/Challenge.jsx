import { Link, useNavigate } from "react-router-dom";
import React, { useState, useEffect } from "react";
import styles from "./Challenge.module.css";
import ChallengeCard from "../../components/ChallengeCard/ChallengeCard";
import Navbar from "../../components/Navbar/Navbar.jsx";
import { 
  FaChartLine, 
  FaFlag, 
  FaTrophy, 
  FaFire, 
  FaMedal, 
  FaArrowRight,
  FaHome,
  FaFileAlt,
  FaChartBar,
  FaUser,
  FaCog,
  FaSignOutAlt
} from 'react-icons/fa';


const Challenge = () => {
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
    const mockChallenges = [
        //Mock data for daily challenge
        { type: 'daily',title: 'Daily Reporter', description: "Submit your first report today", progress: 1, total: 1, reward: 20 },
        { type: 'daily',title: 'Active Reporter', description: "Submit three reports today", progress: 2, total: 3, reward: 60 },
        { type: 'daily',title: 'Street Inspector', description: "Submit your first report today", progress: 2, total: 5, reward: 100 },
        //Mock data for daily weekly challenge
        { type: 'weekly',title: 'Determined', description: "Report for five days in a row this week", progress: 2, total: 5, reward: 250 },
        { type: 'weekly',title: 'Neighborhood Gurdian', description: "Submit ten reports this week", progress: 2, total: 10, reward: 200 },
        { type: 'weekly',title: 'Streetlight Specialist', description: "Submit fifteenth reports this week", progress: 2, total: 15, reward: 300 },
        //Mock data for special challenge
        { type: 'special',title: 'First Step', description: "Earn your first badge", progress: 1, total: 1, reward: 50 },
        { type: 'special',title: 'Connector', description: "Submit a report for two different boroughs", progress: 0, total: 1, reward: 150 },
        { type: 'special',title: 'Network leader', description: "Submit a report for three different boroughs", progress: 0, total: 1, reward: 200 }
    ];
    return(
        <>
            <Navbar username= {username} activeTab="challenge" />
            <div className = {styles["challenge-wrapper"]}>
                <div className={styles["top-title"]}>
                    <h1 className = {styles["challenge-title"]}>Challenge</h1>
                    <p className = {styles["challenge-subtitle"]}>Complete challenges to earn bonus points and climb the leaderboard</p>
                    {/* Daily Challenge section */}
                    <section className = {styles["daily-challenge"]}>
                        <div className={styles["challenge-type"]}>DAILY CHALLENGES</div>
                        <div className={styles["challenge-wrapper"]}>
                            {mockChallenges.filter(challenge => challenge.type === 'daily').map((challenge, index) => (
                                <ChallengeCard key = {index} challenge = {challenge} />
                            ))}
                        </div>
                    </section>
                    {/* Weekly Challenge section */}
                    <section className = {styles["weekly-challenge"]}>
                        <div className={styles["challenge-type"]}>WEEKLY CHALLENGES</div>
                        <div className={styles["challenge-wrapper"]}>
                            {mockChallenges.filter(challenge => challenge.type === 'weekly').map((challenge, index) => (
                                <ChallengeCard key = {index} challenge = {challenge} />
                            ))}
                        </div>
                    </section>
                    {/* Special Challenge section */}
                    <section className = {styles["special-challenge"]}>
                        <div className={styles["challenge-type"]}>SPECIAL CHALLENGES</div>
                        <div className={styles["challenge-wrapper"]}>
                            {mockChallenges.filter(challenge => challenge.type === 'special').map((challenge, index) => (
                                <ChallengeCard key = {index} challenge = {challenge} />
                            ))}
                        </div>
                    </section>
                </div>
            </div>
        </>
    )
}   
export default Challenge;