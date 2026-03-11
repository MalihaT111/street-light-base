import React from 'react'
import styles from './LoginAndRegister.module.css'
import { CiUser , CiMail, CiLock, CiUnlock } from "react-icons/ci";
import { FaUser , FaLandmark} from "react-icons/fa";
import { IoEyeOutline, IoEyeOffOutline } from "react-icons/io5";
import { Link } from "react-router-dom";
import { useState } from 'react';

const Register = () => {
    // For show and hide password toggle
    const [reveal, setReveal] = useState(false); 
    // For role toggle
    const [role, setRole] = useState("user");
  return (
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
            <h2 className ={styles["auth-logo-title"]}>Street Systems</h2>
            <p className ={styles["auth-logo-subtitle"]}>NYC Streetlight Base Damage Reporting</p>
            <form 
                className={`${styles["form-box"]} ${styles.login}`} 
                onSubmit = {(e) => e.preventDefault()}
            >
                <div className={styles["auth-body"]}>
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
                                <label htmlFor = "first-name">FIRST NAME</label>
                                <div className={styles["input-wrapper"]}>
                                    <input 
                                        type="text" 
                                        placeholder="Jane" required
                                        id = "first-name"
                                    />
                                </div>
                            </div>
                            {/* Last name */}
                            <div className={styles["last-name"]}>
                                <label htmlFor = "last-name">LAST NAME</label>
                                <div className={styles["input-wrapper"]}>
                                    <input 
                                        type="text" 
                                        placeholder="Smith" required
                                        id = "last-name"
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
                                placeholder="janesmith" required
                                id = "username"
                            />
                        </div>
                    </div>
                    {/* Input field for email */}
                    <div className={styles["field"]}>
                        <label htmlFor = "email">EMAIL</label>
                        <div className={styles["input-wrapper"]}>
                            <CiMail className = {styles.icon}/>
                            <input 
                                type="text" 
                                placeholder="email@example.com" required
                                id = "email"
                            />
                        </div>
                    </div>
                    {/* Input field for password */}
                    <div className={styles["field"]}>
                        <label htmlFor = "password">PASSWORD</label>
                        <div className={styles["input-wrapper"]}>
                            <CiLock className = {styles.icon}/>
                            <input 
                                type={ reveal ? "text":"password"} 
                                placeholder="Min. 8 characters" required
                                id = "password"
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
                        <p>Already have an account? <Link to="/" className ={styles["sign-up-link"]}>Sign Up</Link></p>
                    </div>
                </div>
            </form>
        </div>
    </div>
  )
}

export default Register;