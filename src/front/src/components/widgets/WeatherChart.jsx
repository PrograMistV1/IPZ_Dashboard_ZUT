import React, {useMemo} from "react";

const COLORS = {
  temp: "#ef4444",
  feels_like: "#fb923c",
  pressure: "#60a5fa",
  humidity: "#34d399",
  wind_speed: "#a78bfa",
};

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
        return (
          <div key={key} style={{padding:8}}>
            <div style={{fontSize:12, marginBottom:6}}>{key.replace('_',' ')}</div>
            <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
              {/* y axis for temperature and humidity charts */}
              {(key === 'temp' || key === 'humidity') && (
                <>
                  <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#ccc" />
                  {tickVals.map((tv, idx) => {
                    const y = scaleYLocal(tv);
                    return (
                      <g key={idx}>
                        <line x1={padding - 6} x2={padding} y1={y} y2={y} stroke="#ccc" />
                        <text x={padding - 10} y={y + 4} fontSize={10} textAnchor="end">{key === 'humidity' ? Math.round(Number(tv)) + '%' : Math.round(Number(tv))}</text>
                      </g>
                    );
                  })}
                </>
              )}
              {/* polyline */}

              <polyline
                points={points.map((p,i)=> {
                  const value = toNumber(p[key]);
                  const safeValue = Number.isFinite(value) ? value : min;
                  return `${xScale(i)},${scaleYLocal(safeValue)}`;
                }).join(' ')}
                fill="none"
                stroke={color}
                strokeWidth={2}
              />

              {/* points */}
              {points.map((p,i)=>{
                const value = toNumber(p[key]);
                const safeValue = Number.isFinite(value) ? value : min;
                return (
                  <circle key={i} cx={xScale(i)} cy={scaleYLocal(safeValue)} r={3} fill={color} />
                );
              })}

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
