import styles from "../Dashboard.module.css";

export default function ReportsOverTimeCard({ reports }) {
  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div>
          <div className={styles.cardTitle}>Reports over time</div>
          <div className={styles.cardSubtitle}>
            Monthly total volume (<b>Blue</b>) versus poor conditions (<b>Orange</b>)
          </div>
        </div>
        <div className={styles.tag}>Last 6 months</div>
      </div>

      <div className={styles.chartPlaceholder}>
        <div className={styles.bars}>
          {reports.map((item) => (
            <div key={item.month} className={styles.barGroup}>
              <div className={styles.barPair}>
                <div
                  className={styles.bar}
                  style={{ height: `${item.totalHeight}px` }}
                />
                <div
                  className={`${styles.bar} ${styles.severe}`}
                  style={{ height: `${item.poorHeight}px` }}
                />
              </div>
              <div className={styles.monthLabel}>{item.month}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
