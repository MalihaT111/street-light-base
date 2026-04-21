import { useState } from 'react';
import { useNavigate, Link } from "react-router-dom";
import styles from './LoginAndRegister.module.css';
import Navbar from '../../components/Navbar/Navbar';
import { CiMail, CiLock } from "react-icons/ci";
import { FaUser, FaLandmark } from "react-icons/fa";
import { IoEyeOutline, IoEyeOffOutline } from "react-icons/io5";
import Cookies from 'js-cookie';

const Login = () => {
    const navigate = useNavigate();
    // For show and hide password toggle
    const [reveal, setReveal] = useState(false); 
    // For role toggle
    const [role, setRole] = useState("user");
    // Client side form validation
    const [formInput, setFormInput] = useState({email:"" ,password:""});
    const [errors, setErrors] = useState({});
    // Message for each error type and case
    const [unverifiedEmail, setUnverifiedEmail] = useState('');
    const [resendMsg, setResendMsg] = useState('');
    const [resending, setResending] = useState(false);
    const validate = () => {
        const errorMessage = {};
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
        // Validation for email or username
        if (!formInput.email.trim()){
            errorMessage.email = "Email or username is required";
        }
        else if (formInput.email.length > 100){
            errorMessage.email = "Input is too long";
        }
        else if (formInput.email.includes('@') && !emailRegex.test(formInput.email)){
            errorMessage.email = "Please enter a valid email address"
        }
        // Validation for password
        if(!formInput.password.trim()){
            errorMessage.password = "Password is required";
        }
        else if (formInput.password.length < 8){
            errorMessage.password = "Password must be at least 8 characters"
        }
        return errorMessage;
    }
    //To update and store formInput values
    const handleChange = (e) => {
        // Object destructuring
        const {id,value} = e.target;

        setFormInput((prev) => ({
            ...prev, [id] : value
        }));
    }
    const handleSubmit = async (e) => {
        e.preventDefault();

        const errorMessages = validate();
        setErrors(errorMessages);
        if (Object.keys(errorMessages).length > 0) return;

        try {
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL ?? ''}/api/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: formInput.email,
                    password: formInput.password,
                    role: role
                })
            });

            const data = await response.json();

            if (!response.ok) {
                if (data.email_not_verified) {
                    setErrors({ password: 'Account access restricted due to unverified email. A verification email has been sent to ${data.email}. Please verify to access your account.' });
                    setUnverifiedEmail(data.email || formInput.email);
                    setResendMsg('');
                    return;
                }
                setErrors({ password: data.error || 'Login failed' });
                setUnverifiedEmail('');
                setResendMsg('');
                return;
            }

            Cookies.set('user', JSON.stringify(data.user), { expires: 7, sameSite: 'Strict' });
            Cookies.set('token', data.access_token, { expires: 7, sameSite: 'Strict' });

            setTimeout(() => navigate(data.user.role === 'admin' ? '/dashboard' : '/home'), 50);
        } catch {
            setErrors({ password: 'Unable to connect to server' });
        }
    }
        const handleResend = async () => {
            setResending(true);
            setResendMsg('');
            try {
                const res = await fetch(`${import.meta.env.VITE_API_BASE_URL ?? ''}/api/resend-verification`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: unverifiedEmail }),
            });
            const d = await res.json();
            setResendMsg(d.success ? 'Verification email sent! Check your inbox.' : (d.error || 'Failed to resend.'));
            } catch {
                setResendMsg('Unable to connect to server.');
            } finally {
                setResending(false);
            }
        };
  return (
    <>
        <Navbar minimal />
        <div className={styles["auth-wrapper"]}>
            <div className={styles["auth-card"]}>
                {/* Logo section displayed at the top of the login/register page */}
                <div className={styles["auth-logo"]}>
                    <div className={styles["auth-logo-mark"]}>
                        <svg viewBox="0 0 24 24">
                            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                        </svg>
                    </div>
                </div>
                {/* Application title and subtitle for the authentication container */}
                <h1 className ={styles["auth-logo-title"]}>Street Light Base</h1>
                <p className ={styles["auth-logo-subtitle"]}>NYC Streetlight Base Damage Reporting</p>
                <form 
                    className={`${styles["form-box"]} ${styles.login}`} 
                    onSubmit = {handleSubmit}
                >
                    <div className={styles["auth-body"]}>
                        {/* Role selector */}
                        <div className={styles["role-toggle"]}>
                            {/* User role (Citizen) toggle button */}
                            <button 
                                className={`${styles["role-btn"]} ${role === "user" ? styles.active : styles.inactive}`}
                                onClick = {() => {setRole("user")}}
                                type = {"button"}
                            >
                                <span className={styles["role-icon"]}> <FaUser/></span>
                                <span className ={styles["role-text"]} >Citizen</span>
                            </button>
                            {/* Admin role (Dot Admin) toggle button */}
                            <button 
                                className={`${styles["role-btn"]} ${role === "admin" ? styles.active : styles.inactive}`}
                                onClick ={() => setRole("admin")}
                                type = {"button"}
                            >
                                <span className={styles["role-icon"]}><FaLandmark/></span>
                                <span className ={styles["role-text"]}>DOT Admin</span>
                            </button>
                        </div>
                        {/* Input section for email/username and password */}
                        {/* Input field for email or username */}
                        <div className={styles["field"]}>
                            <label htmlFor = "email">EMAIL OR USERNAME</label>
                            <div className={styles["input-wrapper"]}>
                                <CiMail className = {styles.icon}/>
                                <input type="text" 
                                    placeholder="email@example.com or username"
                                    id = "email"
                                    value={formInput.email}
                                    onChange = {handleChange}
                                />
                                <div className={styles["error"]}>{errors.email}</div>
                            </div>
                        </div>
                        {/* Input field for password */}
                        <div className={styles["field"]}>
                            <label htmlFor = "password">PASSWORD</label>
                            <div className={styles["input-wrapper"]}>
                                <CiLock className = {styles.icon}/>
                                <input type={ reveal ? "text":"password"} 
                                    placeholder="Enter your password"
                                    id = "password"
                                    value={formInput.password}
                                    onChange = {handleChange}
                                    className={errors.password ? styles["input-error"]: ""}
                                />
                                <span className = {styles.eyeIcon}
                                    onClick = {() => {setReveal(!reveal)}}>
                                    {reveal? <IoEyeOutline /> : <IoEyeOffOutline /> }
                                </span>
                                <div className={styles["error"]}>{errors.password}</div>
                            </div>
                        </div>
                        {unverifiedEmail && (
                            <div className={styles["registeration"]} style={{ marginTop: '8px' }}>
                                <button
                                    type="button"
                                    onClick={handleResend}
                                    disabled={resending}
                                    className={styles["sign-up-link"]}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                                >
                                    {resending ? 'Sending...' : 'Resend verification email'}
                                </button>
                                {resendMsg && (
                                    <p className={styles[resendMsg.includes('sent') ? 'success-msg' : 'error']}>
                                        {resendMsg}
                                    </p>
                                )}
                            </div>
                        )}
                        <div className={styles["forget-password"]}>
                            <Link to="/forgot-password">Forgot password?</Link>
                        </div>
                        <div className={styles["btn-wrapper"]}>
                            <button type = "submit">Sign In →</button>
                        </div>
                        {/* Divider */}
                        <span className = {styles["divider"]}>or</span>
                        <div className={styles.registeration}>
                            <p>Don't have an account? <Link to="/register" className ={styles["sign-up-link"]}>Sign Up</Link></p>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    </>
  )
}

export default Login;
