import React, {useEffect, useMemo, useRef, useState} from "react";
import {apiFetch} from "../../services/api";
import {updateWidget} from "../../services/dashboard";
import WeatherChart from "./WeatherChart";
import "../../styles/currencyWidget.css";

const DEFAULT_SERIES = {temp:true,feels_like:false,pressure:false,humidity:false,wind_speed:false};
const coerceBool = (value, fallback) => (typeof value === "boolean" ? value : fallback);
const coerceString = (value) => (typeof value === "string" ? value : "");
const normalizeSeries = (value) => {
    if (!value || typeof value !== "object") return {...DEFAULT_SERIES};
    const next = {...DEFAULT_SERIES};
    Object.keys(DEFAULT_SERIES).forEach((key) => {
        next[key] = !!value[key];
    });
    return next;
};

export default function WeatherWidget({widgetId, configuration, onDelete, onUpdate}) {
    const [editing, setEditing] = useState(false);
    const [city, setCity] = useState(coerceString(configuration?.city));
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [showChart, setShowChart] = useState(coerceBool(configuration?.showChart, true));
    const [series, setSeries] = useState(normalizeSeries(configuration?.series));
    const [showCurrent, setShowCurrent] = useState(coerceBool(configuration?.showCurrent, true));

    const initialRef = useRef(true);

    useEffect(() => {
        if (!widgetId) return;
        setCity(coerceString(configuration?.city));
        setRows([]);
        setError(null);
        setShowChart(coerceBool(configuration?.showChart, true));
        setSeries(normalizeSeries(configuration?.series));
        setShowCurrent(coerceBool(configuration?.showCurrent, true));
        initialRef.current = true;
    }, [widgetId]);

    useEffect(() => {
        if (!city) return;
        let mounted = true;
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                // build 5 dates starting from today (today .. today+4)
                const dates = Array.from({length:5}).map((_,i)=>{
                    const d = new Date();
                    d.setDate(d.getDate() + i);
                    return d.toISOString().slice(0,10);
                });
                const arrs = await Promise.all(dates.map(dt => apiFetch(`/api/weather?city=${encodeURIComponent(city)}&date=${encodeURIComponent(dt)}`).catch(() => [])));
                if (!mounted) return;
                const flat = (arrs || []).flat().map(r=>r || []).flat();
                flat.sort((a,b)=> new Date(a.timestamp) - new Date(b.timestamp));
                setRows(flat);
            } catch (err) {
                if (!mounted) return; setError(err.message || String(err));
            } finally {
                if (mounted) setLoading(false);
            }
        };

        fetchData().then(() => {});

        // refresh when global weather refresh event fires
        const onRefresh = () => { fetchData().then(() => {}); };
        window.addEventListener('weather:refresh', onRefresh);

        // periodic polling every 5 minutes
        const interval = setInterval(fetchData, 5 * 60 * 1000);

        return () => { mounted = false; window.removeEventListener('weather:refresh', onRefresh); clearInterval(interval); };
    }, [city]);

    // persist config only when differs from server config
    useEffect(() => {
        if (!widgetId) return;
        if (initialRef.current) { initialRef.current = false; return; }
        const newConfig = {city, showChart, series, showCurrent};
        const serverCfg = configuration || {};
        try {
            const same = JSON.stringify({
                city: coerceString(serverCfg.city),
                showChart: coerceBool(serverCfg.showChart, true),
                series: normalizeSeries(serverCfg.series),
                showCurrent: coerceBool(serverCfg.showCurrent, true),
            }) === JSON.stringify(newConfig);
            if (same) return;
        } catch (e) {}
        updateWidget(widgetId, {configuration: newConfig}).then(()=>onUpdate?.(widgetId, newConfig)).catch((err)=>console.error(err));
    }, [city, showChart, series, showCurrent, widgetId, onUpdate, configuration]);

    const currentPoint = useMemo(() => {
        if (!rows || rows.length === 0) return null;
        const now = Date.now();
        let best = rows[0];
        let bestDiff = Math.abs(new Date(best.timestamp).getTime() - now);
        for (const r of rows) {
            const d = Math.abs(new Date(r.timestamp).getTime() - now);
            if (d < bestDiff) { best = r; bestDiff = d; }
        }
        return best;
    }, [rows]);

    return (
        <div className="widget weather-widget">
            <div className="news-header">
                <h4>{city || "(no city)"}</h4>
                <div className="news-actions">
                    <button className="icon-btn" title="Settings" onClick={()=>setEditing(true)}>⚙</button>
                    <button className="icon-btn danger" title="Delete" onClick={()=>{ if (window.confirm("Delete this widget?")) onDelete?.(); }}>🗑</button>
                </div>
            </div>

            {editing && (
                <div className="news-settings-panel">
                    <div className="settings-header">
                        <strong>Widget settings</strong>
                        <button className="icon-btn" onClick={()=>setEditing(false)}>✕</button>
                    </div>
                    <label>City<input type="text" value={city} onChange={(e)=>setCity(e.target.value)} /></label>

                    <div style={{marginTop:8}}>
                        <label><input type="checkbox" checked={!!showCurrent} onChange={()=>setShowCurrent(v=>!v)} /> Show current weather</label>
                    </div>

                    <div style={{marginTop:8}}>
                        <label><input type="checkbox" checked={!!showChart} onChange={()=>setShowChart(v=>!v)} /> Forecast</label>
                        {showChart && (
                            <div style={{display:'flex', gap:8, flexWrap:'wrap', marginTop:6}}>
                                {Object.keys(series).map(k=> (
                                    <label key={k} style={{display:'flex',alignItems:'center',gap:6}}>
                                        <input type="checkbox" checked={!!series[k]} onChange={()=>setSeries(s=>({...s,[k]:!s[k]}))} /> {k.replace('_',' ')}
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div className="news-content">
                {loading && <div className="widget-loading">Loading...</div>}
                {error && <div className="widget-error">{error}</div>}

                {!loading && !error && (
                    <div>
                        {showCurrent && currentPoint && (
                            <div style={{marginBottom:8}}>
                                <div>
                                    <div style={{fontSize:18, fontWeight:700, display:'inline'}}>
                                        {Math.round(currentPoint.temp)}°C
                                        <span style={{fontSize:13, opacity:0.9, marginLeft:6}}>
                                            {currentPoint?.["weather_description"] ? currentPoint["weather_description"].replace(/^\w/, c => c.toUpperCase()) : (currentPoint["weather_main"] || '')}
                                        </span>
                                    </div>
                                </div>
                                <div style={{marginTop:8, display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:6}}>
                                    <div>Feels: <strong>{Math.round(currentPoint.feels_like)}°C</strong></div>
                                    <div>Pressure: <strong>{currentPoint.pressure} hPa</strong></div>
                                    <div>Humidity: <strong>{currentPoint.humidity}%</strong></div>
                                    <div>Wind: <strong>{currentPoint.wind_speed} m/s</strong></div>
                                </div>
                            </div>
                        )}

                        {showChart && rows.length > 1 && (
                            <div className="currency-chart-box">
                                <WeatherChart rows={rows} series={series} />
                            </div>
                        )}

                        {rows.length === 0 && (
                            <div>No data for selected city</div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
