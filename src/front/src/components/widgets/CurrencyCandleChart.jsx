import React, {useEffect, useMemo, useRef, useState} from "react";

export default function CurrencyCandleChart({ rates }) {
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({width: 400, height: 180});
  const [hoveredCandle, setHoveredCandle] = useState(null);

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

  const candles = useMemo(() => {
    return rates.map((r, i, arr) => {
      const prev = arr[i - 1]?.rate ?? r.rate;
      return {
        date: r.date,
        open: prev,
        close: r.rate,
        high: Math.max(prev, r.rate) * 1.002,
        low: Math.min(prev, r.rate) * 0.998,
      };
    });
  }, [rates]);

  if (candles.length < 2) {
    return <div ref={containerRef} style={{width: "100%", height: "100%"}}/>;
  }

  const {width, height} = dimensions;
  const paddingLeft = 55;
  const paddingRight = 15;
  const paddingTop = 15;
  const paddingBottom = 30;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const all = candles.flatMap((c) => [c.high, c.low]);
  const min = Math.min(...all);
  const max = Math.max(...all);
  const range = max - min || 1;

  const yMin = min - range * 0.05;
  const yMax = max + range * 0.05;
  const yRange = yMax - yMin;

  const candleWidth = Math.min(12, Math.max(2, (chartWidth / candles.length) * 0.6));
  const candleSpacing = chartWidth / candles.length;

  const scaleX = (i) => paddingLeft + candleSpacing * (i + 0.5);
  const scaleY = (v) => paddingTop + chartHeight - ((v - yMin) / yRange) * chartHeight;

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
  const labelStep = Math.max(1, Math.ceil(candles.length / maxLabels));
  for (let i = 0; i < candles.length; i += labelStep) {
    xLabels.push({
      x: scaleX(i),
      label: candles[i].date.slice(5),
    });
  }

  // Handle mouse move to find nearest candle
  const handleMouseMove = (e) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;

    // Find nearest candle
    let nearestIndex = 0;
    let minDist = Infinity;
    for (let i = 0; i < candles.length; i++) {
      const dist = Math.abs(scaleX(i) - mouseX);
      if (dist < minDist) {
        minDist = dist;
        nearestIndex = i;
      }
    }

    if (minDist < candleSpacing) {
      const candle = candles[nearestIndex];
      setHoveredCandle({
        index: nearestIndex,
        x: scaleX(nearestIndex),
        y: scaleY(candle.close),
        date: candle.date,
        open: candle.open,
        close: candle.close,
        high: candle.high,
        low: candle.low,
      });
    } else {
      setHoveredCandle(null);
    }
  };

  const handleMouseLeave = () => {
    setHoveredCandle(null);
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

          {/* Candles */}
          {candles.map((c, i) => {
            const x = scaleX(i);
            const color = c.close >= c.open ? "#22c55e" : "#ef4444";
            const isHovered = hoveredCandle?.index === i;

            return (
                <g key={i}>
                  <line
                      x1={x}
                      x2={x}
                      y1={scaleY(c.high)}
                      y2={scaleY(c.low)}
                      stroke={color}
                      strokeWidth={isHovered ? "2" : "1"}
                  />
                  <rect
                      x={x - candleWidth / 2}
                      y={scaleY(Math.max(c.open, c.close))}
                      width={candleWidth}
                      height={Math.max(Math.abs(scaleY(c.open) - scaleY(c.close)), 2)}
                      fill={color}
                      stroke={isHovered ? "#000" : "none"}
                      strokeWidth="1"
                      rx="1"
                  />
                </g>
            );
          })}

          {/* Hover tooltip */}
          {hoveredCandle && (
              <g>
                {/* Vertical line */}
                <line
                    x1={hoveredCandle.x}
                    y1={paddingTop}
                    x2={hoveredCandle.x}
                    y2={paddingTop + chartHeight}
                    stroke="#666"
                    strokeWidth="1"
                    strokeDasharray="4,4"
                />
                {/* Tooltip background */}
                <rect
                    x={hoveredCandle.x - 55}
                    y={Math.max(paddingTop, hoveredCandle.y - 55)}
                    width="110"
                    height="48"
                    fill="rgba(0,0,0,0.85)"
                    rx="4"
                />
                {/* Date */}
                <text
                    x={hoveredCandle.x}
                    y={Math.max(paddingTop, hoveredCandle.y - 55) + 14}
                    textAnchor="middle"
                    fontSize="10"
                    fill="#aaa"
                >
                  {hoveredCandle.date}
                </text>
                {/* Open/Close */}
                <text
                    x={hoveredCandle.x}
                    y={Math.max(paddingTop, hoveredCandle.y - 55) + 28}
                    textAnchor="middle"
                    fontSize="10"
                    fill="#fff"
                >
                  O: {hoveredCandle.open.toFixed(4)}
                </text>
                <text
                    x={hoveredCandle.x}
                    y={Math.max(paddingTop, hoveredCandle.y - 55) + 42}
                    textAnchor="middle"
                    fontSize="10"
                    fontWeight="bold"
                    fill={hoveredCandle.close >= hoveredCandle.open ? "#22c55e" : "#ef4444"}
                >
                  C: {hoveredCandle.close.toFixed(4)}
                </text>
              </g>
          )}
        </svg>
      </div>
  );
}
