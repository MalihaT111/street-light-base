import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import styles from "../Dashboard.module.css";
import { useChartDimensions } from "../hooks/useChartDimensions";
import { formatCount, formatMonthLabel } from "../utils/analytics";

export default function LineChart({
  data,
  xAxisLabel,
  yAxisLabel,
  tooltipLabel,
  color,
  areaFill,
}) {
  const svgRef = useRef(null);
  const [tooltip, setTooltip] = useState(null);
  const { containerRef, dimensions } = useChartDimensions(320);

  useEffect(() => {
    if (!dimensions.width || !data.length) {
      return undefined;
    }

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const margin = { top: 20, right: 24, bottom: 64, left: 56 };
    const width = dimensions.width;
    const height = dimensions.height;
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    svg.attr("viewBox", `0 0 ${width} ${height}`);

    const root = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const xScale = d3
      .scaleTime()
      .domain(d3.extent(data, (item) => item.date))
      .range([0, innerWidth]);

    const yScale = d3
      .scaleLinear()
      .domain([0, d3.max(data, (item) => item.value) || 0])
      .nice()
      .range([innerHeight, 0]);

    root
      .append("g")
      .call(
        d3
          .axisLeft(yScale)
          .ticks(5)
          .tickFormat((value) => formatCount(value))
      )
      .call((axis) => axis.selectAll(".domain").remove())
      .call((axis) =>
        axis
          .selectAll(".tick line")
          .clone()
          .attr("x2", innerWidth)
          .attr("stroke", "#d7dde8")
      )
      .call((axis) => axis.selectAll(".tick text").attr("fill", "#475569"));

    root
      .append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(
        d3
          .axisBottom(xScale)
          .ticks(Math.min(data.length, 6))
          .tickFormat((value) => formatMonthLabel(value))
      )
      .call((axis) => axis.selectAll(".domain").attr("stroke", "#cbd5e1"))
      .call((axis) => axis.selectAll(".tick line").remove())
      .call((axis) => axis.selectAll(".tick text").attr("fill", "#475569"));

    root
      .append("text")
      .attr("class", styles.axisLabel)
      .attr("x", innerWidth / 2)
      .attr("y", innerHeight + margin.bottom - 12)
      .attr("text-anchor", "middle")
      .text(xAxisLabel);

    root
      .append("text")
      .attr("class", styles.axisLabel)
      .attr("transform", "rotate(-90)")
      .attr("x", -innerHeight / 2)
      .attr("y", -40)
      .attr("text-anchor", "middle")
      .text(yAxisLabel);

    if (areaFill) {
      const area = d3
        .area()
        .x((item) => xScale(item.date))
        .y0(innerHeight)
        .y1((item) => yScale(item.value))
        .curve(d3.curveMonotoneX);

      root
        .append("path")
        .datum(data)
        .attr("fill", areaFill)
        .attr("opacity", 0.55)
        .attr("d", area);
    }

    const line = d3
      .line()
      .x((item) => xScale(item.date))
      .y((item) => yScale(item.value))
      .curve(d3.curveMonotoneX);

    root
      .append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", color)
      .attr("stroke-width", 3)
      .attr("d", line);

    root
      .selectAll("circle")
      .data(data)
      .join("circle")
      .attr("cx", (item) => xScale(item.date))
      .attr("cy", (item) => yScale(item.value))
      .attr("r", 4.5)
      .attr("fill", color)
      .attr("stroke", "#ffffff")
      .attr("stroke-width", 2)
      .on("mouseenter mousemove", function handleMove(event, item) {
        const [x, y] = d3.pointer(event, svg.node());
        d3.select(this).attr("r", 6);
        setTooltip({
          x,
          y,
          title: formatMonthLabel(item.date),
          value: `${formatCount(item.value)} ${tooltipLabel}`,
        });
      })
      .on("mouseleave", function handleLeave() {
        d3.select(this).attr("r", 4.5);
        setTooltip(null);
      });

    return () => {
      svg.selectAll("*").remove();
    };
  }, [
    areaFill,
    color,
    data,
    dimensions.height,
    dimensions.width,
    tooltipLabel,
    xAxisLabel,
    yAxisLabel,
  ]);

  return (
    <div ref={containerRef} className={styles.chartRoot}>
      <svg ref={svgRef} className={styles.chartSvg} role="img" />
      {tooltip ? (
        <div
          className={styles.tooltip}
          style={{ left: tooltip.x + 14, top: tooltip.y - 18 }}
        >
          <strong>{tooltip.title}</strong>
          <span>{tooltip.value}</span>
        </div>
      ) : null}
    </div>
  );
}
