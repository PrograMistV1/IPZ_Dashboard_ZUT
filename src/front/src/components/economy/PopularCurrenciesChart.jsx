import React, { useEffect, useMemo, useState } from "react";

const COLORS = ["#2563eb", "#f97316", "#10b981", "#ef4444", "#a78bfa"];

async function fetchRates(currency, from, to) {
  const res = await fetch("http://127.0.0.1:8000/rates", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ currency, date_from: from, date_to: to }),
  });
  if (!res.ok) throw new Error("Failed to load rates");
  const data = await res.json();
  return data.rates || [];
}

export default function PopularCurrenciesChart({ currencies = ["USD", "EUR", "GBP"], days: daysProp = 30, highlight }) {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [days, setDays] = useState(daysProp);
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  // helper to trigger load based on from/to or days
  const loadForRange = async (from, to) => {
    setLoading(true);
    setError(null);
    try {
      const promises = currencies.map((c) => fetchRates(c, from, to).catch((e) => []));
      const results = await Promise.all(promises);
      const map = {};
      currencies.forEach((c, i) => {
        map[c] = results[i].map((r) => ({ date: r.date, value: Number(r.rate) }));
      });
      setData(map);
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - (days - 1));
      const from = start.toISOString().slice(0, 10);
      const to = end.toISOString().slice(0, 10);
      if (!mounted) return;
      await loadForRange(from, to);
    };
    load();
    return () => (mounted = false);
  }, [currencies.join(","), days]);

  const chart = useMemo(() => {
    const allDatesSet = new Set();
    Object.values(data || {}).forEach((arr) => arr.forEach((p) => allDatesSet.add(p.date)));
    const dates = Array.from(allDatesSet).sort();
    if (!dates.length) return null;

    // build a matrix of values per currency, fill gaps with null
    const series = Object.keys(data).map((k) => ({
      name: k,
      points: dates.map((d) => {
        const found = (data[k] || []).find((p) => p.date === d);
        return found ? found.value : null;
      }),
    }));

    // compute min/max across all values
    const values = series.flatMap((s) => s.points.filter((v) => v != null));
    if (!values.length) return null;
    const min = Math.min(...values);
    const max = Math.max(...values);

    const width = 700;
    const height = 360;
    const padding = 48; // more space for y-axis labels

    const x = (i) => padding + (i / (dates.length - 1)) * (width - padding * 2 || 1);
    const y = (v) => height - padding - ((v - min) / (max - min || 1)) * (height - padding * 2);

    const paths = series.map((s, idx) => {
      const pts = s.points
        .map((v, i) => (v == null ? null : `${x(i)},${y(v)}`))
        .filter(Boolean);
      return { name: s.name, d: pts.join(" "), color: COLORS[idx % COLORS.length] };
    });

    // compute y axis ticks (5 ticks)
    const ticks = 5;
    const yTicks = [];
    for (let t = 0; t <= ticks; t++) {
      const val = min + (t / ticks) * (max - min);
      yTicks.push(val);
    }

    return { width, height, padding, dates, series, paths, yTicks, min, max };
  }, [data]);

  if (loading) return <div className="chart-box">Loading chart…</div>;
  if (error) return <div className="chart-box">Error: {error}</div>;
  if (!chart) return <div className="chart-box">No data</div>;

  const today = new Date().toISOString().slice(0, 10);

  const applyCustomRange = () => {
    if (!customFrom || !customTo) return;
    loadForRange(customFrom, customTo);
  };

  return (
    <div className="popular-chart">
      <div className="chart-controls" style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 8 }}>
        <button onClick={() => setDays(7)}>Last 7d</button>
        <button onClick={() => setDays(30)}>Last 30d</button>
        <button onClick={() => setDays(90)}>Last 90d</button>
        <button onClick={() => setDays(180)}>Last 180d</button>
        <label style={{ display: "flex", gap: 6, alignItems: "center" }}>
          From <input type="date" value={customFrom} max={today} onChange={(e) => setCustomFrom(e.target.value)} />
        </label>
        <label style={{ display: "flex", gap: 6, alignItems: "center" }}>
          To <input type="date" value={customTo} max={today} onChange={(e) => setCustomTo(e.target.value)} />
        </label>
        <button onClick={applyCustomRange}>Apply</button>
      </div>

      <svg viewBox={`0 0 ${chart.width} ${chart.height}`} preserveAspectRatio="xMidYMid meet">
        {/* grid and y axis labels */}
        {chart.yTicks.map((v, i) => {
          const py = chart.height - chart.padding - ((v - chart.min) / (chart.max - chart.min || 1)) * (chart.height - chart.padding * 2);
          return (
            <g key={`yt-${i}`}>
              <line x1={chart.padding} x2={chart.width - chart.padding} y1={py} y2={py} stroke="#e6e6e6" strokeWidth={1} />
              <text x={chart.padding - 8} y={py + 4} fontSize={12} textAnchor="end" fill="#333">{v.toFixed(4)}</text>
            </g>
          );
        })}

        {/* x axis labels (sparse) */}
        {chart.dates.map((d, i) => {
          const cx = chart.padding + (i / (chart.dates.length - 1)) * (chart.width - chart.padding * 2 || 1);
          const show = i % Math.ceil(Math.max(1, chart.dates.length / 8)) === 0;
          return show ? (
            <text key={`xd-${i}`} x={cx} y={chart.height - chart.padding + 16} fontSize={10} textAnchor="middle" fill="#333">
              {d}
            </text>
          ) : null;
        })}

        {chart.paths.map((p) => (
          <polyline key={p.name} points={p.d} fill="none" stroke={p.name === highlight ? p.color : p.color + "66"} strokeWidth={p.name === highlight ? 3.5 : 1.8} />
        ))}
      </svg>

      <div className="legend">
        {chart.series.map((s, i) => (
          <div key={s.name} className="legend-item">
            <span className="legend-dot" style={{ background: COLORS[i % COLORS.length] }} />
            <span>{s.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
