import styles from './css/ReferenceGuide.module.css';

const CONDITION_EXAMPLES = [
  { label: 'GOOD', imageClass: styles.imageGood, labelClass: styles.labelGood },
  { label: 'FAIR', imageClass: styles.imageFair, labelClass: styles.labelFair },
  { label: 'POOR', imageClass: styles.imagePoor, labelClass: styles.labelPoor },
];

const COMMON_DAMAGE_TYPES = [
  'Cracked or fractured base',
  'Missing inspection cover',
  'Corrosion or rust staining',
  'Graffiti or vandalism',
  'Impact damage (vehicle)',
  'Leaning or unstable pole',
];

const ReferenceGuide = () => (
  <div className={styles.card}>
    <div className={styles.cardHeader}>
      <span className={styles.cardTitle}>Reference Guide</span>
    </div>
    <div className={styles.cardBody}>
      <p className={styles.hint}>Compare your photo to these condition examples</p>
      <div className={styles.exampleGrid}>
        {CONDITION_EXAMPLES.map(({ label, imageClass, labelClass }) => (
          <div key={label} className={styles.exampleItem}>
            <div className={`${styles.exampleImage} ${imageClass}`} />
            <span className={`${styles.exampleLabel} ${labelClass}`}>{label}</span>
          </div>
        ))}
      </div>

      <div className={styles.damageList}>
        <p className={styles.damageListTitle}>Common Damage Types</p>
        <ul className={styles.damageListItems}>
          {COMMON_DAMAGE_TYPES.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
    </div>
  </div>
);

export default ReferenceGuide;
