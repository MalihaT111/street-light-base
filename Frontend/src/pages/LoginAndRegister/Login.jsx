import React from 'react'
import styles from './LoginAndRegister.module.css'
import { CiUser , CiMail, CiLock, CiUnlock } from "react-icons/ci";
import { FaUser , FaLandmark} from "react-icons/fa";
import { IoEyeOutline, IoEyeOffOutline } from "react-icons/io5";
import { Link } from "react-router-dom";
import { useState } from 'react';

const Login = () => {
    // For show and hide password toggle
    const [reveal, setReveal] = useState(false); 
    // For role toggle
    const [role, setRole] = useState("user");
    // Client side form validation
    const [formInput, setFormInput] = useState({email:"" ,password:""});
    const [errors, setErrors] = useState({});
    // Message for each error type and case
    const validate = () => {
        const errorMessage = {};
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
        // Validation for email
        if (!formInput.email.trim()){
            errorMessage.email = "Email is required";
        }
        else if (formInput.email.length > 100){
            errorMessage.email = "Email is too long";
        }
        else if (!emailRegex.test(formInput.email)){
            errorMessage.email = "Pleae enter a valid email address"
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
        // Object decontrusting
        const {id,value} = e.target;

        setFormInput((prev) => ({
            ...prev, [id] : value
        }));
    }
    const handleSubmit = (e) =>{
        e.preventDefault();

        const errorMessages = validate();
        setErrors(errorMessages);

        if (Object.keys(errorMessages).length > 0) {
            return;
        }
    
        console.log("Form submitted successfully");   
    }
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
                        {/* Input section for email and password */}
                        {/* Input field for email */}
                        <div className={styles["field"]}>
                            <label htmlFor = "email">EMAIL</label>
                            <div className={styles["input-wrapper"]}>
                                <CiMail className = {styles.icon}/>
                                <input type="text" 
                                    placeholder="email@example.com"
                                    id = "email"
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
                        <div className={styles["forget-password"]}>
                            <a href="#">Forgot password?</a>
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
