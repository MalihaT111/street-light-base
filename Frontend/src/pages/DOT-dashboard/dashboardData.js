import styles from "./Dashboard.module.css";

export const heroMetrics = [
  { value: "0", label: "Total reports" },
  { value: "0", label: "Poor reports" },
];

export const statCards = [
  {
    label: "Total Reports",
    value: "0",
    subtext: "Live report count",
    valueClass: "",
  },
  {
    label: "Poor Condition",
    value: "0",
    subtext: "0% of all reports",
    valueClass: styles.orange,
  },
  {
    label: "Top Damage Type",
    value: "Cracked base",
    subtext: "Most reported issue category",
    valueClass: styles.green,
  },
];

export const boroughs = [
  { code: "MH", name: "Manhattan", count: "1,420 reports", level: "l5" },
  { code: "BK", name: "Brooklyn", count: "1,288 reports", level: "l4" },
  { code: "QN", name: "Queens", count: "1,044 reports", level: "l3" },
  { code: "BX", name: "Bronx", count: "792 reports", level: "l4" },
  { code: "SI", name: "Staten Island", count: "277 reports", level: "l1" },
];

export const monthlyReports = [
  { month: "Sep", totalHeight: 130, poorHeight: 46 },
  { month: "Oct", totalHeight: 155, poorHeight: 56 },
  { month: "Nov", totalHeight: 122, poorHeight: 42 },
  { month: "Dec", totalHeight: 104, poorHeight: 37 },
  { month: "Jan", totalHeight: 182, poorHeight: 74 },
  { month: "Feb", totalHeight: 248, poorHeight: 122 },
];

export const damageBreakdown = [
  { label: "Cracked base", percent: "28%", dotClass: styles.b1 },
  { label: "Missing cover", percent: "18%", dotClass: styles.b2 },
  { label: "Corrosion / rust", percent: "16%", dotClass: styles.b3 },
  { label: "Graffiti", percent: "11%", dotClass: styles.b4 },
  { label: "Physical impact damage", percent: "17%", dotClass: styles.b5 },
  { label: "Leaning / unstable", percent: "10%", dotClass: styles.b6 },
];
