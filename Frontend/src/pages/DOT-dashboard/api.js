import Cookies from "js-cookie";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "";

function appendParam(params, key, value) {
  if (Array.isArray(value)) {
    value
      .filter((item) => item !== null && item !== undefined && item !== "")
      .forEach((item) => params.append(key, item));
    return;
  }

  if (value !== null && value !== undefined && value !== "") {
    params.set(key, value);
  }
}

export function buildAnalyticsQueryString(filters = {}) {
  const params = new URLSearchParams();

  appendParam(params, "borough", filters.borough);
  appendParam(params, "rating", filters.rating);
  appendParam(params, "start_date", filters.startDate);
  appendParam(params, "end_date", filters.endDate);

  const query = params.toString();
  return query ? `?${query}` : "";
}

async function fetchJson(path, filters = {}, signal) {
  const query = buildAnalyticsQueryString(filters);
  const token = Cookies.get("token");

  const response = await fetch(`${API_BASE_URL}${path}${query}`, {
    signal,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  let payload = {};

  try {
    payload = await response.json();
  } catch (error) {
    payload = {};
  }

  if (!response.ok || payload.success === false) {
    const message =
      payload.error || `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return payload;
}

export function fetchAnalyticsSummary(filters = {}, signal) {
  return fetchJson("/api/analytics/summary", filters, signal);
}

export function fetchReportsAnalytics(filters = {}, signal) {
  return fetchJson("/api/reports/analytics", filters, signal);
}

export function fetchAnalyticsHeatmap(filters = {}, signal) {
  return fetchJson("/api/reports/analytics/heatmap", filters, signal);
}

export function getAnalyticsHeatmapUrl(filters = {}) {
  const query = buildAnalyticsQueryString(filters);
  return `${API_BASE_URL}/api/reports/analytics/heatmap${query}`;
}
