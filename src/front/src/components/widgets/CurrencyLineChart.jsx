import React, {useEffect, useMemo, useRef, useState} from "react";

export default function CurrencyLineChart({ rates }) {
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({width: 400, height: 180});
  const [hoveredPoint, setHoveredPoint] = useState(null);

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const {width, height} = containerRef.current.getBoundingClientRect();
        setDimensions({
          width: Math.max(200, width),
          height: Math.max(120, height),
        });
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

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
  const paddingLeft = 55;
  const paddingRight = 15;
  const paddingTop = 15;
  const paddingBottom = 30;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const yMin = min - range * 0.05;
  const yMax = max + range * 0.05;
  const yRange = yMax - yMin;

  const scaleX = (i) => paddingLeft + (i / (points.length - 1)) * chartWidth;
  const scaleY = (v) => paddingTop + chartHeight - ((v - yMin) / yRange) * chartHeight;

  const path = points
    .map((p, i) => `${scaleX(i)},${scaleY(p.value)}`)
    .join(" ");

  // Y-axis ticks
  const yTicks = [];
  const tickCount = 4;
  for (let i = 0; i <= tickCount; i++) {
    const value = yMin + (yRange * i) / tickCount;
    yTicks.push({
      y: scaleY(value),
      label: value.toFixed(4),
    });
  }

  // X-axis labels
  const xLabels = [];
  const maxLabels = Math.floor(chartWidth / 60);
  const labelStep = Math.max(1, Math.ceil(points.length / maxLabels));
  for (let i = 0; i < points.length; i += labelStep) {
    xLabels.push({
      x: scaleX(i),
      label: points[i].date.slice(5),
    });
  }

  // Handle mouse move to find nearest point
  const handleMouseMove = (e) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;

    // Find nearest point
    let nearestIndex = 0;
    let minDist = Infinity;
    for (let i = 0; i < points.length; i++) {
      const dist = Math.abs(scaleX(i) - mouseX);
      if (dist < minDist) {
        minDist = dist;
        nearestIndex = i;
      }
    }

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

  const handleMouseLeave = () => {
    setHoveredPoint(null);
  };

  return (
      <div ref={containerRef} style={{width: "100%", height: "100%"}}>
        <svg
            width={width}
            height={height}
            style={{display: "block"}}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
        >
          {/* Background */}
          <rect
              x={paddingLeft}
              y={paddingTop}
              width={chartWidth}
              height={chartHeight}
              fill="#f8f9fa"
          />

          {/* Grid lines and Y-axis labels */}
          {yTicks.map((tick, i) => (
              <g key={`y-${i}`}>
                <line
                    x1={paddingLeft}
                    y1={tick.y}
                    x2={paddingLeft + chartWidth}
                    y2={tick.y}
                    stroke="#e0e0e0"
                    strokeWidth="1"
                />
                <text
                    x={paddingLeft - 5}
                    y={tick.y}
                    textAnchor="end"
                    dominantBaseline="middle"
                    fontSize="10"
                    fill="#666"
                >
                  {tick.label}
                </text>
              </g>
          ))}

          {/* X-axis labels */}
          {xLabels.map((label, i) => (
              <g key={`x-${i}`}>
                <line
                    x1={label.x}
                    y1={paddingTop}
                    x2={label.x}
                    y2={paddingTop + chartHeight}
                    stroke="#eee"
                    strokeWidth="1"
                />
                <text
                    x={label.x}
                    y={height - paddingBottom + 15}
                    textAnchor="middle"
                    fontSize="9"
                    fill="#666"
                >
                  {label.label}
                </text>
              </g>
          ))}

          {/* Border */}
          <rect
              x={paddingLeft}
              y={paddingTop}
              width={chartWidth}
              height={chartHeight}
              fill="none"
              stroke="#ddd"
              strokeWidth="1"
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

          {/* Points (only show if few data points) */}
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
                {/* Vertical line */}
                <line
                    x1={hoveredPoint.x}
                    y1={paddingTop}
                    x2={hoveredPoint.x}
                    y2={paddingTop + chartHeight}
                    stroke="#2563eb"
                    strokeWidth="1"
                    strokeDasharray="4,4"
                />
                {/* Point highlight */}
                <circle
                    cx={hoveredPoint.x}
                    cy={hoveredPoint.y}
                    r="6"
                    fill="#2563eb"
                    stroke="#fff"
                    strokeWidth="2"
                />
                {/* Tooltip background */}
                <rect
                    x={hoveredPoint.x - 50}
                    y={hoveredPoint.y - 45}
                    width="100"
                    height="36"
                    fill="rgba(0,0,0,0.8)"
                    rx="4"
                />
                {/* Tooltip text - date */}
                <text
                    x={hoveredPoint.x}
                    y={hoveredPoint.y - 30}
                    textAnchor="middle"
                    fontSize="10"
                    fill="#aaa"
                >
                  {hoveredPoint.date}
                </text>
                {/* Tooltip text - value */}
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
