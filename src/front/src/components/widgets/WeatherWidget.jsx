import React, {useEffect, useRef, useState} from "react";
import {apiFetch} from "../../services/api";
import {updateWidget} from "../../services/dashboard";
import "../../styles/currencyWidget.css";

export default function WeatherWidget({widgetId, configuration, onDelete, onUpdate}) {
    const [editing, setEditing] = useState(false);
    const [city, setCity] = useState(configuration?.city || "");
    const [date, setDate] = useState(configuration?.date || new Date().toISOString().slice(0,10));
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const initialRef = useRef(true);

    useEffect(() => {
        if (!widgetId) return;
        setCity(configuration?.city || "");
        setDate(configuration?.date || new Date().toISOString().slice(0,10));
        setRows([]);
        setError(null);
        initialRef.current = true;
    }, [widgetId]);

    useEffect(() => {
        if (!city || !date) return;
        let mounted = true;
        setLoading(true);
        setError(null);
        apiFetch(`/api/weather?city=${encodeURIComponent(city)}&date=${encodeURIComponent(date)}`)
            .then((data) => { if (!mounted) return; setRows(data || []); })
            .catch((err) => { if (!mounted) return; setError(err.message || String(err)); })
            .finally(() => { if (mounted) setLoading(false); });
        return () => { mounted = false; };
    }, [city, date]);

    // persist config only when differs from server config
    useEffect(() => {
        if (!widgetId) return;
        if (initialRef.current) { initialRef.current = false; return; }
        const newConfig = {city, date};
        const serverCfg = configuration || {};
        try {
            const same = JSON.stringify({city: serverCfg.city ?? "", date: serverCfg.date ?? ""}) === JSON.stringify(newConfig);
            if (same) return;
        } catch (e) {}
        updateWidget(widgetId, {configuration: newConfig}).then(()=>onUpdate?.(widgetId, newConfig)).catch((err)=>console.error(err));
    }, [city, date, widgetId, onUpdate, configuration]);

    const daysOptions = Array.from({length:5}).map((_,i)=>{ const d=new Date(); d.setDate(d.getDate()+i); return d.toISOString().slice(0,10); });

    return (
        <div className="widget weather-widget">
            <div className="news-header">
                <h4>Weather — {date}</h4>
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
                    <label>Date<select value={date} onChange={(e)=>setDate(e.target.value)}>{daysOptions.map(d=> <option key={d} value={d}>{d}</option>)}</select></label>
                </div>
            )}
            <div className="news-content">
                {loading && <div className="widget-loading">Loading...</div>}
                {error && <div className="widget-error">{error}</div>}
                {!loading && !error && (
                    <ul className="news-list">
                        {rows.length===0 && <li>No data for selected day</li>}
                        {rows.map((r,i)=> (
                            <li key={i} className="news-item"><div>{new Date(r.timestamp).toLocaleTimeString()} — {Math.round(r.temp)}°C — {r.weather_main} {r.weather_description}</div></li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
