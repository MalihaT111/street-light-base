import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styles from './Home.module.css';
import { FaChartLine, FaFlag, FaTrophy, FaFire, FaMedal, FaArrowRight } from 'react-icons/fa';
import Navbar from '../../components/Navbar/Navbar';
import useAuth from '../../hooks/useAuth';
import Cookies from 'js-cookie';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

const Home = () => {
  const { user, loading } = useAuth();
  const username = user?.username || 'Citizen';

  const [stats, setStats] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (loading || !user) return;

    const token = Cookies.get('token');
    const authHeaders = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    const fetchStats = async () => {
      const [lbRes, reportsRes, badgesRes, challengesRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/leaderboard/stats`, { headers: authHeaders }),
        fetch(`${API_BASE_URL}/api/reports/mine`, { headers: authHeaders }),
        fetch(`${API_BASE_URL}/api/badges`, { headers: authHeaders }),
        fetch(`${API_BASE_URL}/api/challenges`, { headers: authHeaders }),
      ]);

      const [lbData, reportsData, badgesData, challengesData] = await Promise.all([
        lbRes.json(),
        reportsRes.json(),
        badgesRes.json(),
        challengesRes.json(),
      ]);

      const reportsCount = reportsData.success ? reportsData.pagination?.total ?? 0 : 0;
      const badgesCount = badgesData.success
        ? badgesData.badges.filter((b) => b.earned).length
        : 0;
      const userPoints = lbData.success ? lbData.user_points : 0;
      const userRank = lbData.success ? lbData.user_rank : null;

      let weeklyStreak = 0;
      if (challengesData.success) {
        const determinedChallenge = challengesData.challenges.find(
          (c) => c.key === 'determined'
        );
        if (determinedChallenge) weeklyStreak = determinedChallenge.progress;

        const active = challengesData.challenges.filter((c) => !c.completed).slice(0, 3);
        setChallenges(active.length > 0 ? active : challengesData.challenges.slice(0, 3));
      }

      setStats({ reportsSubmitted: reportsCount, totalPoints: userPoints, userRank, weeklyStreak, badgesCount });
    };

    const fetchLeaderboard = async () => {
      const res = await fetch(`${API_BASE_URL}/api/leaderboard?limit=5`);
      const data = await res.json();
      if (data.success) setLeaderboard(data.leaderboard);
    };

    Promise.all([fetchStats(), fetchLeaderboard()]).finally(() => setDataLoading(false));
  }, [loading, user]);

  if (loading) return null;

  return (
    <div className={styles.container}>
      <Navbar username={username} activeTab="home" />

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
            <div className={styles.statValue}>
              {dataLoading ? '—' : stats?.reportsSubmitted ?? 0}
            </div>
            <div className={styles.statChange}>
              {stats?.userRank ? `Rank #${stats.userRank}` : 'Start reporting!'}
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statHeader}>
              <FaChartLine className={styles.statIcon} />
              <h3>Total Points</h3>
            </div>
            <div className={styles.statValue}>
              {dataLoading ? '—' : stats?.totalPoints ?? 0}
            </div>
            <div className={styles.statChange}>Keep earning points!</div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statHeader}>
              <FaFire className={styles.statIcon} />
              <h3>Day Streak</h3>
            </div>
            <div className={styles.statValue}>
              {dataLoading ? '—' : `${stats?.weeklyStreak ?? 0} days`}
            </div>
            <div className={styles.statChange}>This week</div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statHeader}>
              <FaMedal className={styles.statIcon} />
              <h3>Badges Earned</h3>
            </div>
            <div className={styles.statValue}>
              {dataLoading ? '—' : stats?.badgesCount ?? 0}
            </div>
            <div className={styles.statChange}>
              {stats?.badgesCount === 4 ? 'All badges earned!' : 'Keep going!'}
            </div>
          </div>
        </div>

        {/* Submit Report CTA */}
        <div className={styles.ctaSection}>
          <div className={styles.ctaContent}>
            <h2>See something wrong?</h2>
            <p>Report damaged streetlight bases here and keep the city safe!</p>
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
            </div>

            {dataLoading ? (
              <div className={styles.tableRow}>
                <div className={styles.rankCell}>—</div>
                <div className={styles.userCell}>Loading...</div>
                <div className={styles.pointsCell}>—</div>
              </div>
            ) : leaderboard.length === 0 ? (
              <div className={styles.tableRow}>
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '1rem' }}>
                  No leaderboard data yet.
                </div>
              </div>
            ) : (
              leaderboard.map((item) => (
                <div key={item.rank} className={styles.tableRow}>
                  <div className={styles.rankCell}>
                    <span
                      className={`${styles.rankBadge}
                        ${item.rank === 1 ? styles.topRank1 : ''}
                        ${item.rank === 2 ? styles.topRank2 : ''}
                        ${item.rank === 3 ? styles.topRank3 : ''}`}
                    >
                      {item.rank}
                    </span>
                  </div>
                  <div className={styles.userCell}>
                    <div className={styles.userAvatarSmall}>
                      {item.username.charAt(0).toUpperCase()}
                    </div>
                    <span>{item.username}</span>
                  </div>
                  <div className={styles.pointsCell}>{item.total_points}</div>
                </div>
              ))
            )}
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
            {dataLoading ? (
              <div className={styles.challengeCard}>
                <p>Loading challenges...</p>
              </div>
            ) : challenges.length === 0 ? (
              <div className={styles.challengeCard}>
                <p>All challenges completed! Check back later.</p>
              </div>
            ) : (
              challenges.map((challenge) => (
                <div key={challenge.key} className={styles.challengeCard}>
                  <div className={styles.challengeHeader}>
                    <FaTrophy className={styles.challengeIcon} />
                    <h3>{challenge.name}</h3>
                  </div>
                  <div className={styles.progressBar}>
                    <div
                      className={styles.progressFill}
                      style={{ width: `${(challenge.progress / challenge.target) * 100}%` }}
                    ></div>
                  </div>
                  <div className={styles.progressText}>
                    {challenge.progress}/{challenge.target} completed
                  </div>
                  <div className={styles.reward}>
                    Reward: <span className={styles.rewardPoints}>{challenge.points} points</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Home;
