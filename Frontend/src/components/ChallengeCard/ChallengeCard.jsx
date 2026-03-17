import styles from './ChallengeCard.module.css';
import { FaTrophy } from 'react-icons/fa';

const ChallengeCard = ({ challenge }) => {
    
    return (
        <div className={styles.challengeCard}>
           < FaTrophy className={styles.challengeIcon} />
           <div className= {styles["content-wrapper"]}>
                <span className={`${styles["challenge-type"]} ${styles[challenge.type.toLowerCase()]}`}>{challenge.type.toUpperCase()}</span>
                <div className={styles.challengeHeader}>
                    <h3>{challenge.title}</h3>
                </div>
                <div className={styles["challenge-description"]}>
                    {challenge.description}
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
        </div>
    );
};

export default ChallengeCard;