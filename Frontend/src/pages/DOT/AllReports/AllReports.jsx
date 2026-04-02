import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSearch, FaChevronDown, FaTimes } from 'react-icons/fa';
import DOTnavbar from '../../../components/DOTnavbar/DOTnavbar';
import ReportCard from '../../../components/ReportCard/ReportCard';
import styles from './AllReports.module.css';

const CONDITION_OPTIONS = ["Poor", "Fair", "Good"];
const BOROUGH_OPTIONS = ["Manhattan", "Brooklyn", "Queens", "Bronx", "Staten Island"];

function MultiSelectDropdown({ label, options, selected, onChange }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        function handleClickOutside(e) {
            if (ref.current && !ref.current.contains(e.target)) {
                setOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleOption = (option) => {
        let newSelected;
        if (selected.length === 0) {
            // All currently selected — deselect just this one
            newSelected = options.filter(o => o !== option);
        } else if (selected.includes(option)) {
            newSelected = selected.filter(o => o !== option);
        } else {
            newSelected = [...selected, option];
        }
        // Normalize: if all explicitly selected, treat as "all" (empty)
        onChange(newSelected.length === options.length ? [] : newSelected);
    };

    const isChecked = (option) => selected.length === 0 || selected.includes(option);
    const allChecked = selected.length === 0;
    const activeCount = selected.length > 0 ? selected.length : null;

    return (
        <div className={styles.dropdownWrapper} ref={ref}>
            <button
                type="button"
                className={`${styles.dropdownTrigger} ${activeCount ? styles.dropdownActive : ''}`}
                onClick={() => setOpen(o => !o)}
            >
                <span>{label}{activeCount ? ` (${activeCount})` : ''}</span>
                <FaChevronDown className={`${styles.chevron} ${open ? styles.chevronOpen : ''}`} />
            </button>

            {open && (
                <div className={styles.dropdownPanel}>
                    <label className={styles.dropdownItem}>
                        <input
                            type="checkbox"
                            checked={allChecked}
                            onChange={() => onChange([])}
                        />
                        <span>All selected</span>
                    </label>
                    <div className={styles.dropdownDivider} />
                    {options.map(option => (
                        <label key={option} className={styles.dropdownItem}>
                            <input
                                type="checkbox"
                                checked={isChecked(option)}
                                onChange={() => toggleOption(option)}
                            />
                            <span>{option}</span>
                        </label>
                    ))}
                </div>
            )}
        </div>
    );
}

function AllReports() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedConditions, setSelectedConditions] = useState([]);
    const [selectedBoroughs, setSelectedBoroughs] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortOption, setSortOption] = useState("Newest");

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

    const handleEdit = (report) => {
        setEditingReport(report);
        setEditForm(report);
        setIsEditOpen(true);
    };

    const handleDelete = (reportId) => {
        setReports(prev => prev.filter(r => r.id !== reportId));
    };

    const handleCloseEdit = () => {
        setIsEditOpen(false);
        setEditingReport(null);
    };

    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveEdit = () => {
        setReports(prev =>
            prev.map(r => r.id === editingReport.id ? { ...r, ...editForm } : r)
        );
        setIsEditOpen(false);
        setEditingReport(null);
    };

    const hasActiveFilters =
        selectedConditions.length > 0 ||
        selectedBoroughs.length > 0 ||
        searchQuery.trim() !== '';

    const clearAll = () => {
        setSelectedConditions([]);
        setSelectedBoroughs([]);
        setSearchQuery('');
    };

    const filteredReports = reports
        .filter(report => {
            const conditionMatch = selectedConditions.length === 0 || selectedConditions.includes(report.rating);
            const boroughMatch = selectedBoroughs.length === 0 || selectedBoroughs.includes(report.borough);
            const searchMatch = searchQuery.trim() === '' ||
                report.address.toLowerCase().includes(searchQuery.toLowerCase());
            return conditionMatch && boroughMatch && searchMatch;
        })
        .sort((a, b) => {
            if (sortOption === "Newest") return new Date(b.date) - new Date(a.date);
            if (sortOption === "Oldest") return new Date(a.date) - new Date(b.date);
            if (sortOption === "Rating: Poor to Good") {
                const order = { Poor: 0, Fair: 1, Good: 2 };
                return order[a.rating] - order[b.rating];
            }
            if (sortOption === "Rating: Good to Poor") {
                const order = { Good: 2, Fair: 1, Poor: 0 };
                return order[b.rating] - order[a.rating];
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

    if (loading) return null;

    return (
        <>
            <DOTnavbar activeTab='reports'/>
            <div className={styles["report-wrapper"]}>
                <div className={styles["top-title"]}>
                    <h1 className={styles["report-title"]}>All Reports</h1>
                    <p className={styles["manage-report-subtitle"]}>Monitor and review streetlight condition reports across all boroughs</p>
                </div>
                <div className={styles.filterBar}>
                    <div className={styles.filterGroup}>
                        <MultiSelectDropdown
                            label="Condition"
                            options={CONDITION_OPTIONS}
                            selected={selectedConditions}
                            onChange={setSelectedConditions}
                        />
                        <MultiSelectDropdown
                            label="Borough"
                            options={BOROUGH_OPTIONS}
                            selected={selectedBoroughs}
                            onChange={setSelectedBoroughs}
                        />
                        {hasActiveFilters && (
                            <button type="button" className={styles.clearAllBtn} onClick={clearAll}>
                                <FaTimes />
                                Clear All
                            </button>
                        )}
                    </div>

                    <div className={styles.searchWrapper}>
                        <FaSearch className={styles.searchIcon} />
                        <input
                            type="text"
                            className={styles.searchInput}
                            placeholder="Search reports..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className={styles.reportSortWrapper}>
                        <select
                            className={styles.reportsSort}
                            value={sortOption}
                            onChange={e => setSortOption(e.target.value)}
                        >
                            <option>Newest</option>
                            <option>Oldest</option>
                            <option>Rating: Poor to Good</option>
                            <option>Rating: Good to Poor</option>
                        </select>
                    </div>
                </div>

                <div className={styles.reportCardWrapper}>
                    {filteredReports.length > 0 ? (
                        filteredReports.map(report => (
                            <ReportCard
                                key={report.id}
                                report={report}
                            />
                        ))
                    ) : (
                        <p className={styles.emptyState}>No reports match the current filters.</p>
                    )}
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
                            <button type="button" className={styles.cancelBtn} onClick={handleCloseEdit}>
                                Cancel
                            </button>
                            <button type="button" className={styles.saveBtn} onClick={handleSaveEdit}>
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default AllReports;
