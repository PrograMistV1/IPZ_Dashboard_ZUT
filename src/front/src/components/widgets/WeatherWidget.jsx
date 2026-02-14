import React, {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {apiFetch} from "../../services/api";
import {updateWidget} from "../../services/dashboard";
import WeatherCurrentDisplay from "./WeatherCurrentDisplay";
import WeatherForecastChart from "./WeatherForecastChart";
import WeatherSettingsPanel from "./WeatherSettingsPanel";
import "../../styles/currencyWidget.css";

const DEFAULT_SERIES = {temp: true, feels_like: false, pressure: false, humidity: false, wind_speed: false};

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

export default function WeatherWidget({
                                          widgetId,
                                          configuration,
                                          onDelete,
                                          onUpdate,
                                          enabled = true,
                                      }) {
    const isMountedRef = useRef(false);
    const initialConfigRef = useRef(null);

    const [editing, setEditing] = useState(false);
    const [city, setCity] = useState(coerceString(configuration?.city));
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showChart, setShowChart] = useState(coerceBool(configuration?.showChart, true));
    const [series, setSeries] = useState(normalizeSeries(configuration?.series));
    const [showCurrent, setShowCurrent] = useState(coerceBool(configuration?.showCurrent, true));


    useEffect(() => {
        if (!widgetId) return;
        setCity(coerceString(configuration?.city));
        setRows([]);
        setError(null);
        setShowChart(coerceBool(configuration?.showChart, true));
        setSeries(normalizeSeries(configuration?.series));
        setShowCurrent(coerceBool(configuration?.showCurrent, true));

        if (initialConfigRef.current === null) {
            initialConfigRef.current = configuration || null;
        }

        isMountedRef.current = true;
    }, [widgetId, configuration]);

    const fetchWeather = useCallback(async () => {
        if (!city) return;
        let mounted = true;
        setLoading(true);
        setError(null);
        try {
            // build 5 dates starting from today (today .. today+4)
            const dates = Array.from({length: 5}).map((_, i) => {
                const d = new Date();
                d.setDate(d.getDate() + i);
                return d.toISOString().slice(0, 10);
            });
            const arrs = await Promise.all(
                dates.map(dt =>
                    apiFetch(`/api/weather?city=${encodeURIComponent(city)}&date=${encodeURIComponent(dt)}`)
                        .catch(() => [])
                )
            );
            if (!mounted) return;
            const flat = (arrs || []).flat().map(r => r || []).flat();
            flat.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
            setRows(flat);
        } catch (err) {
            if (!mounted) return;
            setError(err.message || String(err));
        } finally {
            if (mounted) setLoading(false);
        }
        return () => {
            mounted = false;
        };
    }, [city]);

    useEffect(() => {
        if (!city || !enabled) return;
        fetchWeather();

        // refresh when global weather refresh event fires
        const onRefresh = () => {
            fetchWeather();
        };
        window.addEventListener('weather:refresh', onRefresh);

        // periodic polling every 5 minutes
        const interval = setInterval(() => fetchWeather(), 5 * 60 * 1000);

        return () => {
            window.removeEventListener('weather:refresh', onRefresh);
            clearInterval(interval);
        };
    }, [city, enabled, fetchWeather]);

    // persist config only when differs from server config
    useEffect(() => {
        if (!widgetId || !isMountedRef.current) return;

        const newConfig = {city, showChart, series, showCurrent};

        try {
            const prev = initialConfigRef.current || {};
            const prevJson = JSON.stringify(prev || {});
            const newJson = JSON.stringify(newConfig || {});
            if (prevJson === newJson) {
                return;
            }
        } catch (err) {
        }

        if (!newConfig.city) {
            return;
        }

        updateWidget(widgetId, {
            configuration: newConfig,
            enabled,
        }).then(() => {
            initialConfigRef.current = newConfig;
        });

        onUpdate?.(widgetId, newConfig);
    }, [
        city,
        showChart,
        series,
        showCurrent,
        widgetId,
        enabled,
        onUpdate,
    ]);

    const currentPoint = useMemo(() => {
        if (!rows || rows.length === 0) return null;
        const now = Date.now();
        let best = rows[0];
        let bestDiff = Math.abs(new Date(best.timestamp).getTime() - now);
        for (const r of rows) {
            const d = Math.abs(new Date(r.timestamp).getTime() - now);
            if (d < bestDiff) {
                best = r;
                bestDiff = d;
            }
        }
        return best;
    }, [rows]);

    if (!enabled) {
        return (
            <div className="currency-widget disabled">
                <div className="currency-header">
                    <h3>Weather</h3>
                    <button className="icon-btn" onClick={() => setEditing(true)}>
                        ⚙
                    </button>
                </div>
                <p>Widget is disabled</p>
            </div>
        );
    }

    return (
        <div className="currency-widget">
            {/* ===== HEADER ===== */}
            <div className="currency-header">
                <h3>{city || "Choose a city"}</h3>
                <div className="currency-actions">
                    <button className="icon-btn" title="Settings" onClick={() => setEditing(true)}>⚙</button>
                    <button className="icon-btn danger" title="Delete" onClick={() => { if (window.confirm("Are you sure you want to delete this widget?")) { onDelete?.(); } }}>🗑</button>
                </div>
            </div>

            {/* ===== SETTINGS PANEL ===== */}
            {editing && (
                <WeatherSettingsPanel
                    city={city}
                    onCityChange={setCity}
                    showCurrent={showCurrent}
                    onShowCurrentChange={setShowCurrent}
                    showChart={showChart}
                    onShowChartChange={setShowChart}
                    series={series}
                    onSeriesChange={setSeries}
                    onClose={() => setEditing(false)}
                />
            )}

            {/* ===== CONTENT ===== */}
            <div className="weather-content">
                {loading && <div className="widget-loading">Loading...</div>}
                {error && <div className="widget-error">{error}</div>}

                {!loading && !error && (
                    <div>
                        {showCurrent && (
                            <WeatherCurrentDisplay currentPoint={currentPoint} />
                        )}

                        {showChart && (
                            <WeatherForecastChart rows={rows} series={series} />
                        )}

                        {rows.length === 0 && !loading && (
                            <div className="widget-empty">
                                No data for selected city
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
