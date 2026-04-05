import styles from './PageHero.module.css';

const PageHero = ({ title, subtitle, pills = [], side }) => (
    <div className={styles.hero}>
        <div className={styles.heroBody}>
            <h1 className={styles.heroTitle}>{title}</h1>
            {subtitle && <p className={styles.heroSubtitle}>{subtitle}</p>}
            {pills.length > 0 && (
                <div className={styles.heroMeta}>
                    {pills.map((pill, i) => (
                        <span key={i} className={styles.heroPill}>
                            {pill.icon && <pill.icon />}
                            {pill.label}
                        </span>
                    ))}
                </div>
            )}
        </div>
        {side && <div className={styles.heroSide}>{side}</div>}
    </div>
);

export default PageHero;
