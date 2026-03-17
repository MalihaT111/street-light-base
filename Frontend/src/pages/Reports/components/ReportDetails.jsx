import { FaMapMarkerAlt, FaExclamationTriangle, FaClock } from 'react-icons/fa';
import styles from './css/ReportDetails.module.css';

const DAMAGE_TYPES = [
  'Cracked base',
  'Missing cover',
  'Corrosion / rust',
  'Graffiti',
  'Physical impact damage',
  'Leaning / unstable',
];

const ReportDetails = ({
  damageTypes,
  onDamageTypesChange,
  locationStatus,
  location,
  locationError,
  photoTimestamp,
  submitError,
  submitting,
  isFormValid,
}) => {
  const toggleDamageType = (type) => {
    if (damageTypes.includes(type)) {
      onDamageTypesChange(damageTypes.filter((t) => t !== type));
    } else {
      onDamageTypesChange([...damageTypes, type]);
    }
  };

  const formattedTimestamp = photoTimestamp
    ? new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }).format(photoTimestamp instanceof Date ? photoTimestamp : new Date(photoTimestamp))
    : null;

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <span className={styles.cardTitle}>Details</span>
      </div>
      <div className={styles.cardBody}>
        <div className={styles.field}>
          <label className={styles.label}>Damage Type</label>
          <div className={styles.checkboxGroup}>
            {DAMAGE_TYPES.map((type) => (
              <label key={type} className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  className={styles.checkbox}
                  checked={damageTypes.includes(type)}
                  onChange={() => toggleDamageType(type)}
                />
                <span className={styles.checkboxText}>{type}</span>
              </label>
            ))}
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>
            <FaClock className={styles.locationIcon} /> Photo Timestamp
          </label>
          <div className={styles.locationRow}>
            <div
              className={`${styles.locationDot} ${
                formattedTimestamp
                  ? styles.locationDotActive
                  : styles.locationDotPending
              }`}
            />
            <span className={styles.locationText}>
              {formattedTimestamp
                ? `Captured · ${formattedTimestamp}`
                : 'Waiting for photo…'}
            </span>
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>
            <FaMapMarkerAlt className={styles.locationIcon} /> Your Location
          </label>
          <div className={styles.locationRow}>
            <div
              className={`${styles.locationDot} ${
                locationStatus === 'active'
                  ? styles.locationDotActive
                  : locationStatus === 'error'
                  ? styles.locationDotError
                  : styles.locationDotPending
              }`}
            />
            <span className={styles.locationText}>
              {locationStatus === 'loading' && 'Detecting location…'}
              {locationStatus === 'active' &&
                `GPS active · ${location.lat}° N, ${location.lng}° W`}
              {locationStatus === 'error' && locationError}
            </span>
          </div>
        </div>

        {submitError && (
          <div className={styles.errorMessage}>
            <FaExclamationTriangle className={styles.errorIcon} />
            {submitError}
          </div>
        )}

        <button
          type="submit"
          className={styles.submitBtn}
          disabled={!isFormValid || submitting}
        >
          {submitting ? 'Submitting…' : 'Submit Report →'}
        </button>
      </div>
    </div>
  );
};

export default ReportDetails;