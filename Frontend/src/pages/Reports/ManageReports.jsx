import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar/Navbar';
import styles from './ManageReports.module.css'

function ManageReports(){
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Filter Toggle
    const toggleOptions = [
        "All",
        "Poor",
        "Fair",
        "Good",
        "Manhattan",
        "Brooklyn",
        "Queens",
        "Bronx",
        "Staten Island",
    ];

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
    return(
        <>
            <Navbar username= {username} activeTab="report" />
            <div className={styles["manage-report-wrapper"]}>
                <div className={styles["top-title"]}>
                    <h1 className = {styles["manage-report-title"]}>My reports</h1>
                    <p className = {styles["manage-report-subtitle"]}>Review, edit, and manage all submitted reports</p>
                </div>
                <div className={styles.filterRow}>
                    <div className={styles.filterToggle}>
                        {toggleOptions.map((option,index) => (
                            <button key ={index} className = {styles.toggleButton}>
                                {option}
                            </button>
                        ))}
                    </div>
                    <div className={styles.reportSortWrapper}>
                        <select className={styles.reportsSort}>
                            <option>Newest first</option>
                            <option>Oldest first</option>
                            <option>Most points</option>
                            <option>Rating: Poor first</option>
                        </select>
                    </div>
                </div>
            </div>
        </>
    )
}
export default ManageReports;