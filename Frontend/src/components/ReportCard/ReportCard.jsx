import styles from './ReportCard.module.css';
import { FaCamera } from 'react-icons/fa';

// { report, onEdit, onDelete }
function ReportCard() {
  return (
    <div className={styles.reportCard}>
      <div className={styles.reportCardThumb}>
        <span className = {styles.thumbIcon}>
          <FaCamera />
        </span>
        <span className={styles.ratingPill}>Poor</span>
          
      </div>
      {/* Content section */}
      <div className={styles.reportCardContent}>
        {/* Address */}
        <div className={styles.reportCardAddress}>Address</div>
        {/* Date */}
        <div className ={styles.reportCardDate}>Date</div>
        <div className = {styles.reportCardFooter}>
          <span className ={styles.dmgTag}>Impact damage</span>
          <div className = {styles.btnWrapper}>
            <button className = {styles.btn}>Edit</button>
            <button className = {styles.btn}>Delete</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReportCard;