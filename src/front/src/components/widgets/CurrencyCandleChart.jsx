import React, { useMemo } from "react";

export default function CurrencyCandleChart({ rates }) {
  const candles = useMemo(() => {
    return rates.map((r, i, arr) => {
      const prev = arr[i - 1]?.rate ?? r.rate;

      return {
        open: prev,
        close: r.rate,
        high: Math.max(prev, r.rate) * 1.002,
        low: Math.min(prev, r.rate) * 0.998,
      };
    });
  }, [rates]);

  if (candles.length < 2) return null;

  const width = 320;
  const height = 180;
  const padding = 20;

  const all = candles.flatMap(c => [c.high, c.low]);
  const min = Math.min(...all);
  const max = Math.max(...all);

  const scaleX = (i) =>
    padding + i * ((width - padding * 2) / candles.length);

  const scaleY = (v) =>
    height - padding -
    ((v - min) / (max - min || 1)) * (height - padding * 2);

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
      {candles.map((c, i) => {
        const x = scaleX(i);
        const color = c.close >= c.open ? "#346b66ff" : "#ea3f3cff";

        return (
          <g key={i}>
            {/* wick */}
            <line
              x1={x}
              x2={x}
              y1={scaleY(c.high)}
              y2={scaleY(c.low)}
              stroke={color}
              strokeWidth="1"
            />

            {/* body */}
            <rect
              x={x - 3}
              y={scaleY(Math.max(c.open, c.close))}
              width={6}
              height={Math.max(
                Math.abs(scaleY(c.open) - scaleY(c.close)),
                1
              )}
              fill={color}
            />
          </g>
        );
      })}
    </svg>
  );
}
