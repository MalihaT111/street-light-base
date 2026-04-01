import { useEffect, useState } from "react";
import {
  fetchAnalyticsHeatmap,
  fetchAnalyticsSummary,
  fetchReportsAnalytics,
} from "../api";
import {
  createEmptyAnalyticsData,
  createEmptySummaryData,
  normalizeAnalyticsPayload,
  normalizeHeatmapPayload,
  normalizeSummaryPayload,
} from "../utils/analytics";

const INITIAL_RESOURCE = {
  data: null,
  loading: true,
  error: "",
};

export function useAnalyticsDashboard(filters) {
  const [summary, setSummary] = useState(INITIAL_RESOURCE);
  const [analytics, setAnalytics] = useState(INITIAL_RESOURCE);
  const [heatmap, setHeatmap] = useState(INITIAL_RESOURCE);

  useEffect(() => {
    const abortController = new AbortController();

    setSummary((current) => ({ ...current, loading: true, error: "" }));
    setAnalytics((current) => ({ ...current, loading: true, error: "" }));
    setHeatmap((current) => ({ ...current, loading: true, error: "" }));

    fetchAnalyticsSummary(filters, abortController.signal)
      .then((payload) => {
        setSummary({
          data: normalizeSummaryPayload(payload),
          loading: false,
          error: "",
        });
      })
      .catch((error) => {
        if (error.name === "AbortError") {
          return;
        }

        setSummary({
          data: createEmptySummaryData(),
          loading: false,
          error: error.message || "Unable to load summary metrics.",
        });
      });

    fetchReportsAnalytics(filters, abortController.signal)
      .then((payload) => {
        setAnalytics({
          data: normalizeAnalyticsPayload(payload),
          loading: false,
          error: "",
        });
      })
      .catch((error) => {
        if (error.name === "AbortError") {
          return;
        }

        setAnalytics({
          data: createEmptyAnalyticsData(),
          loading: false,
          error: error.message || "Unable to load chart analytics.",
        });
      });

    fetchAnalyticsHeatmap(filters, abortController.signal)
      .then((payload) => {
        setHeatmap({
          data: normalizeHeatmapPayload(payload),
          loading: false,
          error: "",
        });
      })
      .catch((error) => {
        if (error.name === "AbortError") {
          return;
        }

        setHeatmap({
          data: [],
          loading: false,
          error: error.message || "Unable to load heatmap analytics.",
        });
      });

    return () => abortController.abort();
  }, [filters]);

  return {
    summary: {
      data: summary.data ?? createEmptySummaryData(),
      loading: summary.loading,
      error: summary.error,
    },
    analytics: {
      data: analytics.data ?? createEmptyAnalyticsData(),
      loading: analytics.loading,
      error: analytics.error,
    },
    heatmap: {
      data: heatmap.data ?? [],
      loading: heatmap.loading,
      error: heatmap.error,
    },
    isLoading: summary.loading || analytics.loading || heatmap.loading,
  };
}
