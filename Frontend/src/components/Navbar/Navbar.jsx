import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { FaHome, FaFileAlt, FaChartBar, FaCog, FaSignOutAlt, FaAward } from 'react-icons/fa';
import { RxHamburgerMenu } from "react-icons/rx";
import styles from './Navbar.module.css';

const Navbar = ({ username, activeTab = 'home', minimal = false }) => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const storedUser = (() => { try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; } })();
  const homeRoute = storedUser?.role === 'admin' ? '/dashboard' : '/home';

  const handleSignOut = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/');
  };

  return (
    <nav className={`${styles.navbar} ${minimal ? styles.minimalNavbar : ''}`}>
      <Link to={minimal ? '/' : homeRoute} className={styles.logo}>
        <div className={styles.logoMark}>
          <svg viewBox="0 0 24 24">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
          </svg>
        </div>
        <span>Street Light Base</span>
      </Link>

      {!minimal && (
        <>
          <div className={styles.navLinks}>
            {/* Desktop: For desktop view, the links will be displayed directly. */}
            <Link to="/home" className={`${styles.navLink} ${activeTab === 'home' ? styles.active : ''}`}>
              <FaHome className={styles.navIcon} />
              <span>Home</span>
            </Link>
            <div className={styles.dropdown}>
              <Link className={`${styles.navLink} ${activeTab === 'reports' ? styles.active : ''}`}>
                <FaFileAlt className={styles.navIcon} />
                <span>Reports ▾</span>
              </Link>
              <div className={styles.dropdownMenu}>
                  <Link to="/reports" className={styles.dropdownItem}>
                    <span>Submit Report</span>
                  </Link>
                  <Link to="/manage-reports" className={styles.dropdownItem}>
                    <span>View/Edit Reports</span>
                  </Link>
              </div>
            </div>
            <Link to="/leaderboard" className={`${styles.navLink} ${activeTab === 'leaderboard' ? styles.active : ''}`}>
              <FaChartBar className={styles.navIcon} />
              <span>Leaderboard</span>
            </Link>
            <Link to="/challenge" className={`${styles.navLink} ${activeTab === 'challenge' ? styles.active : ''}`}>
              <FaAward className={styles.navIcon} />
              <span>Challenge</span>
            </Link>
            <Link to="/settings" className={`${styles.navLink} ${activeTab === 'settings' ? styles.active : ''}`}>
              <FaCog className={styles.navIcon} />
              <span>Settings</span>
            </Link>
          </div>

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
                    <Link to="/home" className= {styles.navLink}>
                    <span>Home</span>
                  </Link>
                  <Link to="/reports" className= {styles.navLink}>
                    <span>Submit Report</span>
                  </Link>
                  <Link to="/manage-reports" className={styles.navLink}>
                    <span>View/Edit Reports</span>
                  </Link>
                  <Link to="/leaderboard" className={styles.navLink}>
                    <span>Leaderboard</span>
                  </Link>
                  <Link to="/challenge" className={styles.navLink}>
                    <span>Challenge</span>
                  </Link>
                  <Link to="/settings" className={styles.navLink}>
                    <span>Settings</span>
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
            <button onClick={handleSignOut} className={styles.signOutBtn} title="Sign Out">
              <FaSignOutAlt className={styles.signOutIcon} />
              <span>Sign Out</span>
            </button>
          </div>
        </>
      )}
    </nav>
  );
};

export default Navbar;
