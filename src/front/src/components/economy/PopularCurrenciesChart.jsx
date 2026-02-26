import React, { useEffect, useMemo, useState, useRef } from "react";

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

export default function PopularCurrenciesChart({ currencies = ["USD", "EUR", "GBP"], days: daysProp = 30, highlight, height: overrideHeight, padding: overridePadding }) {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hoverIdx, setHoverIdx] = useState(null);
  const containerRef = useRef(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

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
      start.setDate(end.getDate() - (daysProp - 1));
      const from = start.toISOString().slice(0, 10);
      const to = end.toISOString().slice(0, 10);
      if (!mounted) return;
      await loadForRange(from, to);
    };
    load();
    return () => (mounted = false);
  }, [currencies.join(","), daysProp]);

  // observe container size so svg can grow when parent grows
  useEffect(() => {
    const node = containerRef.current;
    if (!node || typeof window === 'undefined' || !window.ResizeObserver) return;
    const ro = new window.ResizeObserver((entries) => {
      const r = entries[0];
      if (!r) return;
      const cr = r.contentRect || {};
      const w = Math.max(200, Math.floor(cr.width || 0));
      const h = Math.max(120, Math.floor(cr.height || 0));
      setContainerSize({ width: w, height: h });
    });
    ro.observe(node);
    // initialize
    const rect = node.getBoundingClientRect();
    setContainerSize({ width: Math.max(200, Math.floor(rect.width)), height: Math.max(120, Math.floor(rect.height)) });
    return () => ro.disconnect();
  }, [containerRef.current]);

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

    // prefer measured container size; fall back to defaults
    const width = (containerSize.width && containerSize.width > 0) ? containerSize.width : 700;
    const height = overrideHeight || (containerSize.height && containerSize.height > 0) ? containerSize.height : 360;
    const padding = typeof overridePadding === 'number' ? overridePadding : 48; // allow caller to reduce padding for compact widgets

    const x = (i) => padding + (i / (dates.length - 1)) * (width - padding * 2 || 1);
    const y = (v) => height - padding - ((v - min) / (max - min || 1)) * (height - padding * 2);

    const paths = series.map((s, idx) => {
      const coords = s.points
        .map((v, i) => (v == null ? null : { x: x(i), y: y(v), val: v, date: dates[i] }))
        .filter(Boolean);
      const d = coords.map((p) => `${p.x},${p.y}`).join(" ");
      return { name: s.name, d, coords, color: COLORS[idx % COLORS.length] };
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

  return (
    <div className="popular-chart" ref={containerRef} style={{ width: '100%', height: '100%' }}>
      <svg viewBox={`0 0 ${chart.width} ${chart.height}`} preserveAspectRatio="xMidYMid meet" width="100%" height="100%" style={{ display: 'block', width: '100%', height: '100%' }}>
        {/* grid and y axis labels */}
        {chart.yTicks.map((v, i) => {
          const py = chart.height - chart.padding - ((v - chart.min) / (chart.max - chart.min || 1)) * (chart.height - chart.padding * 2);
          return (
            <g key={`yt-${i}`}>
              <line x1={chart.padding} x2={chart.width - chart.padding} y1={py} y2={py} stroke="#e6e6e6" strokeWidth={0.6} />
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

        <defs>
          {chart.paths.map((p) => {
            if (p.name !== highlight) return null;
            const gid = `grad-${p.name.replace(/[^a-zA-Z0-9_]/g, "_")}`;
            return (
              <linearGradient key={gid} id={gid} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor={p.color} stopOpacity="0.9" />
                <stop offset="40%" stopColor={p.color} stopOpacity="0.3" />
                <stop offset="100%" stopColor={p.color} stopOpacity="0.02" />
              </linearGradient>
            );
          })}
        </defs>

        {chart.paths.map((p) => (
          <g key={p.name}>
            <polyline points={p.d} fill="none" stroke={p.name === highlight ? p.color : p.color + "66"} strokeWidth={p.name === highlight ? 1.4 : 0.8} strokeLinecap="round" strokeLinejoin="round" />
            {p.name === highlight && p.coords.length > 0 && (() => {
              const first = p.coords[0];
              const last = p.coords[p.coords.length - 1];
              const baselineY = chart.height - chart.padding;
              const d = `M ${p.coords.map(c => `${c.x} ${c.y}`).join(' L ')} L ${last.x} ${baselineY} L ${first.x} ${baselineY} Z`;
              const gid = `grad-${p.name.replace(/[^a-zA-Z0-9_]/g, "_")}`;
              return <path d={d} fill={`url(#${gid})`} stroke="none" />;
            })()}
            {p.name === highlight && p.coords.map((pt, idx) => (
              <g key={idx}>
                {/* invisible hit area to show tooltip on hover */}
                <circle cx={pt.x} cy={pt.y} r={8} fill="transparent" onMouseEnter={() => setHoverIdx(idx)} onMouseLeave={() => setHoverIdx(null)} style={{cursor: 'pointer'}} />
                {/* visible marker only when hovered */}
                {hoverIdx === idx && (
                  <g>
                    <circle cx={pt.x} cy={pt.y} r={3} fill="#2563eb" stroke="#fff" strokeWidth={1} />
                    {/* beige tooltip box */}
                    {(() => {
                      const tx = Math.min(Math.max(pt.x + 10, chart.padding), chart.width - 100);
                      const ty = Math.max(pt.y - 28, 8);
                      const boxW = 72;
                      const boxH = 24;
                      return (
                        <g>
                          <rect x={tx} y={ty} width={boxW} height={boxH} rx={6} fill="#fff8e6" stroke="rgba(167,139,250,0.12)" />
                          <text x={tx + 8} y={ty + 15} fontSize={11} fill="#0f172a">{pt.val.toFixed(4)}</text>
                        </g>
                      );
                    })()}
                  </g>
                )}
              </g>
            ))}
          </g>
        ))}
      </svg>

      {/* legend removed: chart uses full width */}
    </div>
  );
}
