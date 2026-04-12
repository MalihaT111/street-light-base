import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import styles from './LoginAndRegister.module.css';
import Navbar from '../../components/Navbar/Navbar';
import { CiLock } from 'react-icons/ci';
import { IoEyeOutline, IoEyeOffOutline } from 'react-icons/io5';

const ResetPassword = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');

    const [formInput, setFormInput] = useState({ password: '', confirmPassword: '' });
    const [errors, setErrors] = useState({});
    const [revealNew, setRevealNew] = useState(false);
    const [revealConfirm, setRevealConfirm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleChange = (e) => {
        const { id, value } = e.target;
        setFormInput((prev) => ({ ...prev, [id]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const errs = {};
        if (!formInput.password.trim()) errs.password = 'Password is required';
        else if (formInput.password.length < 8) errs.password = 'Password must be at least 8 characters';
        if (formInput.password !== formInput.confirmPassword) errs.confirmPassword = 'Passwords do not match';
        setErrors(errs);
        if (Object.keys(errs).length > 0) return;

        setLoading(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_BASE_URL ?? ''}/api/reset-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ new_password: formInput.password }),
            });
            const data = await res.json();
            if (data.success) {
                setSuccess(true);
                setTimeout(() => navigate('/'), 2500);
            } else {
                setErrors({ password: data.error || 'Reset failed. Request a new link.' });
            }
        } catch {
            setErrors({ password: 'Unable to connect to server' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Navbar minimal={true} username="" />
            <div className={styles['auth-wrapper']}>
                <div className={styles['auth-card']}>
                    <div className={styles['auth-body']}>
                        <div className={styles['auth-logo']}>
                            <div className={styles['auth-logo-mark']}>
                                <svg viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                            </div>
                            <div className={styles['auth-logo-title']}>Reset Password</div>
                            <div className={styles['auth-logo-subtitle']}>
                                {success ? 'Password updated! Redirecting...' : 'Enter your new password below'}
                            </div>
                        </div>

                        <div className={styles['form-box']}>
                            {!success ? (
                                <form onSubmit={handleSubmit}>
                                    <div className={styles['field']}>
                                        <label htmlFor="password">NEW PASSWORD</label>
                                        <div className={styles['input-wrapper']}>
                                            <CiLock className={styles['icon']} />
                                            <input id="password" type={revealNew ? 'text' : 'password'} placeholder="New password" value={formInput.password} onChange={handleChange} />
                                            <span className={styles['eyeIcon']} onClick={() => setRevealNew(!revealNew)}>
                                                {revealNew ? <IoEyeOutline /> : <IoEyeOffOutline />}
                                            </span>
                                        </div>
                                        {errors.password && <span className={styles['error']}>{errors.password}</span>}
                                    </div>
                                    <div className={styles['field']}>
                                        <label htmlFor="confirmPassword">CONFIRM PASSWORD</label>
                                        <div className={styles['input-wrapper']}>
                                            <CiLock className={styles['icon']} />
                                            <input id="confirmPassword" type={revealConfirm ? 'text' : 'password'} placeholder="Confirm new password" value={formInput.confirmPassword} onChange={handleChange} />
                                            <span className={styles['eyeIcon']} onClick={() => setRevealConfirm(!revealConfirm)}>
                                                {revealConfirm ? <IoEyeOutline /> : <IoEyeOffOutline />}
                                            </span>
                                        </div>
                                        {errors.confirmPassword && <span className={styles['error']}>{errors.confirmPassword}</span>}
                                    </div>
                                    <div className={styles['btn-wrapper']}>
                                        <button type="submit" disabled={loading}>
                                            {loading ? 'Updating...' : 'Reset Password'}
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <p style={{ textAlign: 'center', fontSize: '0.85rem', color: '#6B7280' }}>
                                    Your password has been updated successfully.
                                </p>
                            )}
                            <div className={styles['registeration']}>
                                <Link to="/">Back to Login</Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ResetPassword;