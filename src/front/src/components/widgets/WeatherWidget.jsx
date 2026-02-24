import React, {useEffect, useState} from 'react';
import Widget from './Widget';
import {updateWidget} from '../../services/dashboard';
import {apiFetch} from '../../services/api';


export default function WeatherWidget({id, mode = 'standard', data = {}, onUpdate}) {
    // data: { configuration: { city, date, ... }, forecast: [...] }
    const config = data && (data.configuration || data) || {};
    const [selectedCity, setSelectedCity] = useState(config.city || '');
    const [selectedDate, setSelectedDate] = useState(config.date || (() => {
        const today = new Date();
        return today.toISOString().slice(0, 10);
    })());
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [forecast, setForecast] = useState(data && data.forecast ? data.forecast : []);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState(null);
    const [geoLoading, setGeoLoading] = useState(false);

    // Load forecast when city or date changes
    useEffect(() => {
        let mounted = true;

        async function loadForecast() {
            if (!selectedCity.trim()) {
                setForecast([]);
                setError('Please enter a city');
                return;
            }
            setLoading(true);
            setError(null);
            try {
                const res = await apiFetch(`/api/weather?city=${encodeURIComponent(selectedCity)}&date=${encodeURIComponent(selectedDate)}`);
                if (mounted) {
                    setForecast(Array.isArray(res) ? res : []);
                }
            } catch (e) {
                if (mounted) setError(e.message || String(e));
            } finally {
                if (mounted) setLoading(false);
            }
        }

        loadForecast();
        return () => {
            mounted = false;
        };
    }, [selectedCity, selectedDate]);

    // Restore settings from widget config on mount
    useEffect(() => {
        if (config.city) setSelectedCity(config.city);
        if (config.date) setSelectedDate(config.date);
        // eslint-disable-next-line
    }, [id]);

    // Auto-save config when city or date changes
    useEffect(() => {
        if (!selectedCity.trim()) return;
        let ignore = false;
        const save = async () => {
            setSaving(true);
            setSaveError(null);
            try {
                const configToSave = { ...config, city: selectedCity, date: selectedDate, mode };
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
        // eslint-disable-next-line
    }, [selectedCity, selectedDate]);

    // Handle date selection
    const handleDateChange = (e) => {
        setSelectedDate(e.target.value);
    };

    // Handle manual city input
    const handleCityInput = (e) => {
        setSelectedCity(e.target.value);
        setError(null);
    };

    // Geolocation button now just sets the found city in the input
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
                        <input
                            type="text"
                            value={selectedCity}
                            onChange={handleCityInput}
                            placeholder="Enter city"
                            style={{fontSize: 14, minWidth: 120}}
                            disabled={geoLoading}
                        />
                        <button
                            type="button"
                            style={{marginLeft: 8, fontSize: 12, padding: '2px 8px'}}
                            onClick={handleGeolocation}
                            disabled={geoLoading}
                            title="Detect by geolocation"
                        >
                            {geoLoading ? '...' : '📍'}
                        </button>
                    </label>
                    <label style={{display: 'flex', alignItems: 'center', gap: 8}}>
                        Date:
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={handleDateChange}
                            max={new Date().toISOString().slice(0, 10)}
                            style={{fontSize: 14}}
                        />
                    </label>
                    {saving && <span style={{ fontSize: 12, color: '#888' }}>Saving…</span>}
                    {saveError && <div style={{color: '#ef4444', fontSize: 12}}>{saveError}</div>}
                </div>
            </div>
        </div>
    );

    return (
        <Widget id={id} mode={mode} data={{location: selectedCity, forecast}} settings={settingsNode}>
            <div>
                <div style={{fontSize: 12, color: '#666'}}>Location: {selectedCity || '—'} | Date: {selectedDate}</div>
                {loading ? (
                    <div style={{padding: 12}}>Loading…</div>
                ) : error ? (
                    <div style={{padding: 12, color: '#ef4444'}}>Error: {error}</div>
                ) : (
                    <ul style={{paddingLeft: 16, margin: 0}}>
                        {forecast.length ? (
                            forecast.map((f, i) => (
                                <li key={f.timestamp || i} style={{marginBottom: 6}}>
                                    {f.timestamp ? new Date(f.timestamp).toLocaleTimeString([], {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    }) : ''}: <strong>{f.temp}°C</strong> {f.weather_description ? `(${f.weather_description})` : ''}
                                </li>
                            ))
                        ) : (
                            <li>No forecast</li>
                        )}
                    </ul>
                )}
            </div>
        </Widget>
    );
}
