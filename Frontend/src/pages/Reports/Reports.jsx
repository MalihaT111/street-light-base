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

  // Form state
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [rating, setRating] = useState(null);
  const [damageTypes, setDamageTypes] = useState([]);

  // Location — prefer EXIF, fall back to browser geolocation
  const [location, setLocation] = useState(null);
  const [photoTimestamp, setPhotoTimestamp] = useState(null);
  const [locationSource, setLocationSource] = useState(null); // 'exif' | 'browser' | 'error'
  const [locationError, setLocationError] = useState(null);

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

  // Browser geolocation fallback — only kicks in if no EXIF location was found
  useEffect(() => {
    if (locationSource === 'exif') return;
    if (!navigator.geolocation) {
      setLocationSource('error');
      setLocationError('Geolocation is not supported by your browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (locationSource !== 'exif') {
          setLocation({
            lat: pos.coords.latitude.toFixed(6),
            lng: pos.coords.longitude.toFixed(6),
          });
          setLocationSource('browser');
        }
      },
      () => {
        if (locationSource !== 'exif') {
          setLocationSource('error');
          setLocationError('Unable to retrieve location. Please enable location access.');
        }
      }
    );
  }, [locationSource]);

  const handlePhotoChange = (file, previewUrl) => {
    setPhoto(file);
    setPhotoPreview(previewUrl);
  };

  // Called by PhotoEvidence once EXIF is parsed
  const handlePhotoMetadata = ({ lat, lng, timestamp }) => {
    if (lat != null && lng != null) {
      setLocation({ lat, lng });
      setLocationSource('exif');
      setLocationError(null);
    }
    if (timestamp) {
      setPhotoTimestamp(timestamp instanceof Date ? timestamp : new Date(timestamp));
    }
  };

  const handleRetakePhoto = () => {
    setPhoto(null);
    setPhotoPreview(null);
    setPhotoTimestamp(null);
    setLocation(null);
    setLocationSource(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!photo || !rating || damageTypes.length === 0) return;

    setSubmitting(true);
    setSubmitError(null);

    // The try block attempts to send the report to the backend API.
    try {
      // Retrieve the authentication token from local storage.
      const token = localStorage.getItem('token');
      // Create a FormData object to hold the report data.
      const formData = new FormData();
      formData.append('photo', photo);
      formData.append('rating', rating);
      formData.append('borough', 'Queens'); // Placeholder: Logic needed to determine borough from coordinates
      // Send as JSON array string so the backend can parse TEXT[]
      formData.append('damage_types', JSON.stringify(damageTypes));
      if (location) {
        formData.append('latitude', location.lat);
        formData.append('longitude', location.lng);
      }
      if (photoTimestamp) {
        formData.append('photo_timestamp', photoTimestamp.toISOString());
      }

      // Debugging: Log the FormData contents to verify what is being sent
      for (const [key, value] of formData.entries()) {
        console.log(`FormData ${key}:`, value);
      }

      const apiUrl = 'http://localhost:5001/api/reports';
      console.log('Submitting report to:', apiUrl);
      // Make a POST request to the reports API endpoint.
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      // If the submission is successful, update the UI to show a success message.
      if (response.ok) {
        // Debugging: Log the server response to verify the database entry and photo URL
        // This assumes your backend returns the created report object as JSON
        const savedData = await response.json();
        console.log('Server response (Database Entry):', savedData);
        setSubmitSuccess(true);
        // Redirect to the home page after a short delay.
        setTimeout(() => navigate('/home'), 2500);
      } else {
        // If submission fails, parse the error and display it.
        const data = await response.json();
        // Log the full error to console for debugging
        console.error("Submission failed:", data);
        // flask-jwt-extended uses 'msg' for errors; checking both ensures the user sees the real issue
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
  const isFormValid = !!(photo && rating && damageTypes.length > 0);

  const locationStatus = locationSource === 'exif' || locationSource === 'browser'
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
                  photoPreview={photoPreview}
                  onChange={handlePhotoChange}
                  onRetake={handleRetakePhoto}
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