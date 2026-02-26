import React, {useMemo, useState} from "react";

const COLORS = {
  temp: "#00e676",
  feels_like: "#fb923c",
  pressure: "#60a5fa",
  humidity: "#34d399",
  wind_speed: "#a78bfa",
};

function lightenHex(hex, amount = 0.2) {
  // amount: 0..1, mix with white
  const h = hex.replace('#', '');
  const bigint = parseInt(h, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  const nr = Math.round(r + (255 - r) * amount);
  const ng = Math.round(g + (255 - g) * amount);
  const nb = Math.round(b + (255 - b) * amount);
  return `#${((1 << 24) + (nr << 16) + (ng << 8) + nb).toString(16).slice(1)}`;
}

export default function WeatherChart({rows, series}) {
  // convert rows to points and pick one value per day close to 12:00
  const points = useMemo(() => {
    const raw = (rows || []).map((r) => ({
      t: new Date(r.timestamp),
      timestamp: r.timestamp,
      temp: r.temp,
      feels_like: r.feels_like,
      pressure: r.pressure,
      humidity: r.humidity,
      wind_speed: r.wind_speed,
    }));

    // group by UTC date string
    const groups = {};
    raw.forEach((p) => {
      const dateKey = p.t.toISOString().slice(0, 10);
      groups[dateKey] = groups[dateKey] || [];
      groups[dateKey].push(p);
    });

    // For each day pick the point closest to 12:00 UTC
    return Object.keys(groups)
        .sort()
        .map((dateKey) => {
          const target = new Date(dateKey + "T12:00:00Z").getTime();
          const list = groups[dateKey];
          let best = list[0];
          let bestDiff = Math.abs(list[0].t.getTime() - target);
          for (const it of list) {
            const d = Math.abs(it.t.getTime() - target);
            if (d < bestDiff) {
              best = it;
              bestDiff = d;
            }
          }
          // keep the original UTC date key so labels can be produced consistently
          return {...best, dateKey};
        });
  }, [rows]);

  const [hover, setHover] = useState({ key: null, idx: null });

  const enabledKeys = Object.keys(series || {}).filter((k) => series[k]);
  if (points.length === 0 || enabledKeys.length === 0) return null;

  const width = 600;
  const height = 140;
  const padding = 40;

  const xScale = (i) => padding + (i / (points.length - 1 || 1)) * (width - padding * 2);

  // For each key we compute its own scale so charts are readable.

  return (
    <div style={{display:'flex', flexDirection:'column', gap:12}}>
      {enabledKeys.map((key) => {
        const color = COLORS[key] || '#888';
        const toNumber = (v) => (typeof v === 'number' ? v : Number(v));
        const vals = points.map(p => toNumber(p[key])).filter(v => Number.isFinite(v));
        const min = vals.length ? Math.min(...vals) : 0;
        const max = vals.length ? Math.max(...vals) : 1;
        const scaleYLocal = (v) => height - padding - ((v - min) / (max - min || 1)) * (height - padding * 2);
        const ticks = 4;
        const tickVals = Array.from({length: ticks + 1}).map((_,i) => min + ((max - min) * i) / ticks);
        const units = { temp: '°C', feels_like: '°C', humidity: '%', pressure: ' hPa', wind_speed: ' m/s' };
        // build coordinates for points (used for polyline, area and hover)
        const coords = points.map((p,i)=>{
          const value = toNumber(p[key]);
          const safeValue = Number.isFinite(value) ? value : min;
          return { x: xScale(i), y: scaleYLocal(safeValue), val: safeValue, date: p.dateKey || p.t.toISOString().slice(0,10) };
        }).filter(c=>c && Number.isFinite(c.x) && Number.isFinite(c.y));
        const baselineY = height - padding;
        const areaD = coords.length>0 ? `M ${coords.map(c=>`${c.x} ${c.y}`).join(' L ')} L ${coords[coords.length-1].x} ${baselineY} L ${coords[0].x} ${baselineY} Z` : '';
        const polyD = coords.map(c=>`${c.x},${c.y}`).join(' ');
        return (
          <div key={key} style={{padding:8}}>
            <div style={{fontSize:12, marginBottom:6}}>{key.replace('_',' ')}</div>
            <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
              {/* y axis for temperature and humidity charts */}
              <>
                <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#ccc" />
                {tickVals.map((tv, idx) => {
                  const y = scaleYLocal(tv);
                  return (
                    <g key={idx}>
                      <line x1={padding - 6} x2={padding} y1={y} y2={y} stroke="#ccc" />
                      <text x={padding - 10} y={y + 4} fontSize={10} textAnchor="end">{key === 'humidity' ? Math.round(Number(tv)) + units[key] : Math.round(Number(tv)) + (units[key] || '')}</text>
                    </g>
                  );
                })}
              </>
              {/* polyline */}

              <defs>
                <linearGradient id={`grad-${key.replace(/[^a-zA-Z0-9_]/g, '_')}`} x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor={lightenHex(color, 0.25)} stopOpacity={0.95} />
                  <stop offset="40%" stopColor={color} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={color} stopOpacity={0.04} />
                </linearGradient>
              </defs>

              {/* filled area */}
              {areaD && <path d={areaD} fill={`url(#grad-${key.replace(/[^a-zA-Z0-9_]/g, '_')})`} stroke="none" />}

              {/* polyline (outline) */}
              {polyD && (
                <polyline points={polyD} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
              )}

              {/* invisible hit areas for hover (show tooltip) */}
              {coords.map((pt, i) => (
                <g key={`hit-${i}`}>
                  <circle cx={pt.x} cy={pt.y} r={10} fill="transparent" onMouseEnter={() => setHover({ key, idx: i })} onMouseLeave={() => setHover({ key: null, idx: null })} style={{cursor: 'pointer'}} />
                  {hover.key === key && hover.idx === i && (
                    <g>
                      {/* visible marker on hover */}
                      <circle cx={pt.x} cy={pt.y} r={5} fill={color} stroke="#fff" strokeWidth={1} />
                      <rect x={Math.min(Math.max(pt.x + 10, padding), width - 100)} y={Math.max(pt.y - 36, 8)} width={80} height={28} rx={6} fill="#fff8e6" stroke="rgba(0,0,0,0.06)" />
                      <text x={Math.min(Math.max(pt.x + 18, padding+8), width - 84)} y={Math.max(pt.y - 16, 24)} fontSize={12} fill="#0f172a">{pt.val}</text>
                    </g>
                  )}
                </g>
              ))}

              {/* x axis labels */}
              {points.map((p,i)=>{
                // use the grouped UTC dateKey for stable per-day labels (avoid mixing UTC grouping with local Date formatting)
                const parts = (p.dateKey || p.t.toISOString().slice(0,10)).split('-');
                const label = `${parts[2]}.${parts[1]}`; // DD.MM from YYYY-MM-DD
                return (
                  <text key={i} x={xScale(i)} y={height - padding + 14} fontSize={11} textAnchor="middle">{label}</text>
                );
              })}
            </svg>
          </div>
        );
      })}
    </div>
  );
}
