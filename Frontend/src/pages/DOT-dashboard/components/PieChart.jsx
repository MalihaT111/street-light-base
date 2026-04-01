import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import styles from "../Dashboard.module.css";
import { useChartDimensions } from "../hooks/useChartDimensions";
import { formatCount } from "../utils/analytics";

const PIE_COLORS = [
  "#0f766e",
  "#14b8a6",
  "#0ea5e9",
  "#6366f1",
  "#f97316",
  "#dc2626",
  "#84cc16",
  "#a855f7",
];

export default function PieChart({ data, tooltipLabel }) {
  const svgRef = useRef(null);
  const [tooltip, setTooltip] = useState(null);
  const { containerRef, dimensions } = useChartDimensions(320);

  useEffect(() => {
    if (!dimensions.width || !data.length) {
      return undefined;
    }

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = dimensions.width;
    const height = dimensions.height;
    const chartSize = Math.min(width, height);
    const radius = Math.max(chartSize / 2 - 24, 0);
    const innerRadius = radius * 0.52;
    const total = d3.sum(data, (item) => item.value);
    const pieData = d3
      .pie()
      .sort(null)
      .value((item) => item.value)(data);

    const arc = d3.arc().innerRadius(innerRadius).outerRadius(radius);
    const hoverArc = d3
      .arc()
      .innerRadius(innerRadius)
      .outerRadius(radius + 8);

    svg.attr("viewBox", `0 0 ${width} ${height}`);

    const root = svg
      .append("g")
      .attr("transform", `translate(${width / 2},${height / 2})`);

    root
      .append("text")
      .attr("text-anchor", "middle")
      .attr("y", -6)
      .attr("fill", "#0f172a")
      .attr("font-size", "1.7rem")
      .attr("font-weight", "700")
      .text(formatCount(total));

    root
      .append("text")
      .attr("text-anchor", "middle")
      .attr("y", 18)
      .attr("fill", "#64748b")
      .attr("font-size", "0.82rem")
      .text("total reports");

    root
      .selectAll("path")
      .data(pieData)
      .join("path")
      .attr("d", arc)
      .attr("fill", (_, index) => PIE_COLORS[index % PIE_COLORS.length])
      .attr("stroke", "#ffffff")
      .attr("stroke-width", 3)
      .style("cursor", "pointer")
      .on("mouseenter mousemove", function handleMove(event, item) {
        const [x, y] = d3.pointer(event, svg.node());
        const percent = total > 0 ? (item.data.value / total) * 100 : 0;

        d3.select(this).attr("d", hoverArc);
        setTooltip({
          x,
          y,
          title: item.data.label,
          value: `${formatCount(item.data.value)} ${tooltipLabel}`,
          secondary: `${percent.toFixed(1)}% of total`,
        });
      })
      .on("mouseleave", function handleLeave() {
        d3.select(this).attr("d", arc);
        setTooltip(null);
      });

    return () => {
      svg.selectAll("*").remove();
    };
  }, [data, dimensions.height, dimensions.width, tooltipLabel]);

  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className={styles.pieLayout}>
      <div ref={containerRef} className={styles.chartRoot}>
        <svg ref={svgRef} className={styles.chartSvg} role="img" />
        {tooltip ? (
          <div
            className={styles.tooltip}
            style={{ left: tooltip.x + 14, top: tooltip.y - 18 }}
          >
            <strong>{tooltip.title}</strong>
            <span>{tooltip.value}</span>
            <span>{tooltip.secondary}</span>
          </div>
        ) : null}
      </div>

      <div className={styles.pieLegend} aria-label="Damage type breakdown legend">
        {data.map((item, index) => {
          const percent = total > 0 ? (item.value / total) * 100 : 0;

          return (
            <div key={item.label} className={styles.pieLegendRow}>
              <div className={styles.pieLegendLabel}>
                <span
                  className={styles.pieLegendSwatch}
                  style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                  aria-hidden="true"
                />
                <span>{item.label}</span>
              </div>
              <div className={styles.pieLegendValue}>
                <strong>{formatCount(item.value)}</strong>
                <span>{percent.toFixed(1)}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
