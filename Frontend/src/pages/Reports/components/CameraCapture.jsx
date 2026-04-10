import { useRef, useEffect, useState } from 'react';
import { FaTimes, FaSyncAlt } from 'react-icons/fa';
import styles from './css/CameraCapture.module.css';

const CameraCapture = ({ onCapture, onClose }) => {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const facingModeRef = useRef('environment');
  const [error, setError] = useState(null);
  const [ready, setReady] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [facingMode, setFacingMode] = useState('environment');
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);

  useEffect(() => {
    facingModeRef.current = facingMode;
    let active = true;

    const start = async () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
      setReady(false);
      setError(null);

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: facingMode } },
          audio: false,
        });
        if (!active) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;

        const devices = await navigator.mediaDevices.enumerateDevices();
        const cams = devices.filter(d => d.kind === 'videoinput');
        if (active) setHasMultipleCameras(cams.length > 1);
      } catch {
        if (active) setError('Camera access was denied. Please allow camera access in your browser settings and try again.');
      }
    };

    start();
    return () => {
      active = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
    };
  }, [facingMode]);

  const capture = async () => {
    if (!videoRef.current || !ready || capturing) return;
    setCapturing(true);

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');

    // Mirror the captured image when using front camera
    if (facingModeRef.current === 'user') {
      ctx.scale(-1, 1);
      ctx.drawImage(video, -canvas.width, 0);
    } else {
      ctx.drawImage(video, 0, 0);
    }

    const locationPromise = new Promise(resolve => {
      if (!('geolocation' in navigator)) return resolve(null);
      navigator.geolocation.getCurrentPosition(
        pos => resolve({ lat: pos.coords.latitude.toFixed(6), lng: pos.coords.longitude.toFixed(6) }),
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 5000 }
      );
    });

    canvas.toBlob(async blob => {
      const file = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
      const coords = await locationPromise;
      onCapture(file, coords);
    }, 'image/jpeg', 0.92);
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <button className={styles.closeBtn} onClick={onClose} type="button" aria-label="Close camera">
          <FaTimes />
        </button>

        {error ? (
          <div className={styles.errorBox}>
            <p>{error}</p>
            <button type="button" onClick={onClose} className={styles.errorClose}>Go back</button>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`${styles.video} ${facingMode === 'user' ? styles.videoMirrored : ''}`}
              onCanPlay={() => setReady(true)}
            />
            <div className={styles.controls}>
              {hasMultipleCameras ? (
                <button
                  type="button"
                  className={styles.flipBtn}
                  onClick={() => setFacingMode(f => f === 'environment' ? 'user' : 'environment')}
                  aria-label="Flip camera"
                >
                  <FaSyncAlt />
                </button>
              ) : (
                <div className={styles.controlSpacer} />
              )}

              <button
                type="button"
                className={styles.shutterBtn}
                onClick={capture}
                disabled={!ready || capturing}
                aria-label="Take photo"
              >
                {capturing
                  ? <span className={styles.spinner} />
                  : <span className={styles.shutterInner} />
                }
              </button>

              <div className={styles.controlSpacer} />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CameraCapture;
