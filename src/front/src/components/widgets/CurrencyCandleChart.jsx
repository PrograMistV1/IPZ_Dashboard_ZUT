import React, {useMemo, useState} from "react";
import {ChartGrid, findNearestIndex, generateXLabels, generateYTicks, useContainerDimensions,} from "./chartUtils";

export default function CurrencyCandleChart({rates}) {
  const {containerRef, dimensions} = useContainerDimensions();
  const [hoveredCandle, setHoveredCandle] = useState(null);

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
  const padding = {left: 55, right: 15, top: 15, bottom: 30};
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const all = candles.flatMap((c) => [c.high, c.low]);
  const min = Math.min(...all);
  const max = Math.max(...all);
  const range = max - min || 1;

  const yMin = min - range * 0.05;
  const yMax = max + range * 0.05;
  const yRange = yMax - yMin;

  const candleWidth = Math.min(12, Math.max(2, (chartWidth / candles.length) * 0.6));
  const candleSpacing = chartWidth / candles.length;

  const scaleX = (i) => padding.left + candleSpacing * (i + 0.5);
  const scaleY = (v) => padding.top + chartHeight - ((v - yMin) / yRange) * chartHeight;

  const yTicks = generateYTicks(yMin, yRange, scaleY);
  const xLabels = generateXLabels(candles, chartWidth, scaleX);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const {nearestIndex, minDist} = findNearestIndex(mouseX, candles.length, scaleX);

    if (minDist < candleSpacing) {
      const candle = candles[nearestIndex];
      setHoveredCandle({
        index: nearestIndex,
        x: scaleX(nearestIndex),
        y: scaleY(candle.close),
        ...candle,
      });
    } else {
      setHoveredCandle(null);
    }
  };

  return (
      <div ref={containerRef} style={{width: "100%", height: "100%"}}>
        <svg
            width={width}
            height={height}
            style={{display: "block"}}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setHoveredCandle(null)}
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
                <line
                    x1={hoveredCandle.x}
                    y1={padding.top}
                    x2={hoveredCandle.x}
                    y2={padding.top + chartHeight}
                    stroke="#666"
                    strokeWidth="1"
                    strokeDasharray="4,4"
                />
                <rect
                    x={hoveredCandle.x - 55}
                    y={Math.max(padding.top, hoveredCandle.y - 55)}
                    width="110"
                    height="48"
                    fill="rgba(0,0,0,0.85)"
                    rx="4"
                />
                <text
                    x={hoveredCandle.x}
                    y={Math.max(padding.top, hoveredCandle.y - 55) + 14}
                    textAnchor="middle"
                    fontSize="10"
                    fill="#aaa"
                >
                  {hoveredCandle.date}
                </text>
                <text
                    x={hoveredCandle.x}
                    y={Math.max(padding.top, hoveredCandle.y - 55) + 28}
                    textAnchor="middle"
                    fontSize="10"
                    fill="#fff"
                >
                  O: {hoveredCandle.open.toFixed(4)}
                </text>
                <text
                    x={hoveredCandle.x}
                    y={Math.max(padding.top, hoveredCandle.y - 55) + 42}
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
