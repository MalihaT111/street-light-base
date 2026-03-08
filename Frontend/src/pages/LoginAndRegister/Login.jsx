import React from 'react'
import styles from './LoginAndRegister.module.css'
import { CiUser , CiMail, CiLock, CiUnlock } from "react-icons/ci";
import { IoEyeOutline, IoEyeOffOutline } from "react-icons/io5";
import { Link } from "react-router-dom";
import { useState } from 'react';

const Login = () => {
    const [reveal, setReveal] = useState(false); 
  return (
    <div className={styles.wrapper}>
        <div className={styles.container}>
            <form className={`${styles["form-box"]} ${styles.login}`}>
                <h1>Login</h1>
                <div className={styles["input-wrapper"]}>
                    <CiUser className = {styles.icon}/>
                    <input type="text" 
                    placeholder="Username" required/>
                </div>
                <div className={styles["input-wrapper"]}>
                    <CiLock className = {styles.icon}/>
                    <input type={ reveal ? "text":"password"} 
                    placeholder="Password" required/>
                    <span className = {styles.eyeIcon}
                        onClick = {() => {setReveal(!reveal)}}>
                        {reveal? <IoEyeOutline /> : <IoEyeOffOutline /> }
                    </span>
                </div>

                <div className={styles["remember-forget"]}>
                    <div className={styles["checkbox-wrapper"]}>
                        <input type="checkbox" />
                        <label>Remember Me</label>
                    </div>
                    <a href="#">Forgot password?</a>
                </div>
                <div className={styles["btn-wrapper"]}>
                    <button type = "submit">Sign In</button>
                </div>
                <div className={styles.registeration}>
                    <p>Don't have an account? <Link to="/register">Sign Up</Link></p>
                </div>
            </form>
        </div>
    </div>
  )
}

export default Login;
