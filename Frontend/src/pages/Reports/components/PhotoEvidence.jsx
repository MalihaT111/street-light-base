import { useRef } from 'react';
import { FaCamera, FaPlus, FaTimes } from 'react-icons/fa';
import styles from './css/PhotoEvidence.module.css';

const MAX_PHOTOS = 3;

// photos: [{file, preview}, ...]
// onAdd(index, file, preview) — called when a slot is filled
// onRemove(index) — called when a slot is cleared
// onMetadata — only fired for index 0 (primary photo)
const PhotoEvidence = ({ photos, onAdd, onRemove, onMetadata }) => {
  const fileInput0 = useRef(null);
  const fileInput1 = useRef(null);
  const fileInput2 = useRef(null);
  const fileInputRefs = [fileInput0, fileInput1, fileInput2];

  const handleChange = async (e, index) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = '';

    let processedFile = file;
    if (file.type === 'image/heic' || file.type === 'image/heif' || file.name.toLowerCase().endsWith('.heic')) {
      try {
        const heic2any = (await import('heic2any')).default;
        const jpegBlob = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.9 });
        processedFile = new File([jpegBlob], file.name.replace(/\.heic$/i, '.jpg'), { type: 'image/jpeg' });
      } catch (err) {
        console.warn('HEIC conversion failed:', err);
      }
    }

    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      onAdd(index, processedFile, readerEvent.target.result);
      if (index === 0) parseExif(file);
    };
    reader.readAsDataURL(processedFile);
  };

  const parseExif = async (file) => {
    try {
      const exifr = (await import('exifr')).default;
      const exif = await exifr.parse(file, {
        pick: ['GPSLatitude', 'GPSLongitude', 'GPSLatitudeRef', 'GPSLongitudeRef', 'DateTimeOriginal', 'CreateDate'],
      });

      if (onMetadata) {
        const dmsToDecimal = (val) => {
          if (val == null) return null;
          if (typeof val === 'number') return val;
          if (Array.isArray(val) && val.length === 3) return val[0] + val[1] / 60 + val[2] / 3600;
          return null;
        };

        const rawLat = exif ? dmsToDecimal(exif.GPSLatitude) : null;
        const rawLng = exif ? dmsToDecimal(exif.GPSLongitude) : null;

        onMetadata({
          lat: rawLat != null ? (exif.GPSLatitudeRef === 'S' ? -rawLat : rawLat).toFixed(6) : null,
          lng: rawLng != null ? (exif.GPSLongitudeRef === 'W' ? -rawLng : rawLng).toFixed(6) : null,
          timestamp: exif ? (exif.DateTimeOriginal || exif.CreateDate || null) : null,
          exifParsed: true,
        });
      }
    } catch (err) {
      console.warn('Could not read EXIF data:', err);
      if (onMetadata) onMetadata({ lat: null, lng: null, timestamp: null, exifParsed: true });
    }
  };

  const handleRemove = (index) => {
    if (fileInputRefs[index].current) fileInputRefs[index].current.value = '';
    onRemove(index);
  };

  // Build slot list: all filled photos + one empty slot if under max
  const slots = [...photos];
  if (slots.length < MAX_PHOTOS) slots.push(null);

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <span className={styles.cardTitle}>
          <FaCamera className={styles.cardTitleIcon} />
          Photo Evidence
        </span>
        <span className={styles.requiredTag}>Required</span>
      </div>
      <div className={styles.cardBody}>
        {/* Hidden file inputs — one per possible slot */}
        {[0, 1, 2].map(i => (
          <input
            key={i}
            ref={fileInputRefs[i]}
            id={`photo-input-${i}`}
            type="file"
            accept="image/*"
            onChange={(e) => handleChange(e, i)}
            className={styles.hiddenInput}
          />
        ))}

        {slots.map((photo, index) => {
          const isFirst = index === 0;
          return (
            <div key={index} className={isFirst ? styles.primarySlot : styles.additionalSlot}>
              {photo ? (
                <div className={styles.previewWrapper}>
                  <img src={photo.preview} alt={`Photo ${index + 1}`} className={styles.preview} />
                  <button
                    type="button"
                    className={styles.removeBtn}
                    onClick={() => handleRemove(index)}
                    aria-label="Remove photo"
                  >
                    <FaTimes />
                  </button>
                  {isFirst && <span className={styles.primaryBadge}>Primary</span>}
                </div>
              ) : isFirst ? (
                <label htmlFor="photo-input-0" className={styles.dropZone}>
                  <FaCamera className={styles.dropIcon} />
                  <p className={styles.dropPrompt}>Upload a photo through the app</p>
                  <p className={styles.dropHint}>
                    GPS and timestamp are read automatically from image metadata.
                  </p>
                  <div className={styles.dropNote}>
                    Make sure location is ON when you take the photo.
                  </div>
                  <span className={styles.openCameraBtn}>Upload Photo</span>
                </label>
              ) : (
                <label htmlFor={`photo-input-${index}`} className={styles.addSlot}>
                  <FaPlus className={styles.addIcon} />
                  <span className={styles.addLabel}>Add photo</span>
                  <span className={styles.addHint}>Optional</span>
                </label>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PhotoEvidence;
