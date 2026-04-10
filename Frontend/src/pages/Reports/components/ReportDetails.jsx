import { useState } from 'react';
import { FaMapMarkerAlt, FaExclamationTriangle, FaClock, FaTimes, FaQuestionCircle } from 'react-icons/fa';
import styles from './css/ReportDetails.module.css';

const DAMAGE_TYPES = [
  'Cracked base',
  'Missing cover',
  'Corrosion / rust',
  'Graffiti',
  'Physical impact damage',
  'Leaning / unstable',
];

const LocationHelpModal = ({ onClose }) => (
  <div className={styles.modalOverlay} role="dialog" aria-modal="true" aria-labelledby="helpModalTitle">
    <div className={styles.modalPanel}>
      <div className={styles.modalHeader}>
        <h2 id="helpModalTitle" className={styles.modalTitle}>Why is my location missing?</h2>
        <button className={styles.modalClose} onClick={onClose} aria-label="Close help">
          <FaTimes />
        </button>
      </div>

      <div className={styles.modalBody}>
        <p className={styles.modalIntro}>
          The NYC DOT requires GPS coordinates embedded directly in your photo file to verify
          the exact incident location. Here&apos;s how to make sure location is saved when you
          take photos.
        </p>

        <div className={styles.helpSection}>
          <h3 className={styles.helpPlatform}>iPhone / iPad (iOS)</h3>
          <ol className={styles.helpSteps}>
            <li>Open <strong>Settings</strong></li>
            <li>Tap <strong>Privacy &amp; Security</strong> → <strong>Location Services</strong></li>
            <li>Scroll to <strong>Camera</strong> and tap it</li>
            <li>Select <strong>&quot;While Using the App&quot;</strong></li>
            <li>Back on the Camera screen, also enable <strong>Precise Location</strong></li>
          </ol>
        </div>

        <div className={styles.helpSection}>
          <h3 className={styles.helpPlatform}>Android</h3>
          <ol className={styles.helpSteps}>
            <li>Open your <strong>Camera</strong> app</li>
            <li>Tap the <strong>Settings</strong> icon (gear ⚙)</li>
            <li>Enable <strong>&quot;Save Location&quot;</strong> or <strong>&quot;Location Tags&quot;</strong></li>
            <li>If the option is missing, check <strong>Phone Settings</strong> → <strong>Apps</strong> → <strong>Camera</strong> → <strong>Permissions</strong> → grant <strong>Location</strong></li>
          </ol>
        </div>

        <div className={styles.helpNote}>
          <FaExclamationTriangle className={styles.helpNoteIcon} />
          <p>
            <strong>Screenshots and forwarded images won&apos;t work.</strong> Photos sent
            through WhatsApp, iMessage, or other messaging apps have their GPS data stripped
            during transfer. Always upload the original photo directly from your camera roll.
          </p>
        </div>
      </div>
    </div>
  </div>
);

const ReportDetails = ({
  damageTypes,
  onDamageTypesChange,
  locationStatus,
  location,
  locationSource,
  locationError,
  photoTimestamp,
  submitError,
  submitting,
  isFormValid,
  photoUploaded,
}) => {
  const [showHelp, setShowHelp] = useState(false);

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

  // Show the help trigger only when a file was uploaded without GPS metadata
  const showHelpTrigger = photoUploaded && locationSource !== 'exif' && locationSource !== 'browser';

  return (
    <>
      {showHelp && <LocationHelpModal onClose={() => setShowHelp(false)} />}

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
                {locationStatus === 'loading' && (photoUploaded ? 'Reading photo metadata…' : 'Waiting for photo…')}
                {locationStatus === 'active' &&
                  `GPS active · ${location.lat}° N, ${location.lng}° W`}
                {locationStatus === 'error' && locationError}
              </span>
            </div>

            {showHelpTrigger && (
              <button
                type="button"
                className={styles.helpTrigger}
                onClick={() => setShowHelp(true)}
              >
                <FaQuestionCircle className={styles.helpTriggerIcon} />
                Why is my location missing?
              </button>
            )}
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
    </>
  );
};

export default ReportDetails;
