import { FaChartLine, FaMedal, FaTrophy } from "react-icons/fa";

const STATS = [
  {
    key: "points",
    label: "Total Points",
    icon: FaChartLine,
    iconWrapStyle: { background: "#EFF6FF" },
    iconStyle: { color: "#2563EB" },
  },
  {
    key: "badges",
    label: "Badges Earned",
    icon: FaMedal,
    iconWrapStyle: { background: "#F0FDF4" },
    iconStyle: { color: "#10B981" },
  },
  {
    key: "challenges",
    label: "Challenges Done",
    icon: FaTrophy,
    iconWrapStyle: { background: "#FFFBEB" },
    iconStyle: { color: "#D97706" },
  },
];

const ProgressStats = ({
  styles,
  achievements,
  achLoading,
  badgesEarned,
  badgesCount,
  badgesLoading,
  challengesDone,
  challengesCount,
  challengesLoading,
}) => {
  const statValues = {
    points: achLoading ? "—" : (achievements?.total_points ?? 0).toLocaleString(),
    badges: badgesLoading
      ? "—"
      : (
          <>
            <span className={styles.statAccent}>{badgesEarned}</span>
            <span className={styles.statDenom}>/{badgesCount}</span>
          </>
        ),
    challenges: challengesLoading
      ? "—"
      : (
          <>
            <span className={styles.statAccent}>{challengesDone}</span>
            <span className={styles.statDenom}>/{challengesCount}</span>
          </>
        ),
  };

  return (
    <div className={styles.statsRow}>
      {STATS.map((stat) => {
        const Icon = stat.icon;

        return (
          <div key={stat.key} className={styles.statCard}>
            <div className={styles.statIconWrap} style={stat.iconWrapStyle}>
              <Icon style={stat.iconStyle} />
            </div>
            <div className={styles.statValue}>{statValues[stat.key]}</div>
            <div className={styles.statLabel}>{stat.label}</div>
          </div>
        );
      })}
    </div>
  );
};

export default ProgressStats;
