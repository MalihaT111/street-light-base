import styles from './ReportCard.module.css';
import { FaCamera } from 'react-icons/fa';

// { report, onEdit, onDelete }
function ReportCard({ report, onEdit, onDelete }) {
  const showActions = onEdit && onDelete;
  return (
    <div className={styles.reportCard}>
      <div className={styles.reportCardThumb}>
        <span className = {styles.thumbIcon}>
          <FaCamera />
        </span>
        <span className={styles.ratingPill}>{report.rating}</span>
          
      </div>
      {/* Content section */}
      <div className={styles.reportCardContent}>
        {/* Address */}
        <div className={styles.reportCardAddress}>{report.address}</div>
        {/* Date */}
        <div className ={styles.reportCardDate}>{report.date}</div>
        <div className = {styles.reportCardFooter}>
          <span className ={styles.dmgTag}>{report.damageType}</span>
          {showActions && (
            <div className = {styles.btnWrapper}>
              <button className = {styles.btn} onClick={() => onEdit(report)}>Edit</button>
              <button className = {`${styles.btn} ${styles.delete}`} onClick={() => onDelete(report.id)}>Delete</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ReportCard;