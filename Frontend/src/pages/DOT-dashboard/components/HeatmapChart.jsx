import { useEffect, useRef, useState } from "react";
import styles from "../Dashboard.module.css";

function normalizeHeatPoint(item) {
  const lat = Number(item?.lat ?? item?.latitude);
  const lng = Number(item?.lng ?? item?.longitude);
  const intensity = Number(item?.value ?? item?.count ?? item?.intensity ?? 0);

  if (!Number.isFinite(lat) || !Number.isFinite(lng) || intensity <= 0) {
    return null;
  }

  return [lat, lng, intensity];
}

function normalizeHeatmapResponse(payload) {
  const records = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.heatmap)
      ? payload.heatmap
      : [];

  return records.map(normalizeHeatPoint).filter(Boolean);
}

function getMaxIntensity(points) {
  if (!points?.length) return 1;
  const max = points.reduce((acc, point) => {
    const value = Number(point?.[2] ?? 0);
    return Number.isFinite(value) ? Math.max(acc, value) : acc;
  }, 0);
  return max > 0 ? max : 1;
}

function getHeatmapGradient(selectedRating) {
  switch (selectedRating) {
    case "good":
      return {
        0.0: "rgba(34, 197, 94, 0)",
        0.25: "#86efac",
        0.5: "#22c55e",
        0.75: "#16a34a",
        1.0: "#065f46",
      };

    case "fair":
      return {
        0.0: "rgba(250, 204, 21, 0)",
        0.25: "#fde047",
        0.5: "#facc15",
        0.75: "#f59e0b",
        1.0: "#b45309",
      };

    case "poor":
      return {
        0.0: "rgba(239, 68, 68, 0)",
        0.25: "#fca5a5",
        0.5: "#ef4444",
        0.75: "#dc2626",
        1.0: "#7f1d1d",
      };

    default:
      return {
        0.0: "rgba(59, 130, 246, 0)",
        0.2: "#60a5fa",
        0.45: "#2563eb",
        0.7: "#0f766e",
        0.85: "#f97316",
        1.0: "#dc2626",
      };
  }
}

function getHeatLayerOptions({ points, selectedRating }) {
  return {
    radius: 28,
    blur: 18,
    maxZoom: 17,
    // Ensures the plugin scales intensities to visible color stops.
    max: getMaxIntensity(points),
    // Pushes low densities above “barely visible grey”.
    minOpacity: 0.22,
    maxOpacity: 0.9,
    gradient: getHeatmapGradient(selectedRating),
  };
}
export default function HeatmapChart({ data, apiUrl, selectedRating = "all" }) {
  const mapNodeRef = useRef(null);
  const mapRef = useRef(null);
  const heatLayerRef = useRef(null);
  const refreshTimerRef = useRef(null);
  const [refreshError, setRefreshError] = useState("");
  const [pointCount, setPointCount] = useState(0);

  useEffect(() => {
    const leaflet = window.L;

    if (!mapNodeRef.current || !leaflet || mapRef.current) {
      return undefined;
    }

    const seededPoints = normalizeHeatmapResponse(data);

    // Init: create the Leaflet map and NYC tile layers once.
    const map = leaflet.map(mapNodeRef.current, {
      // center: [40.7128, -74.006],
      // zoom: 11,
      // zoomControl: true,
      zoomControl: true,
      minZoom: 9.4,
      maxZoom: 17,
      maxBoundsViscosity: 1.0,
    });

    const nycBounds = leaflet.latLngBounds(
      [40.4774, -74.2591],
      [40.9176, -73.7004]
    );
    
    map.setMaxBounds(nycBounds);
    map.fitBounds(nycBounds);
    mapRef.current = map;

    leaflet
      .tileLayer(
        "https://maps{s}.nyc.gov/xyz/1.0.0/carto/basemap/{z}/{x}/{y}.jpg",
        {
          attribution: "&copy; City of New York",
          maxZoom: 20,
          subdomains: "1234",
        }
      )
      .addTo(map);

    map.createPane("labels");
    map.getPane("labels").style.zIndex = "650";
    map.getPane("labels").style.pointerEvents = "none";

    // Init: create the heat layer once and keep it for live updates.
    heatLayerRef.current = leaflet
      .heatLayer(seededPoints, getHeatLayerOptions({ points: seededPoints, selectedRating }))
      .addTo(map);
    setPointCount(seededPoints.length);

    leaflet
      .tileLayer(
        "https://maps{s}.nyc.gov/xyz/1.0.0/carto/label/{z}/{x}/{y}.png8",
        {
          maxZoom: 20,
          pane: "labels",
          subdomains: "1234",
        }
      )
      .addTo(map);

      setTimeout(() => {
        map.invalidateSize();
      }, 0);

    return () => {
      if (refreshTimerRef.current) {
        window.clearInterval(refreshTimerRef.current);
      }

      map.remove();
      mapRef.current = null;
      heatLayerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;
  
    const nextPoints = normalizeHeatmapResponse(data);
  
    // remove old heat layer
    if (heatLayerRef.current) {
      mapRef.current.removeLayer(heatLayerRef.current);
    }
  
    // create new one with updated gradient
    heatLayerRef.current = window.L
      .heatLayer(nextPoints, getHeatLayerOptions({ points: nextPoints, selectedRating }))
      .addTo(mapRef.current);
  
    setPointCount(nextPoints.length);
  }, [data, selectedRating]);

  useEffect(() => {
    if (!apiUrl || !mapRef.current) {
      return undefined;
    }
  
    let isMounted = true;
  
    async function refreshHeatmap(url) {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const payload = await response.json();
  
        if (!response.ok || payload?.success === false) {
          throw new Error(
            payload?.error || `Heatmap refresh failed with status ${response.status}`
          );
        }
  
        if (!isMounted || !mapRef.current) {
          return;
        }
  
        const refreshedPoints = normalizeHeatmapResponse(payload);
  
        if (heatLayerRef.current) {
          mapRef.current.removeLayer(heatLayerRef.current);
        }
  
        heatLayerRef.current = window.L
          .heatLayer(
            refreshedPoints,
            getHeatLayerOptions({ points: refreshedPoints, selectedRating })
          )
          .addTo(mapRef.current);
  
        setPointCount(refreshedPoints.length);
        setRefreshError("");
      } catch (error) {
        if (isMounted) {
          setRefreshError(error.message || "Unable to refresh heatmap.");
        }
      }
    }
  
    refreshHeatmap(apiUrl);
  
    refreshTimerRef.current = window.setInterval(() => {
      refreshHeatmap(apiUrl);
    }, 30000);
  
    return () => {
      isMounted = false;
  
      if (refreshTimerRef.current) {
        window.clearInterval(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
    };
  }, [apiUrl, selectedRating]);

  return (
    <div className={styles.heatmapRoot}>
      <div
        ref={mapNodeRef}
        className={styles.heatmapMap}
        role="img"
        aria-label="NYC streetlight damage density heatmap"
      />
      {!pointCount ? (
        <div className={styles.heatmapOverlay}>
          No geographic density data is available for the selected filters.
        </div>
      ) : null}
      {refreshError ? (
        <div className={styles.heatmapStatus}>{refreshError}</div>
      ) : null}
    </div>
  );
}
