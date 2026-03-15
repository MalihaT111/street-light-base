import styles from "./Challenge.module.css";
const Challenge = () => {
    return(
        <div className = {styles["challenge-wrapper"]}>
            <div className={styles["top-title"]}>
                <h1 className = {styles["challenge-title"]}>Challenge</h1>
                <p className = {styles["challenge-subtitle"]}>Complete challenges to earn bonus points and climb the leaderboard</p>
                <section className = {styles["daily-challenge"]}>
                    <div className={styles["challenge-type"]}>DAILY CHALLENGE</div>
                    
                </section>
                <section className = {styles["weekly-challenge"]}>
                    <div className={styles["challenge-type"]}>WEEKLY CHALLENGE</div>
                    
                </section>
                <section className = {styles["special-challenge"]}>
                    <div className={styles["challenge-type"]}>SPECIAL</div>
                    
                </section>
            </div>
        </div>
        
    )
}
export default Challenge;