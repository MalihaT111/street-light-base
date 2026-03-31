import styles from "./Dashboard.module.css";
import DashboardTopbar from "./components/DashboardTopbar";
import DashboardHero from "./components/DashboardHero";
import StatsGrid from "./components/StatsGrid";
import BoroughClustersCard from "./components/BoroughClustersCard";
import ReportsOverTimeCard from "./components/ReportsOverTimeCard";
import DamageBreakdownCard from "./components/DamageBreakdownCard";
import {
  boroughs,
  damageBreakdown,
  heroMetrics,
  monthlyReports,
  statCards,
} from "./dashboardData";

export default function Dashboard() {
  return (
    <div className={styles.app}>
      <DashboardTopbar />

      <main className={styles.container}>
        <DashboardHero metrics={heroMetrics} />
        <StatsGrid cards={statCards} />

        <section className={styles.mainGrid}>
          <div className={styles.stack}>
            <BoroughClustersCard boroughs={boroughs} />
            <ReportsOverTimeCard reports={monthlyReports} />
          </div>

          <div className={styles.stack}>
            <DamageBreakdownCard items={damageBreakdown} />
          </div>
        </section>
      </main>
    </div>
  );
}
