import styles from "../Dashboard.module.css";

function SummaryCardSkeleton() {
  return (
    <div className={styles.statCard}>
      <div className={styles.skeletonLabel} />
      <div className={styles.skeletonValue} />
      <div className={styles.skeletonText} />
    </div>
  );
}

export default function SummaryCards({ cards, loading, error }) {
  if (loading) {
    return (
      <section className={styles.statsGrid} aria-label="Loading summary cards">
        {Array.from({ length: 3 }).map((_, index) => (
          <SummaryCardSkeleton key={index} />
        ))}
      </section>
    );
  }

  if (error) {
    return <div className={styles.summaryError}>{error}</div>;
  }

  return (
    <section className={styles.statsGrid}>
      {cards.map((card) => (
        <article key={card.label} className={styles.statCard}>
          <p className={styles.statLabel}>{card.label}</p>
          <p className={styles.metricValue}>{card.value}</p>
          <p className={styles.statSubtext}>{card.description}</p>
        </article>
      ))}
    </section>
  );
}
