import styles from "../Dashboard.module.css";

function StatCard({ card }) {
  return (
    <div className={styles.statCard}>
      <div className={styles.statTop}>
        <div>
          <div className={styles.statLabel}>{card.label}</div>
          <div className={`${styles.metricValue} ${card.valueClass}`}>
            {card.value}
          </div>
        </div>
      </div>
      <div className={styles.statSubtext}>{card.subtext}</div>
    </div>
  );
}

export default function StatsGrid({ cards }) {
  return (
    <section className={styles.statsGrid}>
      {cards.map((card) => (
        <StatCard key={card.label} card={card} />
      ))}
    </section>
  );
}
