import { useEffect, useCallback } from 'react';
import { FaTimes, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import styles from './ImageLightbox.module.css';

// photos: string[] of URLs/data-URLs
// index:  currently visible photo index (controlled by parent)
// onClose, onPrev, onNext — callbacks
function ImageLightbox({ photos, index, onClose, onPrev, onNext }) {
  const hasMultiple = photos.length > 1;

  const handleKey = useCallback((e) => {
    if (e.key === 'Escape') onClose();
    if (e.key === 'ArrowLeft' && hasMultiple) onPrev();
    if (e.key === 'ArrowRight' && hasMultiple) onNext();
  }, [onClose, onPrev, onNext, hasMultiple]);

  useEffect(() => {
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [handleKey]);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
        <FaTimes />
      </button>

      {hasMultiple && (
        <button
          className={`${styles.navBtn} ${styles.navLeft}`}
          onClick={(e) => { e.stopPropagation(); onPrev(); }}
          aria-label="Previous"
        >
          <FaChevronLeft />
        </button>
      )}

      <img
        src={photos[index]}
        alt={`Photo ${index + 1}`}
        className={styles.image}
        onClick={(e) => e.stopPropagation()}
      />

      {hasMultiple && (
        <button
          className={`${styles.navBtn} ${styles.navRight}`}
          onClick={(e) => { e.stopPropagation(); onNext(); }}
          aria-label="Next"
        >
          <FaChevronRight />
        </button>
      )}

      {hasMultiple && (
        <span className={styles.counter}>{index + 1} / {photos.length}</span>
      )}
    </div>
  );
}

export default ImageLightbox;
