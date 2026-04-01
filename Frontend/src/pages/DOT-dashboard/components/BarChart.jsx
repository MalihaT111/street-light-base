import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import styles from "../Dashboard.module.css";
import { useChartDimensions } from "../hooks/useChartDimensions";
import { formatCount } from "../utils/analytics";

function wrapAxisText(selection, width) {
  selection.each(function wrap() {
    const text = d3.select(this);
    const words = text.text().split(/\s+/).reverse();
    const x = text.attr("x");
    const y = text.attr("y");
    const dy = parseFloat(text.attr("dy") || 0);

    let line = [];
    let lineNumber = 0;
    let tspan = text.text(null).append("tspan").attr("x", x).attr("y", y).attr("dy", `${dy}em`);
    let word = words.pop();

    while (word) {
      line.push(word);
      tspan.text(line.join(" "));

      if (tspan.node().getComputedTextLength() > width && line.length > 1) {
        line.pop();
        tspan.text(line.join(" "));
        line = [word];
        lineNumber += 1;
        tspan = text
          .append("tspan")
          .attr("x", x)
          .attr("y", y)
          .attr("dy", `${lineNumber + dy}em`)
          .text(word);
      }

      word = words.pop();
    }
  });
}

export default function BarChart({
  data,
  xAxisLabel,
  yAxisLabel,
  tooltipLabel,
  color,
  wrapTicks = false,
  displayOrder = [],
}) {
  const svgRef = useRef(null);
  const [tooltip, setTooltip] = useState(null);
  const { containerRef, dimensions } = useChartDimensions(wrapTicks ? 340 : 320);

  useEffect(() => {
    if (!dimensions.width || !data.length) {
      return undefined;
    }

    const orderedData = [...data].sort((left, right) => {
      if (!displayOrder.length) {
        return 0;
      }

      const leftIndex = displayOrder.indexOf(left.label.toLowerCase());
      const rightIndex = displayOrder.indexOf(right.label.toLowerCase());

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
    });

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const margin = {
      top: 20,
      right: 16,
      bottom: wrapTicks ? 104 : 64,
      left: 56,
    };
    const width = dimensions.width;
    const height = dimensions.height;
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    svg.attr("viewBox", `0 0 ${width} ${height}`);

    const root = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const xScale = d3
      .scaleBand()
      .domain(orderedData.map((item) => item.label))
      .range([0, innerWidth])
      .padding(0.28);

    const yScale = d3
      .scaleLinear()
      .domain([0, d3.max(orderedData, (item) => item.value) || 0])
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

    const xAxis = root
      .append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale))
      .call((axis) => axis.selectAll(".domain").attr("stroke", "#cbd5e1"))
      .call((axis) => axis.selectAll(".tick line").remove())
      .call((axis) => axis.selectAll(".tick text").attr("fill", "#475569"));

    if (wrapTicks) {
      xAxis.selectAll(".tick text").call(wrapAxisText, xScale.bandwidth());
    }

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

    root
      .selectAll("rect")
      .data(orderedData)
      .join("rect")
      .attr("x", (item) => xScale(item.label) ?? 0)
      .attr("width", xScale.bandwidth())
      .attr("y", (item) => yScale(item.value))
      .attr("height", (item) => innerHeight - yScale(item.value))
      .attr("rx", 10)
      .attr("fill", color)
      .on("mouseenter mousemove", function handleMove(event, item) {
        const [x, y] = d3.pointer(event, svg.node());
        d3.select(this).attr("opacity", 0.85);
        setTooltip({
          x,
          y,
          title: item.label,
          value: `${formatCount(item.value)} ${tooltipLabel}`,
        });
      })
      .on("mouseleave", function handleLeave() {
        d3.select(this).attr("opacity", 1);
        setTooltip(null);
      });

    return () => {
      svg.selectAll("*").remove();
    };
  }, [
    color,
    data,
    dimensions.height,
    dimensions.width,
    displayOrder,
    tooltipLabel,
    wrapTicks,
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
