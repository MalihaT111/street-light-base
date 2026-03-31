import styles from "../Dashboard.module.css";

export default function BoroughClustersCard({ boroughs }) {
  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div>
          <div className={styles.cardTitle}>Borough report clusters</div>
          <div className={styles.cardSubtitle}>
            Boroughs: Manhattan, Brooklyn, Queens, Bronx, and Staten island
          </div>
        </div>
        <div className={styles.softPill}>Borough only</div>
      </div>

      <div className={styles.mapGrid}>
        <div className={`${styles.heatGrid} ${styles.boroughGrid}`}>
          {boroughs.map((borough) => (
            <div
              key={borough.code}
              className={`${styles.heatCell} ${styles[borough.level]}`}
            >
              <div className={styles.boroughCode}>{borough.code}</div>
              <div className={styles.boroughName}>{borough.name}</div>
              <div className={styles.boroughCount}>{borough.count}</div>
            </div>
          ))}
        </div>

        <div className={styles.legend}>
          <span>Low</span>
          <div className={styles.legendBar} />
          <span>High</span>
        </div>
      </div>
    </div>
  );
}
