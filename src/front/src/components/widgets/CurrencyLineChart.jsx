import React, { useMemo } from "react";

export default function CurrencyLineChart({ rates }) {
  const points = useMemo(() => {
    return rates.map((r) => ({
      date: r.date,
      value: Number(r.rate),
    }));
  }, [rates]);

  if (points.length < 2) return null;

  const width = 300;
  const height = 160;
  const padding = 30;

  const values = points.map(p => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);

  const scaleX = (i) =>
    padding + (i / (points.length - 1)) * (width - padding * 2);

  const scaleY = (v) =>
    height - padding -
    ((v - min) / (max - min || 1)) * (height - padding * 2);

  const path = points
    .map((p, i) => `${scaleX(i)},${scaleY(p.value)}`)
    .join(" ");

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
      <polyline
        points={path}
        fill="none"
        stroke="var(--accent-2, #2563eb)"
        strokeWidth="2"
      />
    </svg>
  );
}
