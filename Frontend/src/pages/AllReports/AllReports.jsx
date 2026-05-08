import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSearch, FaChevronDown, FaTimes } from 'react-icons/fa';
import ReportCard from '../../components/ReportCard/ReportCard';
import DOTnavbar from '../../components/DOTnavbar/DOTnavbar';
import styles from './AllReports.module.css';
import Cookies from 'js-cookie';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";
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

function canAccessAllReports(role) {
    return ["admin", "dot_admin", "ppl"].includes(String(role || "").trim().toLowerCase());
}

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
        photo_urls: r.photo_urls && r.photo_urls.length > 0
            ? r.photo_urls
            : r.photo_url ? [r.photo_url] : [],
        created_at: r.created_at,
        latitude: r.latitude,
        longitude: r.longitude,
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
    const [fetchError, setFetchError] = useState(null);
    const [selectedConditions, setSelectedConditions] = useState([]);
    const [selectedBoroughs, setSelectedBoroughs] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortOption, setSortOption] = useState("Newest");
    const [reports, setReports] = useState([]);

    const hasActiveFilters =
        selectedConditions.length > 0 ||
        selectedBoroughs.length > 0 ||
        searchQuery.trim() !== '';

    const clearAll = () => {
        setSelectedConditions([]);
        setSelectedBoroughs([]);
        setSearchQuery('');
    };

    const csvHelper = (value) => {
        const str = value == null ? '' : String(value);
        return `"${str.replace(/"/g, '""')}"`;
    };
    
    const handleExportCSV = () => {
        const header = ['ID', 'Borough', 'Rating', 'Damage Types', 'Date', 'Latitude', 'Longitude', 'Photo URL'];
        const rows = filteredReports.map((r) => {
            const photoUrl = r.photo_urls?.[0] || r.photo_url || '';
            return [r.id, r.borough, r.rating, r.damageType, r.date, r.latitude, r.longitude, photoUrl];
        });
        const csv = [header, ...rows].map(row => row.map(csvHelper).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `reports-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
    };

    const handleExportGeoJSON = () => {
        const features = filteredReports
        .filter(r => r.latitude && r.longitude)
        .map(r => ({
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [parseFloat(r.longitude), parseFloat(r.latitude)] },
            properties: {
                id: r.id, borough: r.borough, rating: r.rating,
                damage_types: r.damageType, date: r.date,
                photo_url: r.photo_urls?.[0] || r.photo_url || null,
            },
        }));
        const geojson = JSON.stringify({ type: 'FeatureCollection', features }, null, 2);
        const blob = new Blob([geojson], { type: 'application/geo+json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `reports-${new Date().toISOString().slice(0, 10)}.geojson`;
        a.click();
    };

    useEffect(() => {
        const savedUser = Cookies.get("user");
        const token = Cookies.get("token");
        if (!savedUser) {
            navigate("/home");
            return;
        }
        try {
            const parsedUser = JSON.parse(savedUser);
            if (!token || !canAccessAllReports(parsedUser?.role)) {
                navigate("/home");
                return;
            }
            setUser(parsedUser);
            fetchReports(token);
        } catch (error) {
            console.error("Error parsing user data:", error);
            navigate("/home");
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    async function fetchReports(token) {
        setFetchError(null);
        try {
            const res = await fetch(`${API_BASE}/api/reports/all?limit=200`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || data.msg || "Failed to load reports");
            setReports(data.reports);
        } catch (error) {
            setFetchError(error.message);
        }
    }

    if (loading) return null;

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
                const order = { Poor: 0, Fair: 1, Good: 2 };
                return order[a.rating] - order[b.rating];
            }
            if (sortOption === "Rating: Good to Poor") {
                const order = { Good: 0, Fair: 1, Poor: 2 };
                return order[a.rating] - order[b.rating];
            }
            return 0;
        });

    return (
        <>
            <DOTnavbar activeTab='reports' username={user?.username}/>
            <div className={styles["report-wrapper"]}>
                <div className={styles["top-title"]}>
                    <h1 className={styles["report-title"]}>All Reports</h1>
                    <p className={styles["report-subtitle"]}>Monitor and review streetlight condition reports across all five boroughs.</p>
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
                    <div className={styles.exportGroup}>
                        <button type="button" className={styles.exportBtn} onClick={handleExportCSV}>
                            Export CSV
                        </button>
                        <button type="button" className={styles.exportBtn} onClick={handleExportGeoJSON}>
                            Export GeoJSON
                        </button>
                    </div>
                </div>

                {fetchError && <p className={styles.emptyState}>{fetchError}</p>}
                <div className={styles.reportCardWrapper}>
                    {filteredReports.length > 0 ? (
                        filteredReports.map(report => (
                            <ReportCard
                                key={report.id}
                                report={report}
                            />
                        ))
                    ) : (
                        <p className={styles.emptyState}>
                            {reports.length === 0 && !fetchError
                                ? "No reports have been submitted yet."
                                : "No reports match the current filters."}
                        </p>
                    )}
                </div>
            </div>
        </>
    );
}

export default AllReports;
