import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Settings.module.css';
import Navbar from '../../components/Navbar/Navbar';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

const Settings = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);

  // Account Info state
  const [accountForm, setAccountForm] = useState({ name: '', email: '' });
  const [accountStatus, setAccountStatus] = useState({ loading: false, success: '', error: '' });

  // Security state
  const [passwordForm, setPasswordForm] = useState({ current: '', newPassword: '', confirm: '' });
  const [passwordStatus, setPasswordStatus] = useState({ loading: false, success: '', error: '' });

  // Delete account state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleteStatus, setDeleteStatus] = useState({ loading: false, error: '' });

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (!savedUser) {
      navigate('/');
      return;
    }
    try {
      const parsed = JSON.parse(savedUser);
      setUser(parsed);
      setAccountForm({ name: parsed.username || '', email: parsed.email || '' });
    } catch {
      navigate('/');
    } finally {
      setPageLoading(false);
    }
  }, [navigate]);

  const token = localStorage.getItem('token');
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  // --- Account Info ---
  const handleAccountChange = (e) => {
    setAccountForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setAccountStatus({ loading: false, success: '', error: '' });
  };

  const handleAccountSubmit = async (e) => {
    e.preventDefault();
    if (!emailRegex.test(accountForm.email)) {
      setAccountStatus({ loading: false, success: '', error: 'Please enter a valid email address.' });
      return;
    }
    setAccountStatus({ loading: true, success: '', error: '' });
    try {
      const res = await fetch(`${API_BASE_URL}/api/user`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ username: accountForm.name, email: accountForm.email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Update failed.');
      const updatedUser = { ...user, username: accountForm.name, email: accountForm.email };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      setAccountStatus({ loading: false, success: 'Account updated successfully.', error: '' });
    } catch (err) {
      setAccountStatus({ loading: false, success: '', error: err.message || 'Unable to connect to server.' });
    }
  };

  // --- Password ---
  const handlePasswordChange = (e) => {
    setPasswordForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setPasswordStatus({ loading: false, success: '', error: '' });
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword.length < 8) {
      setPasswordStatus({ loading: false, success: '', error: 'New password must be at least 8 characters.' });
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirm) {
      setPasswordStatus({ loading: false, success: '', error: 'New passwords do not match.' });
      return;
    }
    setPasswordStatus({ loading: true, success: '', error: '' });
    try {
      const res = await fetch(`${API_BASE_URL}/api/user/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword: passwordForm.current, newPassword: passwordForm.newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Password update failed.');
      setPasswordForm({ current: '', newPassword: '', confirm: '' });
      setPasswordStatus({ loading: false, success: 'Password updated successfully.', error: '' });
    } catch (err) {
      setPasswordStatus({ loading: false, success: '', error: err.message || 'Unable to connect to server.' });
    }
  };

  // --- Delete Account ---
  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setDeleteConfirm('');
    setDeleteStatus({ loading: false, error: '' });
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'DELETE') return;
    setDeleteStatus({ loading: true, error: '' });
    try {
      const res = await fetch(`${API_BASE_URL}/api/user`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Deletion failed.');
      }
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      navigate('/');
    } catch (err) {
      setDeleteStatus({ loading: false, error: err.message || 'Unable to connect to server.' });
    }
  };

  // --- Logout ---
  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/');
  };

  if (pageLoading) return null;

  return (
    <div className={styles.container}>
      <Navbar username={user?.username || 'User'} activeTab="settings" />

      <main className={styles.main}>
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Settings</h1>
          <p className={styles.pageSubtitle}>Manage your account and security</p>
        </div>

        <div className={styles.sections}>

          {/* Account Info */}
          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Account Info</h2>
              <p className={styles.cardDescription}>Update your name and email address</p>
            </div>
            <form onSubmit={handleAccountSubmit} className={styles.form}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="name">Name</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  className={styles.input}
                  value={accountForm.name}
                  onChange={handleAccountChange}
                  placeholder="Your name"
                  required
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="email">Email</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  className={styles.input}
                  value={accountForm.email}
                  onChange={handleAccountChange}
                  placeholder="you@example.com"
                  required
                />
              </div>
              {accountStatus.error && <p className={styles.error}>{accountStatus.error}</p>}
              {accountStatus.success && <p className={styles.success}>{accountStatus.success}</p>}
              <button type="submit" className={styles.btnPrimary} disabled={accountStatus.loading}>
                {accountStatus.loading ? 'Saving…' : 'Save Changes'}
              </button>
            </form>
          </section>

          {/* Security */}
          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Security</h2>
              <p className={styles.cardDescription}>Change your password</p>
            </div>
            <form onSubmit={handlePasswordSubmit} className={styles.form}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="current">Current Password</label>
                <input
                  id="current"
                  name="current"
                  type="password"
                  className={styles.input}
                  value={passwordForm.current}
                  onChange={handlePasswordChange}
                  placeholder="••••••••"
                  required
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="newPassword">New Password</label>
                <input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  className={styles.input}
                  value={passwordForm.newPassword}
                  onChange={handlePasswordChange}
                  placeholder="••••••••"
                  required
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="confirm">Confirm New Password</label>
                <input
                  id="confirm"
                  name="confirm"
                  type="password"
                  className={styles.input}
                  value={passwordForm.confirm}
                  onChange={handlePasswordChange}
                  placeholder="••••••••"
                  required
                />
              </div>
              {passwordStatus.error && <p className={styles.error}>{passwordStatus.error}</p>}
              {passwordStatus.success && <p className={styles.success}>{passwordStatus.success}</p>}
              <button type="submit" className={styles.btnPrimary} disabled={passwordStatus.loading}>
                {passwordStatus.loading ? 'Updating…' : 'Update Password'}
              </button>
            </form>
          </section>

          {/* Session / Logout */}
          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Session</h2>
              <p className={styles.cardDescription}>Sign out of your account on this device</p>
            </div>
            <button onClick={handleLogout} className={styles.btnSecondary}>
              Sign Out
            </button>
          </section>

          {/* Danger Zone */}
          <section className={`${styles.card} ${styles.dangerCard}`}>
            <div className={styles.cardHeader}>
              <h2 className={`${styles.cardTitle} ${styles.dangerTitle}`}>Danger Zone</h2>
              <p className={styles.cardDescription}>
                Permanently delete your account and all associated data. This cannot be undone.
              </p>
            </div>
            <button onClick={() => setShowDeleteModal(true)} className={styles.btnDanger}>
              Delete Account
            </button>
          </section>

        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className={styles.modalOverlay} onClick={closeDeleteModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>Delete Account</h3>
            <p className={styles.modalBody}>
              This will permanently delete your account and all reports you've submitted.
              This action <strong>cannot be undone</strong>.
            </p>
            <p className={styles.modalInstruction}>
              Type <strong>DELETE</strong> to confirm:
            </p>
            <input
              type="text"
              className={styles.input}
              value={deleteConfirm}
              onChange={(e) => {
                setDeleteConfirm(e.target.value);
                setDeleteStatus({ loading: false, error: '' });
              }}
              placeholder="DELETE"
              autoFocus
            />
            {deleteStatus.error && <p className={styles.error}>{deleteStatus.error}</p>}
            <div className={styles.modalActions}>
              <button
                className={styles.btnSecondary}
                onClick={closeDeleteModal}
                disabled={deleteStatus.loading}
              >
                Cancel
              </button>
              <button
                className={styles.btnDanger}
                onClick={handleDeleteAccount}
                disabled={deleteConfirm !== 'DELETE' || deleteStatus.loading}
              >
                {deleteStatus.loading ? 'Deleting…' : 'Permanently Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
