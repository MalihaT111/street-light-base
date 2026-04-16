import styles from './css/ReferenceGuide.module.css';
import goodImg from '../../../assets/images/good.jpg'
import fairImg from '../../../assets/images/fair.jpg'
import poorImg from '../../../assets/images/poor.png'
import ToolTip from './ToolTip';

const CONDITION_EXAMPLES = [
  { 
    label: 'GOOD', 
    imageClass: styles.imageGood, 
    imageSrc: goodImg, 
    labelClass: styles.labelGood, 
    desc:  "No Action is needed.\n• All Corners are in good condition",
  },
  { 
    label: 'FAIR', 
    imageClass: styles.imageFair, 
    imageSrc: fairImg, 
    labelClass: styles.labelFair, 
    desc: "Replacement in 1-2 years. \n• One side is corroded",
  },
  { 
    label: 'POOR', 
    imageClass: styles.imagePoor, 
    imageSrc: poorImg, 
    labelClass: styles.labelPoor, 
    desc: "Immediate action.\n• Two or more sides are corroded",
  },
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
        {CONDITION_EXAMPLES.map(({ label, imageClass, imageSrc, labelClass, desc }) => (
          // refrence images
          <div key={label} className={styles.exampleItem}>
                <ToolTip text ={desc} textTitle={label}>
                  <img 
                    src = {imageSrc}
                    className={`${styles.exampleImage} ${imageClass}`}
                  />
                </ToolTip>
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
