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
    const [sortOption, setSortOption] = useState("Newest first");

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
        setEditingReport(report);
        setEditForm(report);
        setIsEditOpen(true);
    }
    const handleDelete = (reportId) => {
        setReports((prevReport) => (
            prevReport.filter((report) => (
                report.id != reportId
            ))
        ))
    }
    const handleCloseEdit = () => {
        setIsEditOpen(false);
        setEditingReport(null);
    };
    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditForm((prev) => ({
            ...prev,
            [name]: value,
        }));
    };
    const handleSaveEdit = () => {
        setReports((prevReports) =>
            prevReports.map((report) =>
                report.id === editingReport.id ? { ...report, ...editForm } : report
            )
        );

        setIsEditOpen(false);
        setEditingReport(null);
    };
    const filteredReports = reports
    .filter((report) => {
        if (activeFilter === "All") return true;

        if (["Poor", "Fair", "Good"].includes(activeFilter)) {
            return report.rating === activeFilter;
        }

        return report.borough === activeFilter;
    })
    .sort((a, b) => {
        if (sortOption === "Newest first") {
            return new Date(b.date) - new Date(a.date);
        }

        if (sortOption === "Oldest first") {
            return new Date(a.date) - new Date(b.date);
        }
        if (sortOption === "Rating: Poor first") {
            const ratingOrder = { Poor: 0, Fair: 1, Good: 2 };
            return ratingOrder[a.rating] - ratingOrder[b.rating];
        }

        return 0;
    });
    
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

    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editingReport, setEditingReport] = useState(null);
    const [editForm, setEditForm] = useState({
        address: "",
        date: "",
        time: "",
        damageType: "",
        rating: "",
        points: 0,
        borough: "",
        description: "",
    });

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
                            <button 
                                key ={index} 
                                className={`${styles.toggleButton} ${activeFilter === option ? styles.active : ""}`}
                                onClick={() => setActiveFilter(option)}
                            >
                                {option}
                            </button>
                        ))}
                    </div>
                    <div className={styles.reportSortWrapper}>
                        <select 
                            className={styles.reportsSort}
                            value={sortOption}
                            onChange={(e) => setSortOption(e.target.value)}
                        >
                            <option>Newest first</option>
                            <option>Oldest first</option>
                            <option>Rating: Poor first</option>
                        </select>
                    </div>
                </div>
                <div className={styles.reportCardWrapper}>
                    {filteredReports.map((report) => (
                        <ReportCard
                            key={report.id}
                            report={report}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                        />
                    ))}
                </div>
            </div>
            
            {isEditOpen && (
                <div className={styles.modalBackdrop}>
                    <div className={styles.modal}>
                        <div className={styles.modalHeader}>
                            <h2>Edit Report</h2>
                        </div>

                        <div className={styles.modalBody}>
                            <label className={styles.modalLabel}>Address</label>
                            <input
                                type="text"
                                name="address"
                                value={editForm.address}
                                onChange={handleEditChange}
                                className={styles.modalInput}
                            />

                            <label className={styles.modalLabel}>Damage Type</label>
                            <input
                                type="text"
                                name="damageType"
                                value={editForm.damageType}
                                onChange={handleEditChange}
                                className={styles.modalInput}
                            />

                            <label className={styles.modalLabel}>Rating</label>
                            <select
                                name="rating"
                                value={editForm.rating}
                                onChange={handleEditChange}
                                className={styles.modalInput}
                            >
                                <option value="Poor">Poor</option>
                                <option value="Fair">Fair</option>
                                <option value="Good">Good</option>
                            </select>

                            <label className={styles.modalLabel}>Description</label>
                            <textarea
                                name="description"
                                value={editForm.description}
                                onChange={handleEditChange}
                                className={styles.modalTextarea}
                            />
                        </div>

                        <div className={styles.modalFooter}>
                            <button
                                type="button"
                                className={styles.cancelBtn}
                                onClick={handleCloseEdit}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className={styles.saveBtn}
                                onClick={handleSaveEdit}
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
                )}
        </>
    )
}
export default ManageReports;