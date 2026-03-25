import React from "react";
import styles from "./Dashboard.module.css";

const statCards = [
  {
    label: "Total Reports",
    value: "4,821",
    subtext: "↑ 12% vs last month",
    valueClass: "",
  },
  {
    label: "Poor Condition",
    value: "1,247",
    subtext: "25.9% of all reports",
    valueClass: styles.orange,
  },
  {
    label: "Top Damage Type",
    value: "Cracked base",
    subtext: "Most reported issue category",
    valueClass: styles.green,
  },
  {
    label: "Unresolved Cases",
    value: "1,204",
    subtext: "Awaiting review or inspection",
    valueClass: "",
  },
];

const boroughs = [
  { code: "MH", name: "Manhattan", count: "1,420 reports", level: "l5" },
  { code: "BK", name: "Brooklyn", count: "1,288 reports", level: "l4" },
  { code: "QN", name: "Queens", count: "1,044 reports", level: "l3" },
  { code: "BX", name: "Bronx", count: "792 reports", level: "l4" },
  { code: "SI", name: "Staten Island", count: "277 reports", level: "l1" },
];

const monthlyReports = [
  { month: "Sep", totalHeight: 130, poorHeight: 46 },
  { month: "Oct", totalHeight: 155, poorHeight: 56 },
  { month: "Nov", totalHeight: 122, poorHeight: 42 },
  { month: "Dec", totalHeight: 104, poorHeight: 37 },
  { month: "Jan", totalHeight: 182, poorHeight: 74 },
  { month: "Feb", totalHeight: 248, poorHeight: 122 },
];

const damageBreakdown = [
  { label: "Cracked base", percent: "28%", dotClass: styles.b1 },
  { label: "Missing cover", percent: "18%", dotClass: styles.b2 },
  { label: "Corrosion / rust", percent: "16%", dotClass: styles.b3 },
  { label: "Graffiti", percent: "11%", dotClass: styles.b4 },
  { label: "Physical impact damage", percent: "17%", dotClass: styles.b5 },
  { label: "Leaning / unstable", percent: "10%", dotClass: styles.b6 },
];

export default function Dashboard() {
  return (
    <div className={styles.app}>
      {/* Navbar */}
      <header className={styles.topbar}>
        <div className={styles.topbarInner}>
          <div className={styles.brand}>
            <div className={styles.logoMark}>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
              </svg>
            </div>

            <div>
              <div className={styles.brandTitle}>Street Systems</div>
              <div className={styles.brandSubtitle}>DOT Analytics Dashboard</div>
            </div>
          </div>

          <nav className={styles.nav}>
            <div className={`${styles.navItem} ${styles.active}`}>Analytics</div>
          </nav>
        </div>
      </header>

      <main className={styles.container}>
        {/* Hightlight section */}
        <section className={styles.hero}>
          <div>
            <div className={styles.eyebrow}>Internal operations view</div>
            <h1 className={styles.heroTitle}>Streetlight base damage analytics</h1>
          </div>

          <div className={styles.heroMetrics}>
            <div>
              <div className={styles.heroMetricValue}>4,821</div>
              <div className={styles.heroMetricLabel}>Total reports</div>
            </div>
            <div>
              <div className={styles.heroMetricValue}>1,247</div>
              <div className={styles.heroMetricLabel}>Poor reports</div>
            </div>
          </div>
        </section>

        {/* Summary stats */}
        <section className={styles.statsGrid}>
          {statCards.map((card) => (
            <div key={card.label} className={styles.card}>
              <div className={styles.cardBody}>
                <div className={styles.statTop}>
                  <div>
                    <div className={styles.statLabel}>{card.label}</div>
                    <div className={`${styles.metricValue} ${card.valueClass}`}>
                      {card.value}
                    </div>
                  </div>
                </div>
                <div className={styles.statSubtext}>{card.subtext}</div>
              </div>
            </div>
          ))}
        </section>

        {/* Main content area */}
        <section className={styles.mainGrid}>
          <div className={styles.stack}>
            {/* Borough heat cards */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <div>
                  <div className={styles.cardTitle}>Borough report clusters</div>
                  <div className={styles.cardSubtitle}>
                    Boroughs: Manhattan, Brooklyn, Queens, Bronx, and Staten island
                  </div>
                </div>
                <div className={styles.softPill}>Borough only</div>
              </div>

              <div className={styles.mapGrid}>
                <div className={`${styles.heatGrid} ${styles.boroughGrid}`}>
                  {boroughs.map((borough) => (
                    <div
                      key={borough.code}
                      className={`${styles.heatCell} ${styles[borough.level]}`}
                    >
                      <div className={styles.boroughCode}>{borough.code}</div>
                      <div className={styles.boroughName}>{borough.name}</div>
                      <div className={styles.boroughCount}>{borough.count}</div>
                    </div>
                  ))}
                </div>

                <div className={styles.legend}>
                  <span>Low</span>
                  <div className={styles.legendBar} />
                  <span>High</span>
                </div>
              </div>
            </div>

            {/* Bar chart placeholder */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <div>
                  <div className={styles.cardTitle}>Reports over time</div>
                  <div className={styles.cardSubtitle}>
                    Monthly total volume (<b>Blue</b>) versus poor conditions (<b>Orange</b>)
                  </div>
                </div>
                <div className={styles.tag}>Last 6 months</div>
              </div>

              <div className={styles.chartPlaceholder}>
                <div className={styles.bars}>
                  {monthlyReports.map((item) => (
                    <div key={item.month} className={styles.barGroup}>
                      <div className={styles.barPair}>
                        <div
                          className={styles.bar}
                          style={{ height: `${item.totalHeight}px` }}
                        />
                        <div
                          className={`${styles.bar} ${styles.severe}`}
                          style={{ height: `${item.poorHeight}px` }}
                        />
                      </div>
                      <div className={styles.monthLabel}>{item.month}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className={styles.stack}>
            {/* Donut chart placeholder */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <div>
                  <div className={styles.cardTitle}>Damage type breakdown</div>
                  <div className={styles.cardSubtitle}>
                    Categories now aligned with the reporting form damage types
                  </div>
                </div>
                <div className={styles.tag}>6 months</div>
              </div>

              <div className={styles.donutWrap}>
                <div className={styles.donut} />

                <div className={styles.donutLegend}>
                  {damageBreakdown.map((item) => (
                    <div key={item.label} className={styles.legendRow}>
                      <div className={styles.legendLeft}>
                        <span className={`${styles.dot} ${item.dotClass}`} />
                        {item.label}
                      </div>
                      <div className={styles.mono}>{item.percent}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}