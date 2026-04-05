import styles from './ChallengeCard.module.css';
import { FaTrophy, FaCheckCircle } from 'react-icons/fa';

const ChallengeCard = ({ challenge }) => {
    const { type, title, description, progress, total, reward, completed } = challenge;
    const safeTotal = Math.max(total || 0, 1);
    const progressPercent = Math.min(100, Math.round(((progress || 0) / safeTotal) * 100));

    return (
        <div className={`${styles.challengeCard} ${completed ? styles.completed : ''}`}>
            <div className={styles.challengeIconWrap}>
                {completed
                    ? <FaCheckCircle className={styles.completedIcon} />
                    : <FaTrophy className={styles.challengeIcon} />
                }
            </div>
            <div className={styles["content-wrapper"]}>
                <span className={`${styles["challenge-type"]} ${styles[type.toLowerCase()]}`}>
                    {type.toUpperCase()}
                </span>
                <div className={styles.challengeHeader}>
                    <h3>{title}</h3>
                </div>
                <div className={styles["challenge-description"]}>
                    {description}
                </div>
                <div className={styles.progressBar}>
                    <div
                        className={styles.progressFill}
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>
                <div className={styles.progressMeta}>
                    <div className={styles.progressText}>
                        {completed
                            ? <span className={styles.completedLabel}>Completed</span>
                            : `${progress}/${total} completed`
                        }
                    </div>
                    <div className={styles.progressPercent}>{progressPercent}%</div>
                </div>
                <div className={styles.challengeFooter}>
                    <div className={styles.reward}>
                        Reward: <span className={styles.rewardPoints}>{reward} points</span>
                    </div>
                    {!completed && <div className={styles.challengeHint}>Keep going</div>}
                </div>
            </div>
        </div>
    );
};

export default ChallengeCard;
