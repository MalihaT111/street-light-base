import React from "react";
import { useState } from "react";
import { RxHamburgerMenu } from "react-icons/rx";
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaChartLine, FaFileAlt, FaSignOutAlt } from 'react-icons/fa';
import styles from "./DOTnavbar.module.css";

export default function DOTnavbar({ username = "User" }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const getActiveTab = () => {
    if (location.pathname === '/dashboard') return 'analytics';
    if (location.pathname === '/all-reports') return 'reports';
    return 'analytics';
  };

  const activeTab = getActiveTab();

  const handleSignOut = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/');
  };

  return (
    <header className={styles.topbar}>
      <div className={styles.topbarInner}>
        
        {/* Logo */}
        <div className={styles.brand}>
          <div className={styles.logoMark}>
            <svg viewBox="0 0 24 24">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"></path>
            </svg>
          </div>

          <div className={styles.brandText}>
            <span className = {styles.brandTitle}>Street Light Base</span>
          </div>
        </div>

        {/* Nav links */}
        <nav className={styles.nav}>
          <Link
            to="/dashboard"
            className={`${styles.navItem} ${activeTab === 'analytics' ? styles.active : ''}`}
          >
            <FaChartLine/>
            Analytics
          </Link>

          <Link
            to="/all-reports"
            className={`${styles.navItem} ${activeTab === 'reports' ? styles.active : ''}`}
          >
            <FaFileAlt />
            View Reports
          </Link>
        </nav>

        {/* User section */}
        <div className={styles.userSection}>
            {/* Mobile: For mobile view, hamburger menu  */}
            <div className = {styles.hamburgerMenu}>
              <RxHamburgerMenu 
                onClick = {() => setMenuOpen(!menuOpen)}
              />
            </div>
            <div>
              {menuOpen && (
                <div className={styles.mobileMenu}>
                  <Link to="/dashboard" className={styles.navItem}>
                    <span>Dashboard</span>
                  </Link>
                  <Link to="/all-reports" className={styles.navItem}>
                    <span>View Reports</span>
                  </Link>
                </div>
              )}
            </div>
          <div className={styles.userInfo}>
            <div className={styles.userAvatar}>
              {username.charAt(0).toUpperCase()}
            </div>
            <span className={styles.userName}>{username}</span>
          </div>

          <button onClick={handleSignOut} className={styles.signOutBtn}>
            <FaSignOutAlt className={styles.signOutIcon} />
            <span>Sign Out</span>
          </button>
        </div>

      </div>
    </header>
  );
}