import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FaHome, FaFileAlt, FaChartBar,
  FaUser, FaCog, FaSignOutAlt, FaCheckCircle,
} from 'react-icons/fa';
import PhotoEvidence from './components/PhotoEvidence';
import DamageRating from './components/DamageRating';
import ReportDetails from './components/ReportDetails';
import ReferenceGuide from './components/ReferenceGuide';
import styles from './Reports.module.css';

const Reports = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

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

  useEffect(() => {
    const handleOutsidePress = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsidePress);
    document.addEventListener('touchstart', handleOutsidePress);
    return () => {
      document.removeEventListener('mousedown', handleOutsidePress);
      document.removeEventListener('touchstart', handleOutsidePress);
    };
  }, []);

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

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('photo', photo);
      formData.append('rating', rating);
      // Send as JSON array string so the backend can parse TEXT[]
      formData.append('damage_types', JSON.stringify(damageTypes));
      if (location) {
        formData.append('latitude', location.lat);
        formData.append('longitude', location.lng);
      }
      if (photoTimestamp) {
        formData.append('photo_timestamp', photoTimestamp.toISOString());
      }

      const response = await fetch('http://localhost:5000/api/reports', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      if (response.ok) {
        setSubmitSuccess(true);
        setTimeout(() => navigate('/home'), 2500);
      } else {
        const data = await response.json();
        setSubmitError(data.error || 'Submission failed. Please try again.');
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
      <nav className={styles.navbar}>
        <div className={styles.logo}>
          <div className={styles.logoMark}>
            <svg viewBox="0 0 24 24">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
            </svg>
          </div>
          <span>Street Systems</span>
        </div>

        <div className={styles.navLinks}>
          <Link to="/home" className={styles.navLink}>
            <FaHome className={styles.navIcon} /><span>Home</span>
          </Link>
          <Link to="/reports" className={`${styles.navLink} ${styles.active}`}>
            <FaFileAlt className={styles.navIcon} /><span>Reports</span>
          </Link>
          <Link to="/leaderboard" className={styles.navLink}>
            <FaChartBar className={styles.navIcon} /><span>Leaderboard</span>
          </Link>
        </div>

        <div
          ref={userMenuRef}
          className={`${styles.userInfo} ${isUserMenuOpen ? styles.userInfoOpen : ''}`}
        >
          <button
            type="button"
            className={styles.userMenuTrigger}
            onClick={() => setIsUserMenuOpen((prev) => !prev)}
            aria-haspopup="menu"
            aria-expanded={isUserMenuOpen}
          >
            <div className={styles.userAvatar}>{username.charAt(0).toUpperCase()}</div>
            <span className={styles.userName}>{username}</span>
          </button>
          <div className={styles.userDropdown}>
            <Link to="/profile" className={styles.dropdownItem} onClick={() => setIsUserMenuOpen(false)}>
              <FaUser className={styles.dropdownIcon} /><span>Profile</span>
            </Link>
            <Link to="/settings" className={styles.dropdownItem} onClick={() => setIsUserMenuOpen(false)}>
              <FaCog className={styles.dropdownIcon} /><span>Settings</span>
            </Link>
            <button
              className={styles.dropdownItemButton}
              onClick={() => {
                setIsUserMenuOpen(false);
                localStorage.removeItem('user');
                localStorage.removeItem('token');
                navigate('/');
              }}
            >
              <FaSignOutAlt className={styles.dropdownIcon} /><span>Sign Out</span>
            </button>
          </div>
        </div>
      </nav>

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