import { Link, useNavigate } from 'react-router-dom';
import { FaHome, FaFileAlt, FaChartBar, FaUser, FaCog, FaSignOutAlt } from 'react-icons/fa';
import styles from './Navbar.module.css';

const Navbar = ({ username, activeTab = 'home' }) => {
  const navigate = useNavigate();

  const handleSignOut = () => {
    // Clear localStorage
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    
    console.log('User signed out');
    navigate('/');
  };

  return (
    <nav className={styles.navbar}>
      <div className={styles.logo}>
        <div className={styles.logoMark}>
          <svg viewBox="0 0 24 24">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
          </svg>
        </div>
        <span>Street Systems</span>
      </div>
      
      <div className={styles.navLinks}>
        <Link to="/home" className={`${styles.navLink} ${activeTab === 'home' ? styles.active : ''}`}>
          <FaHome className={styles.navIcon} />
          <span>Home</span>
        </Link>
        <Link to="/reports" className={`${styles.navLink} ${activeTab === 'reports' ? styles.active : ''}`}>
          <FaFileAlt className={styles.navIcon} />
          <span>Reports</span>
        </Link>
        <Link to="/leaderboard" className={`${styles.navLink} ${activeTab === 'leaderboard' ? styles.active : ''}`}>
          <FaChartBar className={styles.navIcon} />
          <span>Leaderboard</span>
        </Link>
        <Link to="/profile" className={`${styles.navLink} ${activeTab === 'profile' ? styles.active : ''}`}>
          <FaUser className={styles.navIcon} />
          <span>Profile</span>
        </Link>
        <Link to="/settings" className={`${styles.navLink} ${activeTab === 'settings' ? styles.active : ''}`}>
          <FaCog className={styles.navIcon} />
          <span>Settings</span>
        </Link>
      </div>
      
      <div className={styles.userSection}>
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
    </nav>
  );
};

export default Navbar;