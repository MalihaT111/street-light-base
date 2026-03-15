import { useRef } from 'react';
import { FaCamera } from 'react-icons/fa';
import styles from './css/PhotoEvidence.module.css';

const PhotoEvidence = ({ photoPreview, onChange, onRetake, onMetadata }) => {
  const fileInputRef = useRef(null);

const handleChange = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  // Convert HEIC to JPEG if needed
  let processedFile = file;
  if (file.type === 'image/heic' || file.type === 'image/heif' || file.name.toLowerCase().endsWith('.heic')) {
    try {
      const heic2any = (await import('heic2any')).default;
      const jpegBlob = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.9 });
      processedFile = new File([jpegBlob], file.name.replace(/\.heic$/i, '.jpg'), { type: 'image/jpeg' });
    } catch (err) {
      console.warn('HEIC conversion failed:', err);
      // Fall back to original file
    }
  }

  const reader = new FileReader();
  reader.onload = (readerEvent) => {
    const previewUrl = readerEvent.target.result;
    onChange(processedFile, previewUrl);
    parseExif(file); // Use original file for EXIF — heic2any strips metadata
  };
  reader.readAsDataURL(processedFile);
};

  const parseExif = async (file) => {
    try {
      const exifr = (await import("exifr")).default;
      const exif = await exifr.parse(file, {
        pick: ["GPSLatitude", "GPSLongitude", "GPSLatitudeRef", "GPSLongitudeRef", "DateTimeOriginal", "CreateDate"],
      });

      if (exif && onMetadata) {
        const toDecimal = (val) => {
          if (val == null) return null;
          if (typeof val === "number") return val;
          if (Array.isArray(val) && val.length === 3) return val[0] + val[1] / 60 + val[2] / 3600;
          return null;
        };

        const rawLat = toDecimal(exif.GPSLatitude);
        const rawLng = toDecimal(exif.GPSLongitude);

        onMetadata({
          lat: rawLat != null ? (exif.GPSLatitudeRef === "S" ? -rawLat : rawLat).toFixed(6) : null,
          lng: rawLng != null ? (exif.GPSLongitudeRef === "W" ? -rawLng : rawLng).toFixed(6) : null,
          timestamp: exif.DateTimeOriginal || exif.CreateDate || null,
        });
      }
    } catch (err) {
      console.warn("Could not read EXIF data:", err);
    }
  };

  const handleRetake = () => {
    if (fileInputRef.current) fileInputRef.current.value = "";
    onRetake();
  };

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
        <input
          ref={fileInputRef}
          id="camera-input"
          type="file"
          accept="image/*"
          onChange={handleChange}
          className={styles.hiddenInput}
        />
        {photoPreview ? (
          <div className={styles.previewWrapper}>
            <img src={photoPreview} alt="Captured" className={styles.preview} />
            <button type="button" className={styles.retakeBtn} onClick={handleRetake}>
              Retake Photo
            </button>
          </div>
        ) : (
          <label htmlFor="camera-input" className={styles.dropZone}>
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
        )}
      </div>
    </div>
  );
};

export default PhotoEvidence;