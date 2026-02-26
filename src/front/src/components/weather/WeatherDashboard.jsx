import React, {useEffect, useState} from "react";
import sunIcon from "../../assets/icons/sun.png";
import {listWeatherConfigs} from "../../services/weather";
import {apiFetch} from "../../services/api";
import WeatherChart from "../widgets/WeatherChart";
import WeatherNews from "./WeatherNews";
import "./weather.css";

export default function WeatherDashboard() {
    const [city, setCity] = useState("");
    const [coords, setCoords] = useState(null);

    useEffect(() => {
        let mounted = true;
        const load = async () => {
            try {
                const list = await listWeatherConfigs();
                if (!mounted) return;
                if (list && list.length) {
                    // take the most recent saved config
                    const cfg = list[0];
                    const c = cfg.configuration || {};
                    if (c.lat != null && c.lon != null) setCoords({lat: c.lat, lon: c.lon});
                    // try to resolve a human-readable city name from coords
                    if (c.lat != null && c.lon != null) {
                        try {
                            const res = await apiFetch(`/api/geocode/reverse?lat=${c.lat}&lon=${c.lon}`);
                            if (res && res.name) setCity(res.name);
                        } catch (e) {
                            // ignore
                        }
                    }
                }
            } catch (err) {
                // ignore if unauthenticated or no configs
            }
        };
        load().then(() => {
        });

        const handler = async (e) => {
            if (!e?.detail) return;
            // detail contains the city name the user typed; show it immediately
            try {
                setCity(e.detail);
            } catch (ex) {
            }
            // after city change, reload saved config to pick coords
            try {
                const list = await listWeatherConfigs().catch(() => []);
                if (list && list.length) {
                    const cfg = list[0];
                    const c = cfg.configuration || {};
                    if (c.lat != null && c.lon != null) setCoords({lat: c.lat, lon: c.lon});
                }
            } catch (err) {
                // ignore
            }
        };
        window.addEventListener("weather:cityChange", handler);

        return () => {
            mounted = false;
            window.removeEventListener("weather:cityChange", handler);
        };
    }, []);

    // fetch weather rows when coords change
    const [rowsByDate, setRowsByDate] = useState({});
    const [, setLoading] = useState(false);
    const [, setError] = useState(null);

    useEffect(() => {
        if (!coords) return;
        let mounted = true;
        setLoading(true);
        setError(null);

        const fetchForDates = async () => {
            const datesFor5 = Array.from({length: 5}).map((_, i) => {
                const d = new Date();
                d.setDate(d.getDate() + i);
                return d.toISOString().slice(0, 10);
            });

            // separate next 4 days starting tomorrow for forecast list
            const datesFor4Next = Array.from({length: 4}).map((_, i) => {
                const d = new Date();
                d.setDate(d.getDate() + i + 1);
                return d.toISOString().slice(0, 10);
            });

            try {
                const res5 = await Promise.all(datesFor5.map((dt) => apiFetch(`/api/weather?lat=${coords.lat}&lon=${coords.lon}&date=${encodeURIComponent(dt)}`).catch(() => [])));
                const res4 = await Promise.all(datesFor4Next.map((dt) => apiFetch(`/api/weather?lat=${coords.lat}&lon=${coords.lon}&date=${encodeURIComponent(dt)}`).catch(() => [])));
                if (!mounted) return;
                const map = {};
                datesFor5.forEach((d, i) => {
                    map[d] = res5[i] || [];
                });
                datesFor4Next.forEach((d, i) => {
                    map[d] = res4[i] || map[d] || [];
                });
                setRowsByDate(map);
            } catch (err) {
                if (!mounted) return;
                setError(err.message || String(err));
            } finally {
                if (mounted) setLoading(false);
            }
        };

        fetchForDates().then(() => {
        });

        return () => {
            mounted = false;
        };
    }, [coords]);

    // live clock
    const [now, setNow] = useState(new Date());
    useEffect(() => {
        const t = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(t);
    }, []);

    // periodic refresh of weather data and notify widgets
    useEffect(() => {
        if (!coords) return;
        // refresh every 5 minutes
        const interval = setInterval(() => {
            // trigger listeners to refresh
            window.dispatchEvent(new CustomEvent('weather:refresh'));
            (async () => {
                try {
                    const today = new Date().toISOString().slice(0, 10);
                    await apiFetch(`/api/weather?lat=${coords.lat}&lon=${coords.lon}&date=${encodeURIComponent(today)}`);
                    window.dispatchEvent(new CustomEvent('weather:dataRefreshed'));
                } catch (e) { /* ignore */
                }
            })();
        }, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, [coords]);

    const todayKey = new Date().toISOString().slice(0, 10);
    const allRows = Object.values(rowsByDate).flat().filter(Boolean).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    const currentPoint = (rowsByDate[todayKey] || []).reduce((best, cur) => {
        if (!best) return cur;
        const now = Date.now();
        const bd = Math.abs(new Date(best.timestamp).getTime() - now);
        const cd = Math.abs(new Date(cur.timestamp).getTime() - now);
        return cd < bd ? cur : best;
    }, null);

    // hourly today
    const hourly = (rowsByDate[todayKey] || []).map(r => ({
        time: new Date(r.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        }), temp: r.temp, wind: r.wind_speed
    }));

    // daily summary for next 4 days (midday-ish)
    const dailySummary = (() => {
        const keys = Object.keys(rowsByDate).sort();
        const result = [];
        for (const k of keys) {
            if (k === todayKey) continue;
            if (result.length >= 4) break;
            const arr = rowsByDate[k] || [];
            if (!arr.length) {
                result.push({date: k, temp: null});
                continue;
            }
            const target = new Date(k + 'T12:00:00Z').getTime();
            let best = arr[0];
            let bestDiff = Math.abs(new Date(best.timestamp).getTime() - target);
            for (const it of arr) {
                const d = Math.abs(new Date(it.timestamp).getTime() - target);
                if (d < bestDiff) {
                    best = it;
                    bestDiff = d;
                }
            }
            result.push({date: k, temp: best.temp, raw: arr});
        }
        return result;
    })();

    return (
        <div className="weather-dashboard">
            <div className="weather-header">
                <div className="weather-top">
                    <div className="weather-clock">
                        <h2>{city || "Weather"}</h2>
                        <div className="time-large">{now.toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                        })}</div>
                        <div className="date-small">{now.toLocaleDateString(undefined, {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'short'
                        })}</div>
                    </div>

                    <div className="weather-current">
                        <div className="current-left">
                            <div
                                className="temp-large">{currentPoint ? Math.round(currentPoint.temp) + '°C' : '—'}</div>
                            <div className="desc">{currentPoint?.["weather_description"] ?? ''}</div>
                            <div className="params">
                                <div>Feels
                                    like: <b>{currentPoint ? Math.round(currentPoint.feels_like) + '°C' : '—'}</b></div>
                                <div>Humidity: <b>{currentPoint ? currentPoint.humidity + '%' : '—'}</b></div>
                                <div>Pressure: <b>{currentPoint ? currentPoint.pressure + ' hPa' : '—'}</b></div>
                                <div>Wind: <b>{currentPoint ? currentPoint.wind_speed + ' m/s' : '—'}</b></div>
                            </div>
                        </div>
                        <div className="current-right">
                            <div className="big-icon"><img src={sunIcon} alt="sun" style={{width: '64px', height: '64px'}}/></div>
                        </div>
                    </div>
                </div>

                <div className="weather-middle">
                    <div className="forecast-5days">
                        <h4>4 Days Forecast</h4>
                        <ul>
                            {dailySummary.map((d) => (
                                <li key={d.date}>
                                    <span className="day">{new Date(d.date).toLocaleDateString(undefined, {
                                        day: '2-digit',
                                        month: 'short'
                                    })}</span>
                                    <span className="value">{d.temp != null ? Math.round(d.temp) + '°C' : '—'}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="hourly-today">
                        <h4>Hourly Today</h4>
                        <div className="hourly-list">
                            {hourly.slice(0, 8).map((h, i) => (
                                <div key={i} className="hour-card">
                                    <div className="hour-time">{h.time}</div>
                                    <div className="hour-temp">{Math.round(h.temp)}°C</div>
                                    <div className="hour-wind">{h.wind} m/s</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="weather-bottom">
                    <div className="charts-row">
                        <div className="chart-card temp-card">
                            <h5>Temperature (5 days)</h5>
                            <WeatherChart rows={allRows} series={{temp: true}} height={180} />
                        </div>
                        <div className="chart-card humidity-card">
                            <h5>Humidity (5 days)</h5>
                            <WeatherChart rows={allRows} series={{humidity: true}} height={180} />
                        </div>
                    </div>
                    <div style={{marginTop: 18}}>
                        <WeatherNews/>
                    </div>
                </div>
            </div>
        </div>
    );
}
