import React, {useEffect, useState} from 'react';
import geoIcon from '../../assets/icons/geo.png';
import Widget from './Widget';
import {updateWidget} from '../../services/dashboard';
import {apiFetch} from '../../services/api';
import WeatherChart from './WeatherChart';


export default function WeatherWidget({id, data = {}, onUpdate}) {
    // data: { configuration: { city, date, ... }, forecast: [...] }
    const config = data ? (data.configuration || data) : {};
    const [selectedCity, setSelectedCity] = useState(config.city || '');
    const [inputCity, setInputCity] = useState(config.city || '');
    const [selectedDate] = useState(() => {
        const today = new Date();
        return today.toISOString().slice(0, 10);
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [forecast, setForecast] = useState(data && data.forecast ? data.forecast : []);
    const [showCurrent, setShowCurrent] = useState((config && config.showCurrent) ?? true);
    const [showChart, setShowChart] = useState((config && typeof config.showChart === 'boolean') ? config.showChart : true);
    const [chartSeries, setChartSeries] = useState((config && config.chartSeries) || 'temp');
    const [coords, setCoords] = useState({ lat: config?.lat ?? null, lon: config?.lon ?? null });
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState(null);
    const [geoLoading, setGeoLoading] = useState(false);

    // Load multi-day forecast when city changes
    useEffect(() => {
        let mounted = true;

        async function loadForecastRange(days = 4) {
            // Determine query mode: prefer city, fallback to saved coords
            const useCity = selectedCity && selectedCity.trim();
            const useCoords = !useCity && coords && coords.lat != null && coords.lon != null;

            if (!useCity && !useCoords) {
                setForecast([]);
                setError('Please enter a city or set location');
                return;
            }

            setLoading(true);
            setError(null);
            try {
                const base = new Date(); // always use current date
                const dates = [];
                for (let i = 0; i <= days; i++) {
                    const d = new Date(base.getTime() + i * 24 * 60 * 60 * 1000);
                    dates.push(d.toISOString().slice(0, 10));
                }

                const results = await Promise.all(dates.map(async (dt) => {
                    try {
                        if (useCity) {
                            return await apiFetch(`/api/weather?city=${encodeURIComponent(selectedCity)}&date=${encodeURIComponent(dt)}`);
                        } else {
                            return await apiFetch(`/api/weather?lat=${coords.lat}&lon=${coords.lon}&date=${encodeURIComponent(dt)}`);
                        }
                    } catch (e) {
                        return [];
                    }
                }));

                const all = results.flat().filter(Boolean);
                if (mounted) setForecast(all);
            } catch (e) {
                if (mounted) setError(e.message || String(e));
            } finally {
                if (mounted) setLoading(false);
            }
        }

        loadForecastRange(4);
        return () => { mounted = false; };
    }, [selectedCity, coords]);

    useEffect(() => {
        if (config.city) {
            setSelectedCity(config.city);
            setInputCity(config.city);
        }
        if (config.lat != null && config.lon != null) setCoords({ lat: config.lat, lon: config.lon });
        if (typeof config.showCurrent === 'boolean') setShowCurrent(config.showCurrent);
        if (typeof config.showChart === 'boolean') setShowChart(config.showChart);
        if (config.chartSeries) setChartSeries(config.chartSeries);
    }, [id]);

    useEffect(() => {
        if (!selectedCity.trim()) return;
        let ignore = false;
        const save = async () => {
            setSaving(true);
            setSaveError(null);
            try {
                const { mode: _discardMode, ...cfgBase } = config || {};
                const configToSave = { ...cfgBase, city: selectedCity, showCurrent, showChart, chartSeries };
                await updateWidget(id, { configuration: configToSave });
                if (!ignore && typeof onUpdate === 'function') {
                    onUpdate(id, configToSave);
                }
                window.dispatchEvent(new CustomEvent('save-widget-settings', {
                    detail: { widgetId: id, settings: configToSave }
                }));
            } catch (err) {
                if (!ignore) setSaveError('Error saving settings');
            } finally {
                if (!ignore) setSaving(false);
            }
        };
        save();
        return () => { ignore = true; };
    }, [selectedCity, selectedDate, showCurrent, showChart, chartSeries]);

    const handleCityInput = (e) => {
        setInputCity(e.target.value);
        setError(null);
    };

    const applyCity = () => {
        const v = (inputCity || '').trim();
        setSelectedCity(v);
        if (v) setCoords({ lat: null, lon: null });
    };

    const handleCityKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            applyCity();
        }
    };

    const handleGeolocation = async () => {
        if (!navigator.geolocation) {
            setError('Geolocation is not supported by your browser');
            return;
        }
        setGeoLoading(true);
        setError(null);
        try {
            navigator.geolocation.getCurrentPosition(async (pos) => {
                const lat = pos.coords.latitude;
                const lon = pos.coords.longitude;
                try {
                    const res = await apiFetch(`/api/geocode/reverse?lat=${lat}&lon=${lon}`);
                    if (res && res.name) {
                        setSelectedCity(res.name);
                        setInputCity(res.name);
                        setCoords({ lat: null, lon: null });
                    } else {
                        setError('City not found for your location');
                    }
                } catch (e) {
                    setError('Failed to resolve city by geolocation');
                } finally {
                    setGeoLoading(false);
                }
            }, (err) => {
                setError('Unable to determine location: ' + (err?.message || err?.code || 'unknown'));
                setGeoLoading(false);
            }, {enableHighAccuracy: true, timeout: 10000});
        } catch (e) {
            setError('Geolocation error');
            setGeoLoading(false);
        }
    };

    const settingsNode = (
        <div className="widget-settings-portal">
            <div className="widget-settings-inner">
                <strong>Settings — {id}</strong>
                <div style={{marginTop: 8, display: 'flex', gap: 8, flexDirection: 'column'}}>
                    <label style={{display: 'flex', alignItems: 'center', gap: 8}}>
                        City:
                        <span className="city-control">
                          <input
                              type="text"
                              value={inputCity}
                              onChange={handleCityInput}
                              onKeyDown={handleCityKeyDown}
                              placeholder="Enter city"
                              className="city-input"
                              disabled={geoLoading}
                          />
                          <button
                              type="button"
                              className="geo-btn settings-geo-btn"
                              onClick={handleGeolocation}
                              disabled={geoLoading}
                              title="Detect by geolocation"
                          >
                              {geoLoading ? '...' : <img src={geoIcon} alt="geo" className="geo-icon" />}
                          </button>

                        </span>
                    </label>
                    {/* Date is fixed to current date and not editable */}
                    <label style={{display:'flex', alignItems:'center', gap:8}}>
                        <input type="checkbox" checked={showCurrent} onChange={(e)=>setShowCurrent(e.target.checked)} /> Show current weather
                    </label>
                    <label style={{display:'flex', alignItems:'center', gap:8}}>
                        <input type="checkbox" checked={showChart} onChange={(e)=>setShowChart(e.target.checked)} /> Show multi-day chart
                    </label>
                    <label style={{display:'flex', alignItems:'center', gap:8}}>
                        Chart series:
                        <select value={chartSeries} onChange={(e)=>setChartSeries(e.target.value)}>
                            <option value="temp">Temperature</option>
                            <option value="feels_like">Feels like</option>
                            <option value="humidity">Humidity</option>
                            <option value="pressure">Pressure</option>
                            <option value="wind_speed">Wind speed</option>
                        </select>
                    </label>
                    {saving && <span style={{ fontSize: 12, color: '#888' }}>Saving…</span>}
                    {saveError && <div style={{color: '#ef4444', fontSize: 12}}>{saveError}</div>}
                </div>
            </div>
        </div>
    );

    return (
        <Widget id={id} mode={'standard'} data={{location: selectedCity, forecast}} settings={settingsNode}>
            <div style={{height: '100%', display: 'flex', flexDirection: 'column'}}>
                <div style={{fontSize: 12, color: '#666'}}>{selectedCity || '—'}</div>
                {loading ? (
                    <div style={{padding: 12}}>Loading…</div>
                ) : error ? (
                    <div style={{padding: 12, color: '#ef4444'}}>Error: {error}</div>
                ) : (
                    <div>
                        {showCurrent && (
                            <div style={{padding: 8, borderBottom: '1px solid #eee', marginBottom: 8}}>
                                {forecast.length ? (() => {
                                    const now = Date.now();
                                    let best = forecast[0];
                                    let bestDiff = Math.abs(new Date(forecast[0].timestamp).getTime() - now);
                                    for (const r of forecast) {
                                        const d = Math.abs(new Date(r.timestamp).getTime() - now);
                                        if (d < bestDiff) { best = r; bestDiff = d; }
                                    }
                                    return (
                                        <div style={{marginTop:6}} className="current-blocks">
                                            <div className="current-block">
                                                <div className="cb-title">Temp</div>
                                                <div className="cb-value">{Math.round(best.temp)}°C</div>
                                            </div>
                                            <div className="current-block">
                                                <div className="cb-title">Desc</div>
                                                <div className="cb-value">{best.weather_description || ''}</div>
                                            </div>
                                            <div className="current-block">
                                                <div className="cb-title">Feels</div>
                                                <div className="cb-value">{best.feels_like}°C</div>
                                            </div>
                                            <div className="current-block">
                                                <div className="cb-title">Hum</div>
                                                <div className="cb-value">{best.humidity}%</div>
                                            </div>
                                            <div className="current-block">
                                                <div className="cb-title">Pres</div>
                                                <div className="cb-value">{best.pressure} hPa</div>
                                            </div>
                                            <div className="current-block">
                                                <div className="cb-title">Wind</div>
                                                <div className="cb-value">{best.wind_speed} m/s</div>
                                            </div>
                                        </div>
                                    );
                                })() : <div>No data</div>}
                            </div>
                        )}

                        {showChart && (
                            <div style={{padding: 6, flex: 1, minHeight: 0}}>
                                <WeatherChart rows={forecast} series={{ [chartSeries]: true }} height={180} />
                            </div>
                        )}
                        {!showChart && !showCurrent && (
                            <div style={{padding: 8, color: '#666'}}>Both current and chart are disabled in settings.</div>
                        )}
                    </div>
                )}
            </div>
        </Widget>
    );
}
