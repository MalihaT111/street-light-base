import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import styles from './LoginAndRegister.module.css';
import Navbar from '../../components/Navbar/Navbar';

const VerifyEmail = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const [status, setStatus] = useState('loading');
    const [message, setMessage] = useState('');

    useEffect(() => {
        const verify = async () => {
            try {
                const res = await fetch(`${import.meta.env.VITE_API_BASE_URL ?? ''}/api/email-verification`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                });
                const data = await res.json();
                if (data.success) {
                    setStatus('success');
                } else {
                    setStatus('error');
                    setMessage(data.error || 'Verification failed.');
                }
            } catch {
                setStatus('error');
                setMessage('Unable to connect to server.');
            }
        };

        if (token) verify();
        else { setStatus('error'); setMessage('No token provided.'); }
    }, [token]);

    return (
        <>
            <Navbar minimal />
            <div className={styles["auth-wrapper"]}>
                <div className={styles["auth-card"]}>
                    <h1 className={styles["auth-logo-title"]}>
                        {status === 'loading' && 'Verifying...'}
                        {status === 'success' && 'Email Verified!'}
                        {status === 'error' && 'Verification Failed'}
                    </h1>
                    <p className={styles["auth-logo-subtitle"]}>
                        {status === 'loading' && 'Please wait...'}
                        {status === 'success' && 'Your account is active. You can sign in.'}
                        {status === 'error' && message}
                    </p>
                    <div className={styles["form-box"]}>
                        <div className={styles["auth-body"]}>
                            <div className={styles["registeration"]}>
                                {status !== 'loading' && (
                                    <p>
                                        <Link to="/" className={styles["sign-up-link"]}>
                                            {status === 'success' ? 'Go to Sign In' : 'Back to Sign In'}
                                        </Link>
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default VerifyEmail;