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

export default function HeatmapChart({ data, apiUrl }) {
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
      center: [40.7128, -74.006],
      zoom: 11,
      zoomControl: true,
    });

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
      .heatLayer(seededPoints, {
        radius: 25,
        blur: 15,
        maxZoom: 17,
      })
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
    if (!heatLayerRef.current) {
      return;
    }

    const nextPoints = normalizeHeatmapResponse(data);

    // Update: reuse the same layer instance so the map stays mounted.
    heatLayerRef.current.setLatLngs(nextPoints);
    setPointCount(nextPoints.length);
  }, [data]);

  useEffect(() => {
    if (!apiUrl || !heatLayerRef.current) {
      return undefined;
    }

    let isMounted = true;

    // Fetch: refresh point data from the JSON endpoint without reinitializing the map.
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

        if (!isMounted || !heatLayerRef.current) {
          return;
        }

        const refreshedPoints = normalizeHeatmapResponse(payload);
        heatLayerRef.current.setLatLngs(refreshedPoints);
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
  }, [apiUrl]);

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
      ) : (
        <div className={styles.heatmapStatus}>
     
        </div>
      )}
    </div>
  );
}
