import React, { useMemo, useState } from "react";

function LineChart({ data, width = 600, height = 200, stroke = "#0074D9" }) {
  const padding = 30;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const points = data.map((v, i) => {
    const x = padding + (i / (data.length - 1)) * (width - padding * 2);
    const y = padding + ((max - v) / (max - min || 1)) * (height - padding * 2);
    return `${x},${y}`;
  });

  const path = `M ${points.join(" L ")}`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <rect x="0" y="0" width={width} height={height} fill="#fafafa" stroke="#eee" />
      <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#ccc" />
      <path d={path} fill="none" stroke={stroke} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {data.map((v, i) => {
        const [x, y] = points[i].split(",").map(Number);
        return <circle key={i} cx={x} cy={y} r={3} fill={stroke} />;
      })}
    </svg>
  );
}

export default function DashboardChart() {
  const samples = useMemo(
    () => ({
      EUR: [4.2, 4.18, 4.15, 4.17, 4.25, 4.3, 4.28, 4.27, 4.22, 4.19],
      USD: [3.8, 3.82, 3.85, 3.9, 3.88, 3.92, 3.95, 3.94, 3.9, 3.87],
      GBP: [4.9, 4.88, 4.85, 4.9, 4.92, 4.95, 4.93, 4.9, 4.89, 4.87],
    }),
    []
  );

  const [currency, setCurrency] = useState("EUR");

  const data = samples[currency] || samples.EUR;

  const containerStyle = { fontFamily: "Inter, Arial, sans-serif", padding: 20, color: "#333" };
  const headerStyle = { display: "flex", justifyContent: "space-between", alignItems: "center" };
  const footerStyle = { marginTop: 20, color: "#888", fontSize: 12 };

  return (
    <div style={containerStyle}>
      <header style={headerStyle}>
        <h2 style={{ margin: 0 }}>Currency Price Chart</h2>
        <div>
          <label style={{ marginRight: 8 }}>Select currency:</label>
          <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
            {Object.keys(samples).map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </header>

      <section style={{ marginTop: 16 }}>
        <LineChart data={data} width={700} height={260} />
        <div style={{ marginTop: 8, color: "#666" }}>
          Current price ({currency}): <strong>{data[data.length - 1].toFixed(2)}</strong>
        </div>
      </section>

      <footer style={footerStyle}>Sample data — chart mockup.</footer>
    </div>
  );
}
