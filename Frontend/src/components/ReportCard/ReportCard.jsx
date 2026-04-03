import { useState, useEffect } from 'react';
import styles from './ReportCard.module.css';
import { FaCamera, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import ImageLightbox from '../ImageLightbox/ImageLightbox';

function ReportCard({ report, onEdit, onDelete }) {

  // To make it usable in both AllReports and ManageReports, we check if onEdit or onDelete are provided.
  const showActions = onEdit && onDelete;

  const [imgIndex, setImgIndex] = useState(0);
  const [imgError, setImgError] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(null);

  // Build the photos array — prefer photo_urls if available, fall back to photo_url
  const photos = report.photo_urls && report.photo_urls.length > 0
    ? report.photo_urls
    : report.photo_url
      ? [report.photo_url]
      : [];

  const hasMultiple = photos.length > 1;
  const currentPhoto = photos[imgIndex] ?? null;

  useEffect(() => {
    setImgError(false);
    setImgIndex(0);
  }, [report.id]);

  const prev = (e) => {
    e.stopPropagation();
    setImgIndex(i => (i - 1 + photos.length) % photos.length);
    setImgError(false);
  };

  const next = (e) => {
    e.stopPropagation();
    setImgIndex(i => (i + 1) % photos.length);
    setImgError(false);
  };

  return (
    <div className={styles.reportCard}>
      <div className={styles.reportCardThumb}>
        {currentPhoto && !imgError ? (
          <img
            src={currentPhoto}
            alt="Report photo"
            className={styles.thumbImg}
            onError={() => setImgError(true)}
            onClick={() => setLightboxIndex(imgIndex)}
          />
        ) : (
          <span className={styles.thumbIcon}>
            <FaCamera />
          </span>
        )}
        <span className={styles.ratingPill}>{report.rating}</span>

        {hasMultiple && (
          <>
            <button className={`${styles.arrowBtn} ${styles.arrowLeft}`} onClick={prev} aria-label="Previous photo">
              <FaChevronLeft />
            </button>
            <button className={`${styles.arrowBtn} ${styles.arrowRight}`} onClick={next} aria-label="Next photo">
              <FaChevronRight />
            </button>
            <span className={styles.photoCount}>{imgIndex + 1} / {photos.length}</span>
          </>
        )}
      </div>

      {lightboxIndex !== null && photos.length > 0 && (
        <ImageLightbox
          photos={photos}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onPrev={() => setLightboxIndex(i => (i - 1 + photos.length) % photos.length)}
          onNext={() => setLightboxIndex(i => (i + 1) % photos.length)}
        />
      )}

      {/* Content section */}
      <div className={styles.reportCardContent}>
        <div className={styles.reportCardAddress}>{report.address}</div>
        <div className={styles.reportCardDate}>{report.date}</div>
        {report.damageTags && report.damageTags.length > 0 && (
          <div className={styles.dmgTagRow}>
            {report.damageTags.map(tag => (
              <span key={tag} className={styles.dmgTag}>{tag}</span>
            ))}
          </div>
        )}
        <div className={styles.reportCardFooter}>
          {showActions && (
            <div className={styles.btnWrapper}>
              <button className={styles.btn} onClick={() => onEdit(report)}>Edit</button>
              <button className={`${styles.btn} ${styles.delete}`} onClick={() => onDelete(report.id)}>Delete</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ReportCard;
