import { FaLock, FaMedal } from "react-icons/fa";

const BadgeSection = ({ styles, badges, badgesLoading, badgesError, badgeIconMap }) => (
  <section className={styles.section}>
    <div className={styles.sectionLabel}>BADGES</div>

    {badgesLoading && (
      <div className={styles.skeletonGrid}>
        {[1, 2, 3, 4].map((n) => (
          <div key={n} className={`${styles.skeleton} ${styles.skeletonCard}`} />
        ))}
      </div>
    )}
    {badgesError && <p className={styles.errorMsg}>{badgesError}</p>}

    {!badgesLoading && !badgesError && (
      <div className={styles.badgeGrid}>
        {badges.map((badge) => {
          const Icon = badgeIconMap[badge.key] ?? FaMedal;

          return (
            <div
              key={badge.key}
              className={`${styles.badgeCard} ${badge.earned ? styles.badgeEarned : styles.badgeLocked}`}
            >
              <div className={styles.badgeIconWrap}>
                {badge.earned ? <Icon className={styles.badgeIcon} /> : <FaLock className={styles.badgeIconLocked} />}
              </div>
              <div className={styles.badgeContent}>
                <div className={styles.badgeName}>{badge.name}</div>
                <div className={styles.badgeDesc}>{badge.description}</div>
                {badge.earned && badge.earned_at && (
                  <div className={styles.badgeDate}>
                    Earned {new Date(badge.earned_at).toLocaleDateString()}
                  </div>
                )}
                {!badge.earned && (
                  <div className={styles.badgeNotEarned}>Not yet earned</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    )}
  </section>
);

export default BadgeSection;
