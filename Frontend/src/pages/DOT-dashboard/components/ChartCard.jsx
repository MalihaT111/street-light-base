import styles from "../Dashboard.module.css";

export default function ChartCard({
  title,
  subtitle,
  loading,
  error,
  isEmpty,
  emptyMessage,
  className = "",
  children,
}) {
  let body = children;

  if (loading) {
    body = <div className={styles.cardState}>Loading chart data...</div>;
  } else if (error) {
    body = <div className={styles.cardStateError}>{error}</div>;
  } else if (isEmpty) {
    body = <div className={styles.cardState}>{emptyMessage}</div>;
  }

  return (
    <section className={`${styles.card} ${className}`.trim()}>
      <div className={styles.cardHeader}>
        <div>
          <h2 className={styles.cardTitle}>{title}</h2>
          <p className={styles.cardSubtitle}>{subtitle}</p>
        </div>
      </div>
      <div className={styles.cardBody}>{body}</div>
    </section>
  );
}
