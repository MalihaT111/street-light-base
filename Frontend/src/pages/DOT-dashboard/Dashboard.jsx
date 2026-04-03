import DashboardTopbar from "./components/DashboardTopbar";
import DOTnavbar from "../../components/DOTnavbar/DOTnavbar";
import SummaryCards from "./components/SummaryCards";
import ChartCard from "./components/ChartCard";
import BarChart from "./components/BarChart";
import LineChart from "./components/LineChart";
import HeatmapChart from "./components/HeatmapChart";
import PieChart from "./components/PieChart";
import { useAnalyticsDashboard } from "./hooks/useAnalyticsDashboard";
import { getAnalyticsHeatmapUrl } from "./api";
import {
  buildSummaryCards,
  formatAppliedFilters,
} from "./utils/analytics";
import styles from "./Dashboard.module.css";

const DEFAULT_FILTERS = {
  borough: [],
  rating: [],
  startDate: "",
  endDate: "",
};

function DashboardHero({ filters }) {
  const appliedFilters = formatAppliedFilters(filters);

  return (
    <section className={styles.hero}>
      <div className={styles.heroContent}>
        <h1 className={styles.heroTitle}>Streetlight base damage analytics</h1>
        <p className={styles.heroSubtitle}>
          Track reporting volume, poor-condition trends, damage patterns, and
          geographic hotspots across NYC boroughs from aggregated report data.
        </p>
      </div>

    </section>
  );
}

export default function Dashboard() {
  const filters = DEFAULT_FILTERS;
  const { summary, analytics, heatmap, isLoading } =
    useAnalyticsDashboard(filters);
  const heatmapApiUrl = getAnalyticsHeatmapUrl(filters);

  const summaryCards = buildSummaryCards(summary.data);

  return (
    <div className={styles.app}>
      <DOTnavbar activeTab="analytics" />

      <main className={styles.container}>
        <DashboardHero filters={filters} />

        <SummaryCards
          cards={summaryCards}
          loading={summary.loading}
          error={summary.error}
        />

        <section className={styles.mainGrid}>
          <ChartCard
            title="Counts by rating"
            subtitle="Volume of reports grouped by DOT condition rating."
            loading={analytics.loading}
            error={analytics.error}
            isEmpty={!analytics.data.countsByRating.length}
            emptyMessage="No rating counts are available for the selected filters."
          >
            <BarChart
              data={analytics.data.countsByRating}
              xAxisLabel="Rating"
              yAxisLabel="Reports"
              tooltipLabel="reports"
              color="#f97316"
              displayOrder={["good", "fair", "poor"]}
            />
          </ChartCard>

          <ChartCard
            title="Counts by borough"
            subtitle="Report distribution across boroughs."
            loading={analytics.loading}
            error={analytics.error}
            isEmpty={!analytics.data.countsByBorough.length}
            emptyMessage="No borough counts are available for the selected filters."
          >
            <BarChart
              data={analytics.data.countsByBorough}
              xAxisLabel="Borough"
              yAxisLabel="Reports"
              tooltipLabel="reports"
              color="#2563eb"
            />
          </ChartCard>

          <ChartCard
            title="Poor reports over time"
            subtitle="Monthly trend for reports rated poor."
            loading={analytics.loading}
            error={analytics.error}
            isEmpty={!analytics.data.poorReportsOverTime.length}
            emptyMessage="No poor-condition trend data is available for the selected filters."
          >
            <LineChart
              data={analytics.data.poorReportsOverTime}
              xAxisLabel="Month"
              yAxisLabel="Poor reports"
              tooltipLabel="poor reports"
              color="#dc2626"
              areaFill="#fecaca"
            />
          </ChartCard>

          <ChartCard
            title="Damage type breakdown"
            subtitle="Most common reported streetlight base damage categories."
            loading={analytics.loading}
            error={analytics.error}
            isEmpty={!analytics.data.damageTypeCounts.length}
            emptyMessage="No damage type counts are available for the selected filters."
          >
            <PieChart
              data={analytics.data.damageTypeCounts}
              tooltipLabel="reports"
            />
          </ChartCard>

          <ChartCard
            title="Damage density"
            subtitle="NYC streetlight base report intensity rendered as a live Leaflet heatmap."
            loading={heatmap.loading}
            error={heatmap.error}
            className={styles.fullWidthCard}
          >
            <HeatmapChart data={heatmap.data} apiUrl={heatmapApiUrl} />
          </ChartCard>
        </section>
      </main>
    </div>
  );
}
