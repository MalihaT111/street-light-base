import React from 'react'
import styles from './LoginAndRegister.module.css'
import { CiUser , CiMail, CiLock } from "react-icons/ci";
import { IoEyeOutline, IoEyeOffOutline } from "react-icons/io5";
import { Link } from "react-router-dom";
import { useState } from 'react';

const Register = () => {
    const [reveal, setReveal] = useState(false); 
  return (
    <div className={styles.wrapper}>
        <div className={styles.container}>
            <form className={`${styles["form-box"]} ${styles.login}`}>
                <h1>Register</h1>
                <div className={styles["input-wrapper"]}>
                    <CiUser className = {styles.icon}/>
                    <input type="text" 
                    placeholder="Username" required/>
                </div>
                <div className={styles["input-wrapper"]}>
                    <CiMail className = {styles.icon}/>
                    <input type="text" 
                    placeholder="Email" required/>
                </div>
                <div className={styles["input-wrapper"]}>
                    <CiLock className = {styles.icon}/>
                    <input type={reveal? "text":"password"} 
                    placeholder="Password" required/>
                    <span className = {styles.eyeIcon}
                        onClick = {() => {setReveal(!reveal)}}>
                        {reveal? <IoEyeOutline /> : <IoEyeOffOutline /> }
                    </span>
                </div>
                <div className={styles["input-wrapper"]}>
                    <CiLock className = {styles.icon}/>
                    <input type={reveal? "text":"password"} 
                    placeholder="Re-enter Password" required/>
                    <span className = {styles.eyeIcon}
                        onClick = {() => {setReveal(!reveal)}}>
                        {reveal? <IoEyeOutline /> : <IoEyeOffOutline /> }
                    </span>
                </div>
            
            
                <div className={styles["btn-wrapper"]}>
                    <button type = "submit">Sign Up</button>
                </div>
                <div className={styles.registeration}>
                    <p>Already an account? <Link to="/">Sign In</Link></p>
                </div>
            </form>
        </div>
    </div>
  )
}

export default Register;