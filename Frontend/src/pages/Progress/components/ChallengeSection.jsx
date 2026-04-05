import ChallengeCard from "../../../components/ChallengeCard/ChallengeCard";

const CHALLENGE_TABS = ["daily", "weekly", "special"];

const ChallengeSection = ({
  styles,
  challengeGroups,
  activeChallenge,
  setActiveChallenge,
  challengesLoading,
  challengesError,
}) => {
  const activeChallenges = challengeGroups[activeChallenge] ?? [];

  return (
    <section className={styles.section}>
      <div className={styles.sectionLabel}>CHALLENGES</div>

      {challengesLoading && (
        <div className={styles.skeletonGrid} style={{ gridTemplateColumns: "repeat(auto-fit, minmax(300px, 380px))" }}>
          {[1, 2, 3].map((n) => (
            <div key={n} className={`${styles.skeleton} ${styles.skeletonCard}`} style={{ height: 130 }} />
          ))}
        </div>
      )}
      {challengesError && <p className={styles.errorMsg}>{challengesError}</p>}

      {!challengesLoading && !challengesError && (
        <>
          <div className={styles.challengeTabs}>
            {CHALLENGE_TABS.map((type) => {
              const challenges = challengeGroups[type] ?? [];
              const completed = challenges.filter((challenge) => challenge.completed).length;
              const isActive = activeChallenge === type;

              return (
                <button
                  type="button"
                  key={type}
                  className={`${styles.challengeTab} ${isActive ? styles.challengeTabActive : ""}`}
                  onClick={() => setActiveChallenge(type)}
                  aria-pressed={isActive}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                  <span className={styles.challengeTabBadge}>
                    {completed}/{challenges.length}
                  </span>
                </button>
              );
            })}
          </div>

          {activeChallenges.length > 0 ? (
            <div className={styles.challengeGrid}>
              {activeChallenges.map((challenge) => (
                <ChallengeCard key={challenge.key} challenge={challenge} />
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>No {activeChallenge} challenges available</div>
          )}
        </>
      )}
    </section>
  );
};

export default ChallengeSection;
