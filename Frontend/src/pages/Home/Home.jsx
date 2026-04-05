import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from './Home.module.css';
import { FaChartLine, FaFlag, FaTrophy, FaFire, FaMedal, FaArrowRight } from 'react-icons/fa';
import Navbar from '../../components/Navbar/Navbar';

const Home = () => {
  const navigate = useNavigate();
  
  // Get user from localStorage
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
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
      <Navbar username={username} activeTab="home" />

      {/* Main Content */}
      <main className={styles.mainContent}>
        {/* Welcome Banner */}
        <div className={styles.welcomeBanner}>
          <div className={styles.welcomeContent}> 
          <h1 className={styles.welcomeTitle}>
            Welcome back, {username} 👋
          </h1>
          <p className={styles.welcomeSubtitle}>
            Keep up the great work making NYC streets safer!
          </p>
          </div>
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
            <Link to="/reports" className={styles.ctaButton}>
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
                  <span className=
                  {`${styles.rankBadge} 
                    ${item.rank === 1 ? styles.topRank1 : ''}
                    ${item.rank === 2 ? styles.topRank2 : ''}
                    ${item.rank === 3 ? styles.topRank3 : ''}`}
                  >
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
            <Link to="/progress" className={styles.viewAllLink}>
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