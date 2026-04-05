import { Fragment } from "react";

const TierSection = ({ styles, achievements, achLoading, achError, meta, progressPct, tierMeta }) => {
  const progress = achievements?.progress_to_next;

  return (
    <section className={styles.section}>
      <div className={styles.sectionLabel}>YOUR TIER</div>

      {achLoading && (
        <>
          <div className={`${styles.skeleton} ${styles.skeletonBanner}`} />
          <div className={`${styles.skeleton} ${styles.skeletonTrack}`} style={{ marginTop: "1px" }} />
        </>
      )}
      {achError && <p className={styles.errorMsg}>{achError}</p>}

      {!achLoading && !achError && achievements && (
        <div className={styles.tierCard} style={{ borderColor: meta?.color }}>
          <div className={styles.tierCardTop} style={{ background: meta?.bg }}>
            <div className={styles.tierBannerLeft}>
              {meta && (
                <div className={styles.tierIconCircle} style={{ background: "white", borderColor: meta.color }}>
                  <meta.icon style={{ color: meta.color, fontSize: "1.4rem" }} />
                </div>
              )}
              <div>
                <div className={styles.tierBannerName} style={{ color: meta?.color }}>
                  {achievements.current_tier}
                </div>
                <div className={styles.tierBannerPoints}>
                  {achievements.total_points.toLocaleString()} pts total
                </div>
              </div>
            </div>

            {progress ? (
              <div className={styles.tierBannerRight}>
                <div className={styles.tierProgressLabel}>
                  {progress.points_earned.toLocaleString()} / {progress.points_needed.toLocaleString()} pts to {progress.next_tier}
                </div>
                <div className={styles.tierProgressTrack}>
                  <div
                    className={styles.tierProgressFill}
                    style={{ width: `${progressPct}%`, background: meta?.color }}
                  />
                </div>
                <div className={styles.tierProgressRemaining}>
                  {progress.points_remaining.toLocaleString()} pts remaining
                </div>
              </div>
            ) : (
              <div className={styles.tierMaxed} style={{ color: meta?.color }}>
                Max tier reached!
              </div>
            )}
          </div>

          <div className={styles.tierCardBottom}>
            <div className={styles.tierTrack}>
              {achievements.tiers.map((tier, index) => {
                const tierStyle = tierMeta[tier.key];
                const Icon = tierStyle?.icon;
                const isCurrent = tier.name === achievements.current_tier;

                return (
                  <Fragment key={tier.key}>
                    <div className={styles.tierStep}>
                      <div
                        className={styles.tierStepIcon}
                        style={tier.reached ? { background: tierStyle?.bg, borderColor: tierStyle?.color } : {}}
                      >
                        {Icon && <Icon style={{ color: tier.reached ? tierStyle?.color : "#D1D5DB" }} />}
                        {isCurrent && <span className={styles.currentDot} style={{ background: tierStyle?.color }} />}
                      </div>
                      <div className={styles.tierStepName} style={{ color: tier.reached ? tierStyle?.color : "#9CA3AF" }}>
                        {tier.name}
                      </div>
                      <div className={styles.tierStepPts}>
                        {tier.min_points.toLocaleString()} pts
                      </div>
                    </div>

                    {index < achievements.tiers.length - 1 && (
                      <div
                        className={`${styles.tierConnector} ${achievements.tiers[index + 1].reached ? styles.tierConnectorFilled : ""}`}
                      />
                    )}
                  </Fragment>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default TierSection;
