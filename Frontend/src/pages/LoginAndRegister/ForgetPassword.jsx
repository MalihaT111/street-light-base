import { useState } from 'react';
import { Link } from 'react-router-dom';
import styles from './LoginAndRegister.module.css';
import Navbar from '../../components/Navbar/Navbar';
import { CiMail } from 'react-icons/ci';

const ForgetPassword = () => {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email.trim()) { setError('Email is required'); return; }
        setLoading(true);
        setError('');
        try {
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL ?? ''}/api/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            const data = await response.json();
            if (data.success) setSubmitted(true);
            else setError(data.error || 'Something went wrong');
        } catch {
            setError('Unable to connect to server');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Navbar minimal />
            <div className={styles["auth-wrapper"]}>
                <div className={styles["auth-card"]}>
                    <div className={styles["auth-logo"]}>
                        <div className={styles["auth-logo-mark"]}>
                            <svg viewBox="0 0 24 24">
                                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                            </svg>
                        </div>
                    </div>
                    <h1 className={styles["auth-logo-title"]}>Forgot Password</h1>
                    <p className={styles["auth-logo-subtitle"]}>
                        {submitted ? 'Check your inbox for a reset link' : "Enter your email and we'll send you a reset link"}
                    </p>
                    <form className={styles["form-box"]} onSubmit={handleSubmit}>
                        <div className={styles["auth-body"]}>
                            {!submitted ? (
                                <>
                                    <div className={styles["field"]}>
                                        <label htmlFor="email">EMAIL ADDRESS</label>
                                        <div className={styles["input-wrapper"]}>
                                            <CiMail className={styles.icon} />
                                            <input
                                                type="email"
                                                id="email"
                                                placeholder="Enter your email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                            />
                                            <div className={styles["error"]}>{error}</div>
                                        </div>
                                    </div>
                                    <div className={styles["btn-wrapper"]}>
                                        <button type="submit" disabled={loading}>
                                            {loading ? 'Sending...' : 'Send Reset Link'}
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <p style={{ textAlign: 'center', fontSize: '0.85rem', color: '#6B7280', marginBottom: '1rem' }}>
                                    A reset link was sent to <strong>{email}</strong> if it exists in our system.
                                </p>
                            )}
                            <div className={styles["registeration"]}>
                                <p><Link to="/">Back to Login</Link></p>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
};

export default ForgetPassword;