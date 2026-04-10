import { useRef, useState } from 'react';
import { FaCamera, FaPlus, FaTimes } from 'react-icons/fa';
import styles from './css/PhotoEvidence.module.css';
import ImageLightbox from '../../../components/ImageLightbox/ImageLightbox';
import CameraCapture from './CameraCapture';

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

  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [loadingSlots, setLoadingSlots] = useState(new Set());
  const [cameraSlot, setCameraSlot] = useState(null);
  const previewUrls = photos.map(p => p.preview);
  const closeLightbox = () => setLightboxIndex(null);

  const setSlotLoading = (index, isLoading) =>
    setLoadingSlots(prev => {
      const next = new Set(prev);
      isLoading ? next.add(index) : next.delete(index);
      return next;
    });

  const handleCameraCapture = (file, coords, index) => {
    setCameraSlot(null);
    setSlotLoading(index, true);

    const reader = new FileReader();
    reader.onload = (e) => {
      onAdd(index, file, e.target.result);
      setSlotLoading(index, false);
      if (index === 0 && onMetadata) {
        onMetadata({
          lat: coords?.lat ?? null,
          lng: coords?.lng ?? null,
          timestamp: new Date(),
          source: 'browser',
        });
      }
    };
    reader.readAsDataURL(file);
  };

  // Fallback: file upload (keeps EXIF GPS path working)
  const handleFileChange = async (e, index) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = '';
    setSlotLoading(index, true);

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
      setSlotLoading(index, false);
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
          source: 'exif',
        });
      }
    } catch (err) {
      console.warn('Could not read EXIF data:', err);
      if (onMetadata) onMetadata({ lat: null, lng: null, timestamp: null, source: 'exif' });
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
        {/* Hidden file inputs — fallback upload path */}
        {[0, 1, 2].map(i => (
          <input
            key={i}
            ref={fileInputRefs[i]}
            id={`photo-input-${i}`}
            type="file"
            accept="image/*"
            onChange={(e) => handleFileChange(e, i)}
            className={styles.hiddenInput}
          />
        ))}

        {slots.map((photo, index) => {
          const isFirst = index === 0;
          return (
            <div key={index} className={isFirst ? styles.primarySlot : styles.additionalSlot}>
              {loadingSlots.has(index) ? (
                <div className={isFirst ? styles.dropZone : styles.addSlot}>
                  <span className={styles.spinner} />
                  <span className={styles.loadingText}>Processing…</span>
                </div>
              ) : photo ? (
                <div className={styles.previewWrapper}>
                  <img
                    src={photo.preview}
                    alt={`Photo ${index + 1}`}
                    className={styles.preview}
                    onClick={() => setLightboxIndex(index)}
                  />
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
                <div className={styles.dropZone} onClick={() => setCameraSlot(0)}>
                  <FaCamera className={styles.dropIcon} />
                  <p className={styles.dropPrompt}>Take a Photo</p>
                  <p className={styles.dropHint}>
                    Your location will be captured automatically when you take the photo.
                  </p>
                  <span className={styles.openCameraBtn}>Open Camera</span>
                  <label
                    htmlFor="photo-input-0"
                    className={styles.uploadFallback}
                    onClick={e => e.stopPropagation()}
                  >
                    or upload a file instead
                  </label>
                </div>
              ) : (
                <div className={styles.addSlot} onClick={() => setCameraSlot(index)}>
                  <FaPlus className={styles.addIcon} />
                  <span className={styles.addLabel}>Add photo</span>
                  <span className={styles.addHint}>Optional</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {cameraSlot !== null && (
        <CameraCapture
          onCapture={(file, coords) => handleCameraCapture(file, coords, cameraSlot)}
          onClose={() => setCameraSlot(null)}
        />
      )}

      {lightboxIndex !== null && (
        <ImageLightbox
          photos={previewUrls}
          index={lightboxIndex}
          onClose={closeLightbox}
          onPrev={() => setLightboxIndex(i => (i - 1 + previewUrls.length) % previewUrls.length)}
          onNext={() => setLightboxIndex(i => (i + 1) % previewUrls.length)}
        />
      )}
    </div>
  );
};

export default PhotoEvidence;
