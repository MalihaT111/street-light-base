import styles from './css/ToolTip.module.css'

const ToolTip = ({text, textTitle, children}) => {
    return(
        // wrapper
        <div className = {styles.toolTipContainer}>
            <div className = {styles.toolTipChild}>
                {children}
            </div>
            <div className = {styles.toolTip}>
                <div className = {styles.contentTitle}>{textTitle}</div>
                <span className = {styles.contentDesc}>{text}</span>
            </div>
        </div>
    )
}

export default ToolTip;