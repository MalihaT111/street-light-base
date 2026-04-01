const RATING_DISPLAY_ORDER = ["good", "fair", "poor"];

export function safeNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function formatCount(value) {
  return safeNumber(value).toLocaleString();
}

export function formatMonthLabel(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatLongDate(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return "Unknown date";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function formatDamageTypeLabel(damageType) {
  if (!damageType || typeof damageType !== "string") {
    return "Unspecified";
  }

  const knownLabels = {
    cracked_base: "Cracked base",
    missing_cover: "Missing cover",
    corrosion_rust: "Corrosion / rust",
    graffiti: "Graffiti",
    physical_impact_damage: "Physical impact damage",
    leaning_unstable: "Leaning / unstable",
  };

  if (knownLabels[damageType]) {
    return knownLabels[damageType];
  }

  return damageType
    .split("_")
    .join(" ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function calculateMonthOverMonthChange(currentMonthReports, lastMonthReports) {
  const current = safeNumber(currentMonthReports);
  const previous = safeNumber(lastMonthReports);

  if (previous <= 0) {
    return null;
  }

  return ((current - previous) / previous) * 100;
}

export function createEmptySummaryData() {
  return {
    totalReports: 0,
    currentMonthReports: 0,
    lastMonthReports: 0,
  };
}

export function createEmptyAnalyticsData() {
  return {
    countsByRating: [],
    countsByBorough: [],
    reportsOverTime: [],
    poorReportsOverTime: [],
    damageTypeCounts: [],
  };
}

export function normalizeSummaryPayload(payload) {
  return {
    totalReports: safeNumber(payload?.total_reports),
    currentMonthReports: safeNumber(payload?.current_month_reports),
    lastMonthReports: safeNumber(payload?.last_month_reports),
  };
}

function normalizeCategoricalCount(item, labelKey, formatter = (value) => value) {
  const rawLabel = item?.[labelKey];

  if (!rawLabel || typeof rawLabel !== "string") {
    return null;
  }

  return {
    label: formatter(rawLabel),
    rawLabel,
    value: safeNumber(item?.count),
  };
}

function normalizeTimePoint(item) {
  const bucket = item?.bucket ? new Date(item.bucket) : null;

  if (!(bucket instanceof Date) || Number.isNaN(bucket?.getTime?.())) {
    return null;
  }

  return {
    date: bucket,
    value: safeNumber(item?.count),
  };
}

export function normalizeAnalyticsPayload(payload) {
  const analytics = payload?.analytics ?? {};

  const countsByRating = (Array.isArray(analytics.counts_by_rating)
    ? analytics.counts_by_rating
    : []
  )
    .map((item) =>
      normalizeCategoricalCount(item, "rating", (rating) => rating.toLowerCase())
    )
    .filter(Boolean)
    .sort((left, right) => {
      const leftIndex = RATING_DISPLAY_ORDER.indexOf(left.label);
      const rightIndex = RATING_DISPLAY_ORDER.indexOf(right.label);

      if (leftIndex === -1 && rightIndex === -1) {
        return left.label.localeCompare(right.label);
      }

      if (leftIndex === -1) {
        return 1;
      }

      if (rightIndex === -1) {
        return -1;
      }

      return leftIndex - rightIndex;
    })
    .map((item) => ({
      ...item,
      label: item.label.charAt(0).toUpperCase() + item.label.slice(1),
    }));

  const countsByBorough = (Array.isArray(analytics.counts_by_borough)
    ? analytics.counts_by_borough
    : []
  )
    .map((item) => normalizeCategoricalCount(item, "borough"))
    .filter(Boolean);

  const reportsOverTime = (Array.isArray(analytics.reports_over_time)
    ? analytics.reports_over_time
    : []
  )
    .map(normalizeTimePoint)
    .filter(Boolean)
    .sort((left, right) => left.date - right.date);

  const poorReportsOverTime = (Array.isArray(analytics.poor_reports_over_time)
    ? analytics.poor_reports_over_time
    : []
  )
    .map(normalizeTimePoint)
    .filter(Boolean)
    .sort((left, right) => left.date - right.date);

  const damageTypeCounts = (Array.isArray(analytics.damage_type_counts)
    ? analytics.damage_type_counts
    : []
  )
    .map((item) =>
      normalizeCategoricalCount(item, "damage_type", formatDamageTypeLabel)
    )
    .filter(Boolean);

  return {
    countsByRating,
    countsByBorough,
    reportsOverTime,
    poorReportsOverTime,
    damageTypeCounts,
  };
}

export function normalizeHeatmapPayload(payload) {
  const items = Array.isArray(payload?.heatmap) ? payload.heatmap : [];

  return items
    .map((item) => {
      const latitude = Number(item?.latitude);
      const longitude = Number(item?.longitude);
      const count = safeNumber(item?.count);

      if (
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude) ||
        count <= 0
      ) {
        return null;
      }

      return {
        latitude,
        longitude,
        count,
      };
    })
    .filter(Boolean);
}

export function buildSummaryCards(summary) {
  const monthOverMonthChange = calculateMonthOverMonthChange(
    summary.currentMonthReports,
    summary.lastMonthReports
  );

  const monthOverMonthText =
    monthOverMonthChange === null
      ? "Month-over-month change unavailable"
      : `${monthOverMonthChange >= 0 ? "+" : ""}${monthOverMonthChange.toFixed(1)}% vs last month`;

  return [
    {
      label: "Total reports",
      value: formatCount(summary.totalReports),
      description: "All streetlight base reports in the system.",
    },
    {
      label: "Current month",
      value: formatCount(summary.currentMonthReports),
      description: monthOverMonthText,
    },
    {
      label: "Last month",
      value: formatCount(summary.lastMonthReports),
      description: "Reports received in the previous calendar month.",
    },
  ];
}

export function formatAppliedFilters(filters) {
  const parts = [];

  if (Array.isArray(filters?.borough) && filters.borough.length) {
    parts.push(`${filters.borough.join(", ")} boroughs`);
  }

  if (Array.isArray(filters?.rating) && filters.rating.length) {
    parts.push(`${filters.rating.join(", ")} ratings`);
  }

  if (filters?.startDate || filters?.endDate) {
    parts.push(
      `${filters.startDate || "Any start"} to ${filters.endDate || "Any end"}`
    );
  }

  return parts.length ? parts.join(" | ") : "All boroughs, all ratings, full date range";
}
