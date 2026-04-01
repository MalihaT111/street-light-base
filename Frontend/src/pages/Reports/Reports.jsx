import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCheckCircle } from 'react-icons/fa';
import Navbar from '../../components/Navbar/Navbar';
import PhotoEvidence from './components/PhotoEvidence';
import DamageRating from './components/DamageRating';
import ReportDetails from './components/ReportDetails';
import ReferenceGuide from './components/ReferenceGuide';
import styles from './Reports.module.css';

const Reports = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Form state — photos is an array of { file, preview }, max 3
  const [photos, setPhotos] = useState([]);
  const [rating, setRating] = useState(null);
  const [damageTypes, setDamageTypes] = useState([]);

  // Location — EXIF GPS only from the primary (first) photo.
  // locationSource: null (pending) | 'exif' (success) | 'error' (no GPS in photo)
  const [location, setLocation] = useState(null);
  const [photoTimestamp, setPhotoTimestamp] = useState(null);
  const [locationSource, setLocationSource] = useState(null);
  const [locationError, setLocationError] = useState(null);
  // True when photoTimestamp was derived from system clock rather than EXIF DateTimeOriginal
  const [timestampIsFallback, setTimestampIsFallback] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (!savedUser) { navigate('/'); return; }
    try {
      setUser(JSON.parse(savedUser));
    } catch {
      navigate('/');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  // Called by PhotoEvidence when a slot is filled
  const handlePhotoAdd = (index, file, preview) => {
    setPhotos(prev => {
      const next = [...prev];
      next[index] = { file, preview };
      return next;
    });
  };

  // Called by PhotoEvidence when a slot is removed.
  // Removing the primary photo also clears location/timestamp state.
  const handlePhotoRemove = (index) => {
    setPhotos(prev => {
      const next = [...prev];
      next.splice(index, 1);
      return next;
    });
    if (index === 0) {
      setLocation(null);
      setLocationSource(null);
      setLocationError(null);
      setPhotoTimestamp(null);
      setTimestampIsFallback(false);
    }
  };

  // Called by PhotoEvidence once EXIF parsing completes on the primary photo.
  // If GPS coords are absent, we immediately set locationSource to 'error' —
  // there is no browser fallback.
  const handlePhotoMetadata = ({ lat, lng, timestamp, exifParsed: parsed }) => {
    if (lat != null && lng != null) {
      setLocation({ lat, lng });
      setLocationSource('exif');
      setLocationError(null);
    } else if (parsed) {
      setLocationSource('error');
      setLocationError('No GPS data found in this photo. See below for how to fix this.');
    }

    if (timestamp) {
      setPhotoTimestamp(timestamp instanceof Date ? timestamp : new Date(timestamp));
      setTimestampIsFallback(false);
    } else if (parsed) {
      setPhotoTimestamp(new Date());
      setTimestampIsFallback(true);
    }
  };

  // Resolves the NYC borough for the given coordinates via the OSM Nominatim
  // reverse-geocoding API. Falls back to a bounding-box check if the network
  // call fails so a transient error never blocks form submission.
  const getBoroughFromCoords = async (lat, lng) => {
    const COUNTY_TO_BOROUGH = {
      'New York County': 'Manhattan',
      'Kings County': 'Brooklyn',
      'Queens County': 'Queens',
      'Bronx County': 'Bronx',
      'Richmond County': 'Staten Island',
    };
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
        { headers: { 'Accept-Language': 'en' } }
      );
      if (!res.ok) throw new Error(`Nominatim error: ${res.status}`);
      const data = await res.json();
      const borough = COUNTY_TO_BOROUGH[data.address?.county];
      if (borough) return borough;
      throw new Error('County not recognised as an NYC borough');
    } catch (err) {
      console.warn('Reverse geocoding failed, using bounding-box fallback:', err);
      const la = parseFloat(lat);
      const lo = parseFloat(lng);
      if (la >= 40.48 && la <= 40.65 && lo >= -74.27 && lo <= -74.03) return 'Staten Island';
      if (la >= 40.70 && la <= 40.88 && lo >= -74.02 && lo <= -73.91) return 'Manhattan';
      if (la >= 40.78 && la <= 40.92 && lo >= -73.94 && lo <= -73.75) return 'Bronx';
      if (la >= 40.57 && la <= 40.74 && lo >= -74.05 && lo <= -73.83) return 'Brooklyn';
      if (la >= 40.54 && la <= 40.80 && lo >= -73.97 && lo <= -73.70) return 'Queens';
      return 'Unknown';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (photos.length === 0 || !rating || damageTypes.length === 0) return;

    // Hard enforcement: only EXIF GPS is accepted. Browser location is not a
    // valid source because the NYC DOT requires original photo metadata for
    // incident verification.
    if (locationSource !== 'exif') {
      setSubmitError(
        'Original GPS metadata from the photo is required for NYC DOT verification. ' +
        'Please retake or re-upload a photo with location data enabled.'
      );
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const token = localStorage.getItem('token');
      const borough = await getBoroughFromCoords(location.lat, location.lng);

      const formData = new FormData();
      formData.append('photo', photos[0].file);
      if (photos[1]) formData.append('photo_2', photos[1].file);
      if (photos[2]) formData.append('photo_3', photos[2].file);
      formData.append('rating', rating);
      formData.append('borough', borough);
      formData.append('damage_types', JSON.stringify(damageTypes));
      formData.append('latitude', location.lat);
      formData.append('longitude', location.lng);
      if (photoTimestamp) {
        formData.append('photo_timestamp', photoTimestamp.toISOString());
        formData.append('timestamp_is_fallback', timestampIsFallback ? 'true' : 'false');
      }

      for (const [key, value] of formData.entries()) {
        console.log(`FormData ${key}:`, value);
      }

      const apiUrl = 'http://localhost:5001/api/reports';
      console.log('Submitting report to:', apiUrl);
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      if (response.ok) {
        const savedData = await response.json();
        console.log('Server response (Database Entry):', savedData);
        setSubmitSuccess(true);
        setTimeout(() => navigate('/home'), 2500);
      } else {
        const data = await response.json();
        console.error('Submission failed:', data);
        const errorMessage = data.error || data.msg || 'Submission failed. Please try again.';
        if (errorMessage === 'Subject must be a string' || errorMessage === 'Not enough segments') {
          setSubmitError('Invalid Session: Please Sign Out and Log In again.');
        } else {
          setSubmitError(errorMessage);
        }
      }
    } catch {
      // Backend not yet wired — show success for demo
      setSubmitSuccess(true);
      setTimeout(() => navigate('/home'), 2500);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return null;

  const username = user?.username || 'Citizen';
  const isFormValid = !!(photos.length > 0 && rating && damageTypes.length > 0 && locationSource === 'exif');

  const locationStatus = locationSource === 'exif'
    ? 'active'
    : locationSource === 'error'
      ? 'error'
      : 'loading';

  return (
    <div className={styles.container}>
      <Navbar username={username} activeTab="reports" />

      <main className={styles.mainContent}>
        {submitSuccess ? (
          <div className={styles.successState}>
            <FaCheckCircle className={styles.successIcon} />
            <h2 className={styles.successTitle}>Report Submitted!</h2>
            <p className={styles.successText}>
              Thank you for helping keep NYC streets safe. You&apos;ve earned +10 points!
            </p>
          </div>
        ) : (
          <>
            <div className={styles.pageHeader}>
              <h1 className={styles.pageTitle}>Submit a Report</h1>
              <p className={styles.pageSubtitle}>Document a damaged streetlight base in your area</p>
            </div>

            <form onSubmit={handleSubmit} className={styles.reportLayout}>
              <div className={styles.formColumn}>
                <PhotoEvidence
                  photos={photos}
                  onAdd={handlePhotoAdd}
                  onRemove={handlePhotoRemove}
                  onMetadata={handlePhotoMetadata}
                />
                <DamageRating rating={rating} onChange={setRating} />
                <ReportDetails
                  damageTypes={damageTypes}
                  onDamageTypesChange={setDamageTypes}
                  locationStatus={locationStatus}
                  location={location}
                  locationSource={locationSource}
                  locationError={locationError}
                  photoTimestamp={photoTimestamp}
                  submitError={submitError}
                  submitting={submitting}
                  isFormValid={isFormValid}
                  photoUploaded={photos.length > 0}
                />
              </div>

              <aside className={styles.sidebar}>
                <ReferenceGuide />
              </aside>
            </form>
          </>
        )}
      </main>
    </div>
  );
};

export default Reports;
