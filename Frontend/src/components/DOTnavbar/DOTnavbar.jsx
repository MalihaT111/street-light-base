import React from "react";
import { Link, useLocation } from 'react-router-dom';
import styles from "./DOTnavbar.module.css";

export default function DOTnavbar() {
  const location = useLocation();

  const getActiveTab = () => {
    if (location.pathname === '/dashboard') return 'analytics';
    if (location.pathname === '/all-reports') return 'reports';
    return 'analytics'; // default
  };

  const activeTab = getActiveTab();

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
            <div className={styles.brandTitle}>Street Systems</div>
            <div className={styles.brandSubtitle}>DOT Admin</div>
          </div>
        </div>

        <nav className={styles.nav}>
          <Link to="/dashboard" className={`${styles.navItem} ${activeTab === 'analytics' ? styles.active : ''}`}>
            Analytics
          </Link>
          <Link to="/all-reports" className={`${styles.navItem} ${activeTab === 'reports' ? styles.active : ''}`}>
            View Reports
          </Link>
        </nav>
      </div>
    </header>
  );
}