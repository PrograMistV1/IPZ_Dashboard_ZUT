import React, {useMemo, useState} from "react";
import {ChartGrid, findNearestIndex, generateXLabels, generateYTicks, useContainerDimensions,} from "./chartUtils";

export default function CurrencyLineChart({rates}) {
  const {containerRef, dimensions} = useContainerDimensions();
  const [hoveredPoint, setHoveredPoint] = useState(null);

  const points = useMemo(() => {
    return rates.map((r) => ({
      date: r.date,
      value: Number(r.rate),
    }));
  }, [rates]);

  if (points.length < 2) {
    return <div ref={containerRef} style={{width: "100%", height: "100%"}}/>;
  }

  const {width, height} = dimensions;
  const padding = {left: 55, right: 15, top: 15, bottom: 30};
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const yMin = min - range * 0.05;
  const yMax = max + range * 0.05;
  const yRange = yMax - yMin;

  const scaleX = (i) => padding.left + (i / (points.length - 1)) * chartWidth;
  const scaleY = (v) => padding.top + chartHeight - ((v - yMin) / yRange) * chartHeight;

  const path = points.map((p, i) => `${scaleX(i)},${scaleY(p.value)}`).join(" ");

  const yTicks = generateYTicks(yMin, yRange, scaleY);
  const xLabels = generateXLabels(points, chartWidth, scaleX);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const {nearestIndex, minDist} = findNearestIndex(mouseX, points.length, scaleX);

    if (minDist < 50) {
      setHoveredPoint({
        index: nearestIndex,
        x: scaleX(nearestIndex),
        y: scaleY(points[nearestIndex].value),
        date: points[nearestIndex].date,
        value: points[nearestIndex].value,
      });
    } else {
      setHoveredPoint(null);
    }
  };

  return (
      <div ref={containerRef} style={{width: "100%", height: "100%"}}>
        <svg
            width={width}
            height={height}
            style={{display: "block"}}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setHoveredPoint(null)}
        >
          <ChartGrid
              width={width}
              height={height}
              padding={padding}
              yTicks={yTicks}
              xLabels={xLabels}
              chartWidth={chartWidth}
              chartHeight={chartHeight}
          />

          {/* Line */}
          <polyline
              points={path}
              fill="none"
              stroke="#2563eb"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
          />

          {/* Points */}
          {points.length <= 30 && points.map((p, i) => (
              <circle
                  key={i}
                  cx={scaleX(i)}
                  cy={scaleY(p.value)}
                  r="3"
                  fill="#2563eb"
              />
          ))}

          {/* Hover indicator */}
          {hoveredPoint && (
              <g>
                <line
                    x1={hoveredPoint.x}
                    y1={padding.top}
                    x2={hoveredPoint.x}
                    y2={padding.top + chartHeight}
                    stroke="#2563eb"
                    strokeWidth="1"
                    strokeDasharray="4,4"
                />
                <circle
                    cx={hoveredPoint.x}
                    cy={hoveredPoint.y}
                    r="6"
                    fill="#2563eb"
                    stroke="#fff"
                    strokeWidth="2"
                />
                <rect
                    x={hoveredPoint.x - 50}
                    y={hoveredPoint.y - 45}
                    width="100"
                    height="36"
                    fill="rgba(0,0,0,0.8)"
                    rx="4"
                />
                <text
                    x={hoveredPoint.x}
                    y={hoveredPoint.y - 30}
                    textAnchor="middle"
                    fontSize="10"
                    fill="#aaa"
                >
                  {hoveredPoint.date}
                </text>
                <text
                    x={hoveredPoint.x}
                    y={hoveredPoint.y - 16}
                    textAnchor="middle"
                    fontSize="12"
                    fontWeight="bold"
                    fill="#fff"
                >
                  {hoveredPoint.value.toFixed(4)}
                </text>
              </g>
          )}
        </svg>
      </div>
  );
}
