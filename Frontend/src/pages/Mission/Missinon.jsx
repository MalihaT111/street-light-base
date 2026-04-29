import Navbar from "../../components/Navbar/Navbar";
import PageHero from "../../components/PageHero/PageHero.jsx";
import useAuth from "../../hooks/useAuth";
import styles from "./Mission.module.css";
import { FaArrowRight } from 'react-icons/fa';
import { Link } from "react-router-dom";


function Mission() {
 const { user, loading } = useAuth();
 const username = user?.username || "Citizen";


 if (loading) return <div>Loading...</div>;


 return (
   <>
     <Navbar username={username} activeTab="home" />


     <main className={styles.wrapper}>
       <PageHero
         title="Our Mission"
         subtitle="Supporting the city’s mission to maintain safe, reliable infrastructure by identifying and reporting streetlight hazards."
       />


       <section className={styles.section}>
         <div className={styles.missionCard}>
           <p className={styles.eyebrow}>Why this matters</p>
           <h2>Small reports can prevent bigger infrastructure problems.</h2>
           <p>
             Streetlight base damage can start as minor wear, corrosion, or
             cracking. When residents report these issues early, the city gains
             the information needed to identify risks before they become more
             serious.
           </p>
         </div>
       </section>


       <section className={styles.section}>
         <h2 className={styles.sectionTitle}>How reporting creates impact</h2>


         <div className={styles.flowGrid}>
           <div className={styles.flowCard}>
             <span>1</span>
             <h3>You report damage</h3>
             <p>Residents submit location and condition details.</p>
           </div>


           <div className={styles.flowCard}>
             <span>2</span>
             <h3>Data is collected</h3>
             <p>Reports become structured data points for analysis.</p>
           </div>


           <div className={styles.flowCard}>
             <span>3</span>
             <h3>Patterns appear</h3>
             <p>Repeated reports reveal hotspots and recurring issues.</p>
           </div>


           <div className={styles.flowCard}>
             <span>4</span>
             <h3>Repairs are prioritized</h3>
             <p>Trends help guide inspections, maintenance, and planning.</p>
           </div>
         </div>
       </section>


       <section className={styles.section}>
         <h2 className={styles.sectionTitle}>Benefits of reporting</h2>


         <div className={styles.benefitGrid}>
           <div className={styles.benefitCard}>
             <h3>Earlier detection</h3>
             <p>Reports help surface damage that may not be seen during routine inspections.</p>
           </div>


           <div className={styles.benefitCard}>
             <h3>Safer streets</h3>
             <p>Identifying unstable or damaged bases supports safer public spaces.</p>
           </div>


           <div className={styles.benefitCard}>
             <h3>Better planning</h3>
             <p>Trend data helps the city understand where infrastructure issues repeat.</p>
           </div>
         </div>
       </section>


       <section className={styles.section}>
         <div className={styles.callout}>
           <h2>Reporting turns local observations into citywide awareness.</h2>
           <p>
             One report may seem small, but many reports together help reveal
             where attention is needed most.
           </p>
           <Link to="/reports" className={styles.viewAllLink}>
             Contribute now <FaArrowRight />
           </Link>
         </div>
       </section>
     </main>
   </>
 );
}


export default Mission;