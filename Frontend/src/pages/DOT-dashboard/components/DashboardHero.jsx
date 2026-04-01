import styles from "../Dashboard.module.css";

export default function DashboardHero({ metrics }) {
  return (
    <section className={styles.hero}>
      <div className={styles.heroContent}>
        <h1 className={styles.heroTitle}>Streetlight base damage analytics</h1>
        <p className={styles.heroSubtitle}>
          Review borough-level reporting volume, unresolved cases, and damage
          trends in one place.
        </p>
      </div>

      <div className={styles.heroMetrics}>
        {metrics.map((metric) => (
          <div key={metric.label} className={styles.heroMetric}>
            <div className={styles.heroMetricValue}>{metric.value}</div>
            <div className={styles.heroMetricLabel}>{metric.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
