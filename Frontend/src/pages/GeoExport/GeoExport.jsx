import { useState } from 'react';
import { FaDownload, FaMapMarkedAlt } from 'react-icons/fa';
import DOTnavbar from '../../components/DOTnavbar/DOTnavbar';
import useAuth from '../../hooks/useAuth';
import styles from './GeoExport.module.css';
import Cookies from 'js-cookie';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

const BOROUGH_OPTIONS = ["Manhattan", "Brooklyn", "Queens", "Bronx", "Staten Island"];
const RATING_OPTIONS = ["good", "fair", "poor"];

const SRS_OPTIONS = [
  { value: "4326", label: "WGS 84 (EPSG:4326)", description: "Standard latitude / longitude" },
  { value: "2263", label: "NY Long Island ftUS (EPSG:2263)", description: "For Cyclomedia / DOT import" },
];

export default function GeoExport() {
  const { user } = useAuth();
  const [borough, setBorough] = useState("");
  const [rating, setRating] = useState("");
  const [srs, setSrs] = useState("4326");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: 'success'|'error', message }

  async function handleDownload() {
    setLoading(true);
    setFeedback(null);

    const params = new URLSearchParams();
    if (borough) params.set("borough", borough);
    if (rating) params.set("rating", rating);
    if (srs !== "4326") params.set("srs", srs);

    const query = params.toString() ? `?${params}` : "";
    const token = Cookies.get("token");

    try {
      const response = await fetch(`${API_BASE}/api/admin/reports/export.geojson${query}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || `Server error ${response.status}`);
      }

      const blob = await response.blob();
      const disposition = response.headers.get("Content-Disposition") || "";
      const filenameMatch = disposition.match(/filename="?([^"]+)"?/);
      const filename = filenameMatch ? filenameMatch[1] : "streetlight_base_reports.geojson";

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);

      setFeedback({ type: "success", message: `Downloaded ${filename}` });
    } catch (err) {
      setFeedback({ type: "error", message: err.message || "Download failed." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      <DOTnavbar username={user?.username ?? "Admin"} />

      <main className={styles.main}>
        <div className={styles.header}>
          <FaMapMarkedAlt className={styles.headerIcon} />
          <div>
            <h1 className={styles.title}>Export Reports</h1>
            <p className={styles.subtitle}>
              Download a GeoJSON snapshot of active reports for use in Cyclomedia.
            </p>
          </div>
        </div>

        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Coordinate System</h2>

          <div className={styles.srsGroup}>
            {SRS_OPTIONS.map(opt => (
              <label key={opt.value} className={`${styles.srsOption} ${srs === opt.value ? styles.srsSelected : ""}`}>
                <input
                  type="radio"
                  name="srs"
                  value={opt.value}
                  checked={srs === opt.value}
                  onChange={() => setSrs(opt.value)}
                  className={styles.srsRadio}
                />
                <div>
                  <span className={styles.srsLabel}>{opt.label}</span>
                  <span className={styles.srsDesc}>{opt.description}</span>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Filters <span className={styles.optional}>(optional)</span></h2>

          <div className={styles.filters}>
            <div className={styles.filterGroup}>
              <label className={styles.label} htmlFor="borough">Borough</label>
              <select
                id="borough"
                className={styles.select}
                value={borough}
                onChange={e => setBorough(e.target.value)}
              >
                <option value="">All boroughs</option>
                {BOROUGH_OPTIONS.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            <div className={styles.filterGroup}>
              <label className={styles.label} htmlFor="rating">Rating</label>
              <select
                id="rating"
                className={styles.select}
                value={rating}
                onChange={e => setRating(e.target.value)}
              >
                <option value="">All ratings</option>
                {RATING_OPTIONS.map(r => (
                  <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>

          {feedback && (
            <div className={`${styles.feedback} ${styles[feedback.type]}`}>
              {feedback.message}
            </div>
          )}

          <button
            className={styles.downloadBtn}
            onClick={handleDownload}
            disabled={loading}
          >
            <FaDownload className={styles.btnIcon} />
            {loading ? "Preparing download…" : "Download GeoJSON"}
          </button>
        </div>

        <p className={styles.note}>
          Export includes all active reports with valid coordinates. Rejected and deleted reports are excluded.
        </p>
      </main>
    </div>
  );
}
