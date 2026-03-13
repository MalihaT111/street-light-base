import React from 'react'
import styles from './LoginAndRegister.module.css'
import { CiUser , CiMail, CiLock, CiUnlock } from "react-icons/ci";
import { FaUser , FaLandmark} from "react-icons/fa";
import { IoEyeOutline, IoEyeOffOutline } from "react-icons/io5";
import { Link } from "react-router-dom";
import { useState } from 'react';

const Register = () => {
    const [reveal, setReveal] = useState(false); 
    const [role, setRole] = useState("user");
    const [formInput, setFormInput] = useState({
        firstName: "",
        lastName: "",
        username: "",
        email: "",
        password: ""
    });
    const [errors, setErrors] = useState({});

    const handleChange = (e) => {
        const {id, value} = e.target;
        setFormInput((prev) => ({
            ...prev, [id]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors({});

        try {
            const response = await fetch('http://localhost:5001/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: formInput.username,
                    email: formInput.email,
                    password: formInput.password,
                    first_name: formInput.firstName,
                    last_name: formInput.lastName,
                    role: role
                })
            });

            const data = await response.json();

            if (data.success) {
                alert('Registration successful! Please login.');
                window.location.href = '/';
            } else {
                setErrors({ general: data.error });
            }
        } catch (error) {
            setErrors({ general: 'Registration failed. Please try again.' });
            console.error('Registration error:', error);
        }
    };
  return (
    <>
        {/* Nav bar */}
        <nav>
            <div className= {styles["logo"]}>
                <div className={styles["logo-mark"]}>
                    <svg viewBox="0 0 24 24">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                    </svg>
                </div>
                <span>Street Systems</span>
            </div>
        </nav>
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
                <h1 className ={styles["auth-logo-title"]}>Street Systems</h1>
                <p className ={styles["auth-logo-subtitle"]}>NYC Streetlight Base Damage Reporting</p>
                <form 
                    className={`${styles["form-box"]} ${styles.login}`} 
                    onSubmit={handleSubmit}
                >
                    <div className={styles["auth-body"]}>
                        {errors.general && <div className={styles["error"]}>{errors.general}</div>}
                        {/* Role selector */}
                        <div className={styles["role-toggle"]}>
                            {/* User role (Citizen) toggle button */}
                            <button 
                                className={`${styles["role-btn"]} ${role === "user" ? styles.active : styles.inactive}`}
                                onClick ={()=>{setRole("user")}}
                                type = {"button"}
                            >
                                <span className={styles["role-icon"]}> <FaUser/></span>
                                <span className ={styles["role-text"]} >Citizen</span>
                            </button>
                            {/* Admin role (Dot Admin) toggle button */}
                            <button 
                                className={`${styles["role-btn"]} ${role === "admin" ? styles.active : styles.inactive}`}
                                onClick ={()=>{setRole("admin")}}
                                type = {"button"}
                            >
                                <span className={styles["role-icon"]}><FaLandmark/></span>
                                <span className ={styles["role-text"]}>DOT Admin</span>
                            </button>
                        </div>
                        {/* Input section*/}
                        {/* Input field for name */}
                        <div className={styles["field"]}>
                            {/* Wrapper for name */}
                            <div className={styles["name-wrapper"]}>
                                {/* First name */}
                                <div className={styles["first-name"]}>
                                    <label htmlFor = "firstName">FIRST NAME</label>
                                    <div className={styles["input-wrapper"]}>
                                        <input 
                                            type="text" 
                                            placeholder="Jane"
                                            id="firstName"
                                            value={formInput.firstName}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>
                                {/* Last name */}
                                <div className={styles["last-name"]}>
                                    <label htmlFor = "lastName">LAST NAME</label>
                                    <div className={styles["input-wrapper"]}>
                                        <input 
                                            type="text" 
                                            placeholder="Smith"
                                            id="lastName"
                                            value={formInput.lastName}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* Input field for username */}
                        <div className={styles["field"]}>
                            <label htmlFor = "username">USERNAME</label>
                            <div className={styles["input-wrapper"]}>
                                <CiUser className = {styles.icon}/>
                                <input 
                                    type="text" 
                                    placeholder="janesmith"
                                    id="username"
                                    value={formInput.username}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>
                        {/* Input field for email */}
                        <div className={styles["field"]}>
                            <label htmlFor = "email">EMAIL</label>
                            <div className={styles["input-wrapper"]}>
                                <CiMail className = {styles.icon}/>
                                <input 
                                    type="email" 
                                    placeholder="email@example.com"
                                    id="email"
                                    value={formInput.email}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>
                        {/* Input field for password */}
                        <div className={styles["field"]}>
                            <label htmlFor = "password">PASSWORD</label>
                            <div className={styles["input-wrapper"]}>
                                <CiLock className = {styles.icon}/>
                                <input 
                                    type={reveal ? "text":"password"} 
                                    placeholder="Min. 8 characters"
                                    id="password"
                                    value={formInput.password}
                                    onChange={handleChange}
                                    required
                                />
                                <span className = {styles.eyeIcon}
                                    onClick = {() => {setReveal(!reveal)}}>
                                    {reveal? <IoEyeOutline /> : <IoEyeOffOutline /> }
                                </span>
                            </div>
                        </div>
                        <div className={styles["btn-wrapper"]}>
                            <button type = "submit">Create Account →</button>
                        </div>
                        {/* Divider */}
                        <span className = {styles["divider"]}>or</span>
                        <div className={styles.registeration}>
                            <p>Already have an account? <Link to="/" className ={styles["sign-up-link"]}>Sign In</Link></p>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    </>
  )
}

export default Register;