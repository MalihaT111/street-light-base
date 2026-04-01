import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSearch, FaChevronDown, FaTimes } from 'react-icons/fa';
import Navbar from '../../components/Navbar/Navbar';
import ReportCard from '../../components/ReportCard/ReportCard';
import styles from './ManageReports.module.css';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5001";

const CONDITION_OPTIONS = ["Poor", "Fair", "Good"];
const BOROUGH_OPTIONS = ["Manhattan", "Brooklyn", "Queens", "Bronx", "Staten Island"];

const DAMAGE_TYPE_LABELS = {
    cracked_base: "Cracked base",
    missing_cover: "Missing cover",
    corrosion_rust: "Corrosion / Rust",
    graffiti: "Graffiti",
    physical_impact_damage: "Physical impact",
    leaning_unstable: "Leaning / Unstable",
};

const DAMAGE_TYPES = Object.entries(DAMAGE_TYPE_LABELS).map(([key, label]) => ({ key, label }));

function formatReport(r) {
    const dt = new Date(r.created_at);
    return {
        id: r.id,
        address: r.borough || "Unknown location",
        date: dt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        time: dt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
        damageTags: r.damage_types && r.damage_types.length
            ? r.damage_types.map(d => DAMAGE_TYPE_LABELS[d] || d)
            : [],
        damageType: r.damage_types && r.damage_types.length
            ? r.damage_types.map(d => DAMAGE_TYPE_LABELS[d] || d).join(", ")
            : "—",
        rating: r.rating.charAt(0).toUpperCase() + r.rating.slice(1),
        borough: r.borough,
        photo_url: r.photo_url || null,
        created_at: r.created_at,
        _raw: r,
    };
}

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
            newSelected = options.filter(o => o !== option);
        } else if (selected.includes(option)) {
            newSelected = selected.filter(o => o !== option);
        } else {
            newSelected = [...selected, option];
        }
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

function ManageReports() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [reports, setReports] = useState([]);
    const [fetchError, setFetchError] = useState(null);
    const [selectedConditions, setSelectedConditions] = useState([]);
    const [selectedBoroughs, setSelectedBoroughs] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortOption, setSortOption] = useState("Newest");

    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editingReport, setEditingReport] = useState(null);
    const [editForm, setEditForm] = useState({ rating: "poor", damage_types: [] });
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState(null);

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
            return;
        }
        fetchReports();
    }, [navigate]);

    async function fetchReports() {
        setFetchError(null);
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                navigate("/");
                return;
            }
            const res = await fetch(`${API_BASE}/api/reports/mine`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to load reports");
            setReports(data.reports);
        } catch (err) {
            setFetchError(err.message);
        } finally {
            setLoading(false);
        }
    }

    const handleEdit = (report) => {
        setEditingReport(report);
        setEditForm({
            rating: report._raw.rating,
            damage_types: [...(report._raw.damage_types || [])],
        });
        setSaveError(null);
        setIsEditOpen(true);
    };

    const handleDelete = async (reportId) => {
        if (!window.confirm("Delete this report? This cannot be undone.")) return;
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_BASE}/api/reports/${reportId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Delete failed");
            setReports(prev => prev.filter(r => r.id !== reportId));
        } catch (err) {
            alert(err.message);
        }
    };

    const handleCloseEdit = () => {
        setIsEditOpen(false);
        setEditingReport(null);
        setSaveError(null);
    };

    const toggleDamageType = (key) => {
        setEditForm(prev => ({
            ...prev,
            damage_types: prev.damage_types.includes(key)
                ? prev.damage_types.filter(d => d !== key)
                : [...prev.damage_types, key],
        }));
    };

    const handleSaveEdit = async () => {
        setSaving(true);
        setSaveError(null);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_BASE}/api/reports/${editingReport.id}`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    rating: editForm.rating,
                    damage_types: editForm.damage_types,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Save failed");
            setReports(prev => prev.map(r => r.id === editingReport.id ? data.report : r));
            setIsEditOpen(false);
            setEditingReport(null);
        } catch (err) {
            setSaveError(err.message);
        } finally {
            setSaving(false);
        }
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

    const displayReports = reports.map(formatReport);

    const filteredReports = displayReports
        .filter(report => {
            const conditionMatch = selectedConditions.length === 0 || selectedConditions.includes(report.rating);
            const boroughMatch = selectedBoroughs.length === 0 || selectedBoroughs.includes(report.borough);
            const q = searchQuery.trim().toLowerCase();
            const searchMatch = q === '' ||
                (report.address || '').toLowerCase().includes(q) ||
                (report.date || '').toLowerCase().includes(q) ||
                (report.damageType || '').toLowerCase().includes(q);
            return conditionMatch && boroughMatch && searchMatch;
        })
        .sort((a, b) => {
            if (sortOption === "Newest") return new Date(b.created_at) - new Date(a.created_at);
            if (sortOption === "Oldest") return new Date(a.created_at) - new Date(b.created_at);
            if (sortOption === "Rating: Poor to Good") {
                const order = { poor: 0, fair: 1, good: 2 };
                return order[a._raw.rating] - order[b._raw.rating];
            }
            if (sortOption === "Rating: Good to Poor") {
                const order = { poor: 0, fair: 1, good: 2 };
                return order[b._raw.rating] - order[a._raw.rating];
            }
            return 0;
        });

    if (loading) return null;

    const username = user?.username || "Citizen";

    return (
        <>
            <Navbar username={username} activeTab="reports" />
            <div className={styles["manage-report-wrapper"]}>
                <div className={styles["top-title"]}>
                    <h1 className={styles["manage-report-title"]}>My reports</h1>
                    <p className={styles["manage-report-subtitle"]}>Review, edit, and manage all submitted reports</p>
                </div>

                {fetchError && <p className={styles.errorState}>{fetchError}</p>}

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
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                            />
                        ))
                    ) : (
                        <p className={styles.emptyState}>
                            {reports.length === 0 ? "You haven't submitted any reports yet." : "No reports match the current filters."}
                        </p>
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
                            <label className={styles.modalLabel}>Rating</label>
                            <select
                                value={editForm.rating}
                                onChange={e => setEditForm(prev => ({ ...prev, rating: e.target.value }))}
                                className={styles.modalInput}
                            >
                                <option value="poor">Poor</option>
                                <option value="fair">Fair</option>
                                <option value="good">Good</option>
                            </select>

                            <label className={styles.modalLabel}>Damage Types</label>
                            <div className={styles.damageTypesGrid}>
                                {DAMAGE_TYPES.map(({ key, label }) => (
                                    <label key={key} className={styles.checkboxLabel}>
                                        <input
                                            type="checkbox"
                                            checked={editForm.damage_types.includes(key)}
                                            onChange={() => toggleDamageType(key)}
                                        />
                                        <span>{label}</span>
                                    </label>
                                ))}
                            </div>

                            {saveError && <p className={styles.saveError}>{saveError}</p>}
                        </div>
                        <div className={styles.modalFooter}>
                            <button type="button" className={styles.cancelBtn} onClick={handleCloseEdit}>
                                Cancel
                            </button>
                            <button
                                type="button"
                                className={styles.saveBtn}
                                onClick={handleSaveEdit}
                                disabled={saving}
                            >
                                {saving ? "Saving..." : "Save Changes"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default ManageReports;
