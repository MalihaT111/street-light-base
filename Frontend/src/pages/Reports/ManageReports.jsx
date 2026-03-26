import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar/Navbar';
import ReportCard from '../../components/ReportCard/ReportCard';
import styles from './ManageReports.module.css'

function ManageReports(){
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState("All");

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

    const [reports, setReports] = useState([
    {
      id: 1,
      title: "W 42nd St Streetlight Base",
      condition: "Poor",
      borough: "Manhattan",
      description: "Base shows visible cracking on the south-facing side.",
      date: "Mar 22, 2026",
    },
    {
      id: 2,
      title: "Flatbush Ave Streetlight Base",
      condition: "Fair",
      borough: "Brooklyn",
      description: "Rust staining along the base seam.",
      date: "Mar 19, 2026",
    },
    {
      id: 3,
      title: "Jamaica Ave Streetlight Base",
      condition: "Good",
      borough: "Queens",
      description: "Minor surface wear, but no major visible damage.",
      date: "Mar 17, 2026",
    },
    {
      id: 4,
      title: "Grand Concourse Streetlight Base",
      condition: "Poor",
      borough: "Bronx",
      description: "Large fracture on the east face, cover appears loose.",
      date: "Mar 14, 2026",
    },
  ]);

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
            <Navbar username= {username} activeTab="reports" />
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
                <ReportCard />
            </div>
        </>
    )
}
export default ManageReports;