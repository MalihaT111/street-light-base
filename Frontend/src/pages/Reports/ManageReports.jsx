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
        address: "W 42nd St, Manhattan",
        date: "Mar 22, 2026",
        time: "2:14 PM",
        damageType: "Impact damage",
        rating: "Poor",
        points: 20,
        borough: "Manhattan",
        description: "Base shows visible cracking on the south-facing side.",
    },
    {
        id: 2,
        address: "Flatbush Ave, Brooklyn",
        date: "Mar 19, 2026",
        time: "11:03 AM",
        damageType: "Corrosion",
        rating: "Fair",
        points: 10,
        borough: "Brooklyn",
        description: "Rust staining along the base seam.",
    },
    {
        id: 3,
        address: "Jamaica Ave, Queens",
        date: "Mar 17, 2026",
        time: "9:45 AM",
        damageType: "Minor wear",
        rating: "Good",
        points: 10,
        borough: "Queens",
        description: "Minor surface wear, but no major visible damage.",
    },
    {
        id: 4,
        address: "Grand Concourse, Bronx",
        date: "Mar 14, 2026",
        time: "4:22 PM",
        damageType: "Cracked base",
        rating: "Poor",
        points: 20,
        borough: "Bronx",
        description: "Large fracture on the east face, cover appears loose.",
    },
    ]);
    const handleEdit = (report) =>{
        console.log("Edit: ", report)
    }
    const handleDelete = (reportId) => {
        setReports((prevReport) => (
            prevReport.filter((report) => (
                report.id != reportId
            ))
        ))
    }
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
                <div className={styles.reportCardWrapper}>
                    {reports.map((report) => (
                        <ReportCard
                            key={report.id}
                            report={report}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                        />
                    ))}
                </div>
            </div>
        </>
    )
}
export default ManageReports;