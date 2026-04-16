import styles from './css/ToolTip.module.css'

const ToolTip = ({imgSrc, imgTitle, imgDesc}) => {
    return(
        // wrapper
        <div className = {styles.wrapper}>
            <img src = {imgSrc}/>
            <div className={styles.content}>
                <div className={styles.contentTitle}>{imgTitle}</div>
                <div className={styles.contentDesc}>{imgDesc}</div>
            </div>
        </div>
    )
}

export default ToolTip;