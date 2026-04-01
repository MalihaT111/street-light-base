import { useState } from 'react';
import styles from './ReportCard.module.css';
import { FaCamera } from 'react-icons/fa';

// { report, onEdit, onDelete }
function ReportCard({ report, onEdit, onDelete }) {
  const [imgError, setImgError] = useState(false);

  return (
    <div className={styles.reportCard}>
      <div className={styles.reportCardThumb}>
        {report.photo_url && !imgError ? (
          <img
            src={report.photo_url}
            alt="Report photo"
            className={styles.thumbImg}
            onError={() => setImgError(true)}
          />
        ) : (
          <span className={styles.thumbIcon}>
            <FaCamera />
          </span>
        )}
        <span className={styles.ratingPill}>{report.rating}</span>
      </div>
      {/* Content section */}
      <div className={styles.reportCardContent}>
        {/* Address */}
        <div className={styles.reportCardAddress}>{report.address}</div>
        {/* Date */}
        <div className ={styles.reportCardDate}>{report.date}</div>
        {report.damageTags && report.damageTags.length > 0 && (
          <div className={styles.dmgTagRow}>
            {report.damageTags.map(tag => (
              <span key={tag} className={styles.dmgTag}>{tag}</span>
            ))}
          </div>
        )}
        <div className={styles.reportCardFooter}>
          <div className={styles.btnWrapper}>
            <button className={styles.btn} onClick={() => onEdit(report)}>Edit</button>
            <button className={`${styles.btn} ${styles.delete}`} onClick={() => onDelete(report.id)}>Delete</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReportCard;