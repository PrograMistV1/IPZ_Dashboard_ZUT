import React, { useMemo } from "react";

export default function CurrencyLineChart({ rates }) {
  const points = useMemo(() => {
    return rates.map((r) => ({
      date: r.date,
      value: Number(r.rate),
    }));
  }, [rates]);

  if (points.length < 2) return null;

  const width = 600;
  const height = 180;
  const padding = 40;

  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);

  const scaleX = (i) => padding + (i / (points.length - 1)) * (width - padding * 2);
  const scaleY = (v) => height - padding - ((v - min) / (max - min || 1)) * (height - padding * 2);

  const path = points.map((p, i) => `${scaleX(i)},${scaleY(p.value)}`).join(" ");

  // y-axis ticks
  const ticks = 4;
  const tickVals = Array.from({ length: ticks + 1 }).map((_, i) => min + ((max - min) * i) / ticks);

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
      {/* Y axis */}
      <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#ccc" />
      {tickVals.map((tv, idx) => {
        const y = scaleY(tv);
        return (
          <g key={idx}>
            <line x1={padding - 6} x2={padding} y1={y} y2={y} stroke="#ccc" />
            <text x={padding - 10} y={y + 4} fontSize={10} textAnchor="end">{tv.toFixed(4)}</text>
          </g>
        );
      })}

      <polyline points={path} fill="none" stroke="var(--accent-2, #2563eb)" strokeWidth="2" />

      {points.map((p, i) => (
        <circle key={i} cx={scaleX(i)} cy={scaleY(p.value)} r={3} fill="#2563eb" />
      ))}
    </svg>
  );
}
