import styles from "../Dashboard.module.css";

export default function DamageBreakdownCard({ items }) {
  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div>
          <div className={styles.cardTitle}>Damage type breakdown</div>
          <div className={styles.cardSubtitle}>
            Categories now aligned with the reporting form damage types
          </div>
        </div>
        <div className={styles.tag}>6 months</div>
      </div>

      <div className={styles.donutWrap}>
        <div className={styles.donut} />

        <div className={styles.donutLegend}>
          {items.map((item) => (
            <div key={item.label} className={styles.legendRow}>
              <div className={styles.legendLeft}>
                <span className={`${styles.dot} ${item.dotClass}`} />
                {item.label}
              </div>
              <div className={styles.mono}>{item.percent}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
