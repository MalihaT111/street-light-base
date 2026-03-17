import styles from './css/DamageRating.module.css';

const RATING_CONFIG = [
  { value: 'good', label: 'GOOD', desc: 'Minor wear, no damage' },
  { value: 'fair', label: 'FAIR', desc: 'Visible damage, functional' },
  { value: 'poor', label: 'POOR', desc: 'Severe damage or missing' },
];

const activeClass = {
  good: styles.cardGoodActive,
  fair: styles.cardFairActive,
  poor: styles.cardPoorActive,
};

const DamageRating = ({ rating, onChange }) => (
  <div className={styles.card}>
    <div className={styles.cardHeader}>
      <span className={styles.cardTitle}>Damage Rating</span>
      <span className={styles.requiredTag}>Required</span>
    </div>
    <div className={styles.cardBody}>
      <p className={styles.hint}>Select the condition that best matches what you see</p>
      <div className={styles.ratingGrid}>
        {RATING_CONFIG.map(({ value, label, desc }) => (
          <button
            key={value}
            type="button"
            className={`${styles.ratingCard} ${rating === value ? activeClass[value] : ''}`}
            onClick={() => onChange(value)}
          >
            <span className={styles.ratingLabel}>{label}</span>
            <span className={styles.ratingDesc}>{desc}</span>
          </button>
        ))}
      </div>
    </div>
  </div>
);

export default DamageRating;
