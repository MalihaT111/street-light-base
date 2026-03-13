import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from './Home.module.css';
import { 
  FaChartLine, 
  FaFlag, 
  FaTrophy, 
  FaFire, 
  FaMedal, 
  FaArrowRight,
  FaHome,
  FaFileAlt,
  FaChartBar,
  FaUser,
  FaCog,
  FaSignOutAlt
} from 'react-icons/fa';

const Home = () => {
  const navigate = useNavigate();
  
  // Get user from localStorage
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);
  
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (!savedUser) {
      navigate('/');
      return;
    }
    try {
      setUser(JSON.parse(savedUser));
    } catch (error) {
      console.error('Error parsing user data:', error);
      navigate('/');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  const username = user?.username || 'Citizen';

  useEffect(() => {
    const handleOutsidePress = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsidePress);
    document.addEventListener('touchstart', handleOutsidePress);

    return () => {
      document.removeEventListener('mousedown', handleOutsidePress);
      document.removeEventListener('touchstart', handleOutsidePress);
    };
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/');
  };

  const toggleUserMenu = () => {
    setIsUserMenuOpen((prevOpen) => !prevOpen);
  };

  const closeUserMenu = () => {
    setIsUserMenuOpen(false);
  };

  if (loading) return null;
  
  // Mock data for dashboard
  const mockStats = {
    reportsSubmitted: 12,
    totalPoints: 850,
    dayStreak: 7,
    badgesEarned: 3
  };

  const mockLeaderboard = [
    { rank: 1, name: 'alex_nyc', points: 1250, reports: 18 },
    { rank: 2, name: 'mike_bk', points: 1100, reports: 16 },
    { rank: 3, name: 'sarah_q', points: 980, reports: 14 },
    { rank: 4, name: 'john_man', points: 850, reports: 12 },
    { rank: 5, name: 'lisa_brx', points: 720, reports: 10 }
  ];

  const mockChallenges = [
    { title: 'Report 5 streetlights', progress: 3, total: 5, reward: 100 },
    { title: 'Maintain 7-day streak', progress: 7, total: 7, reward: 150 },
    { title: 'Earn 3 badges', progress: 3, total: 3, reward: 200 }
  ];

  return (
    <div className={styles.container}>
      {/* Top Navigation Bar */}
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
          <Link to="/home" className={`${styles.navLink} ${styles.active}`}>
            <FaHome className={styles.navIcon} />
            <span>Home</span>
          </Link>
          <Link to="/reports" className={styles.navLink}>
            <FaFileAlt className={styles.navIcon} />
            <span>Reports</span>
          </Link>
          <Link to="/leaderboard" className={styles.navLink}>
            <FaChartBar className={styles.navIcon} />
            <span>Leaderboard</span>
          </Link>
        </div>
        
        <div
          ref={userMenuRef}
          className={`${styles.userInfo} ${isUserMenuOpen ? styles.userInfoOpen : ''}`}
        >
          <button
            type="button"
            className={styles.userMenuTrigger}
            onClick={toggleUserMenu}
            aria-haspopup="menu"
            aria-expanded={isUserMenuOpen}
          >
            <div className={styles.userAvatar}>
              {username.charAt(0).toUpperCase()}
            </div>
            <span className={styles.userName}>{username}</span>
          </button>
          <div className={styles.userDropdown}>
            <Link to="/profile" className={styles.dropdownItem} onClick={closeUserMenu}>
              <FaUser className={styles.dropdownIcon} />
              <span>Profile</span>
            </Link>
            <Link to="/settings" className={styles.dropdownItem} onClick={closeUserMenu}>
              <FaCog className={styles.dropdownIcon} />
              <span>Settings</span>
            </Link>
            <button
              onClick={() => {
                closeUserMenu();
                handleSignOut();
              }}
              className={styles.dropdownItemButton}
            >
              <FaSignOutAlt className={styles.dropdownIcon} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className={styles.mainContent}>
        {/* Welcome Banner */}
        <div className={styles.welcomeBanner}>
          <h1 className={styles.welcomeTitle}>
            Welcome back, {username} 👋
          </h1>
          <p className={styles.welcomeSubtitle}>
            Keep up the great work making NYC streets safer!
          </p>
        </div>

        {/* Overview Stats Cards */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statHeader}>
              <FaFlag className={styles.statIcon} />
              <h3>Reports Submitted</h3>
            </div>
            <div className={styles.statValue}>{mockStats.reportsSubmitted}</div>
            <div className={styles.statChange}>+2 this week</div>
          </div>
          
          <div className={styles.statCard}>
            <div className={styles.statHeader}>
              <FaChartLine className={styles.statIcon} />
              <h3>Total Points</h3>
            </div>
            <div className={styles.statValue}>{mockStats.totalPoints}</div>
            <div className={styles.statChange}>+150 this month</div>
          </div>
          
          <div className={styles.statCard}>
            <div className={styles.statHeader}>
              <FaFire className={styles.statIcon} />
              <h3>Day Streak</h3>
            </div>
            <div className={styles.statValue}>{mockStats.dayStreak} days</div>
            <div className={styles.statChange}>Keep it going!</div>
          </div>
          
          <div className={styles.statCard}>
            <div className={styles.statHeader}>
              <FaMedal className={styles.statIcon} />
              <h3>Badges Earned</h3>
            </div>
            <div className={styles.statValue}>{mockStats.badgesEarned}</div>
            <div className={styles.statChange}>2 more to go!</div>
          </div>
        </div>

        {/* Submit Report CTA */}
        <div className={styles.ctaSection}>
          <div className={styles.ctaContent}>
            <h2>See something wrong?</h2>
            <p>Report damaged streetlights, potholes, or other issues to help keep NYC streets safe.</p>
            <Link to="/report" className={styles.ctaButton}>
              Submit a Report <FaArrowRight className={styles.ctaIcon} />
            </Link>
          </div>
          <div className={styles.ctaIllustration}>
            <div className={styles.illustrationCircle}></div>
          </div>
        </div>

        {/* Leaderboard Section */}
        <div className={styles.leaderboardSection}>
          <div className={styles.sectionHeader}>
            <h2>Top Contributors</h2>
            <Link to="/leaderboard" className={styles.viewAllLink}>
              View All <FaArrowRight />
            </Link>
          </div>
          
          <div className={styles.leaderboardTable}>
            <div className={styles.tableHeader}>
              <div className={styles.headerCell}>Rank</div>
              <div className={styles.headerCell}>User</div>
              <div className={styles.headerCell}>Points</div>
              <div className={styles.headerCell}>Reports</div>
            </div>
            
            {mockLeaderboard.map((item) => (
              <div key={item.rank} className={styles.tableRow}>
                <div className={styles.rankCell}>
                  <span className={`${styles.rankBadge} ${item.rank <= 3 ? styles.topRank : ''}`}>
                    {item.rank}
                  </span>
                </div>
                <div className={styles.userCell}>
                  <div className={styles.userAvatarSmall}>
                    {item.name.charAt(0).toUpperCase()}
                  </div>
                  <span>{item.name}</span>
                </div>
                <div className={styles.pointsCell}>{item.points}</div>
                <div className={styles.reportsCell}>{item.reports}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Challenges Section */}
        <div className={styles.challengesSection}>
          <div className={styles.sectionHeader}>
            <h2>Active Challenges</h2>
            <Link to="/challenges" className={styles.viewAllLink}>
              View All <FaArrowRight />
            </Link>
          </div>
          
          <div className={styles.challengesGrid}>
            {mockChallenges.map((challenge, index) => (
              <div key={index} className={styles.challengeCard}>
                <div className={styles.challengeHeader}>
                  <FaTrophy className={styles.challengeIcon} />
                  <h3>{challenge.title}</h3>
                </div>
                <div className={styles.progressBar}>
                  <div 
                    className={styles.progressFill}
                    style={{ width: `${(challenge.progress / challenge.total) * 100}%` }}
                  ></div>
                </div>
                <div className={styles.progressText}>
                  {challenge.progress}/{challenge.total} completed
                </div>
                <div className={styles.reward}>
                  Reward: <span className={styles.rewardPoints}>{challenge.reward} points</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Home;