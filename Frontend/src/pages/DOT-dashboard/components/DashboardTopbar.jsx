import styles from "../Dashboard.module.css";

export default function DashboardTopbar() {
  return (
    <header className={styles.topbar}>
      <div className={styles.topbarInner}>
        <div className={styles.brand}>
          <div className={styles.logoMark}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
            </svg>
          </div>

          <div>
            <div className={styles.brandTitle}>Street Light Base</div>
          </div>
        </div>
        <nav className={styles.nav}>
          <div className={`${styles.navItem} ${styles.active}`}>Analytics</div>
        </nav>
      </div>
    </header>
  );
}
