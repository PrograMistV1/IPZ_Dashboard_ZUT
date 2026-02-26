import React, {useEffect, useMemo, useRef, useState} from 'react';
import { updateWidget } from '../../services/dashboard';
import Widget from './Widget';
import PopularCurrenciesChart from '../economy/PopularCurrenciesChart';
import {CURRENCY_OPTIONS} from '../../constants/api';

async function fetchRates(currency, from, to) {
    const res = await fetch("http://127.0.0.1:8000/rates", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({currency, date_from: from, date_to: to}),
    });
    if (!res.ok) throw new Error('Failed to load rates');
    const data = await res.json();
    return data.rates || [];
}

export default function CurrencyWidget({id, mode = 'standard', data = {}, onUpdate}) {
    const rates = data && data.rates ? data.rates : [];
    const base = data?.base || (rates.length ? rates[0].code : 'USD');

    // --- New state for selected currency ---
    const [selectedCurrency, setSelectedCurrency] = useState(() => data?.currency || base || 'USD');
    const [selectedRange, setSelectedRange] = useState(() => data?.range || 'month');
    const rangeToDays = useMemo(() => ({week: 7, month: 30, year: 365}), []);

    const [series, setSeries] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState(null);

    // Load data when currency or range changes
    useEffect(() => {
        let mounted = true;
        const load = async () => {
            try {
                setLoading(true);
                setError(null);
                const end = new Date();
                const start = new Date();
                const days = rangeToDays[selectedRange] || 30;
                start.setDate(end.getDate() - (days - 1));
                const from = start.toISOString().slice(0, 10);
                const to = end.toISOString().slice(0, 10);
                const res = await fetchRates(selectedCurrency, from, to);
                if (!mounted) return;
                // res expected: [{date:'YYYY-MM-DD', rate: '123.45'}]
                const normalized = (res || []).map(r => ({
                    date: r.date,
                    value: Number(r.rate)
                })).sort((a, b) => a.date.localeCompare(b.date));
                setSeries(normalized);
            } catch (err) {
                if (!mounted) return;
                setError(err.message || String(err));
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        };
        load();
        return () => {
            mounted = false;
        };
    }, [selectedCurrency, selectedRange, rangeToDays]);

    // Handle global save-widget-settings
    useEffect(() => {
        const handler = (e) => {
            try {
                const detail = e?.detail || {};
                if (!detail) return;
                if (String(detail.widgetId) !== String(id)) return;
                const settings = detail.settings || {};
                if (settings.range && ['week', 'month', 'year'].includes(settings.range)) {
                    setSelectedRange(settings.range);
                }
                if (settings.currency && CURRENCY_OPTIONS.includes(settings.currency)) {
                    setSelectedCurrency(settings.currency);
                }
            } catch (err) {
                // ignore
            }
        };
        window.addEventListener('save-widget-settings', handler);
        return () => window.removeEventListener('save-widget-settings', handler);
    }, [id]);

    // --- Settings UI ---
    const settingsNode = (
        <div className="widget-settings-portal">
            <div className="widget-settings-inner">
                <strong>Settings — {id}</strong>
                <div style={{marginTop: 8, display: 'flex', gap: 8, flexDirection: 'column'}}>
                    <label style={{display: 'flex', alignItems: 'center', gap: 8}}>
                        Currency:
                        <select
                            className="currency-select"
                            value={selectedCurrency}
                            onChange={async e => {
                                const newCur = e.target.value;
                                setSelectedCurrency(newCur);
                                setSaving(true);
                                setSaveError(null);
                                const newConfig = { ...data, currency: newCur, range: selectedRange, mode: data?.mode || mode };
                                try {
                                    await updateWidget(id, { configuration: newConfig });
                                    if (typeof onUpdate === 'function') onUpdate(id, newConfig);
                                    window.dispatchEvent(new CustomEvent('save-widget-settings', {
                                        detail: { widgetId: id, settings: { currency: newCur, range: selectedRange } }
                                    }));
                                } catch (err) {
                                    setSaveError('Error saving settings');
                                } finally {
                                    setSaving(false);
                                }
                            }}
                            onMouseDown={e => e.stopPropagation()}
                            onPointerDown={e => e.stopPropagation()}
                        >
                            {CURRENCY_OPTIONS.map(cur => (
                                <option key={cur} value={cur}>{cur}</option>
                            ))}
                        </select>
                        {saving && <span style={{ fontSize: 12, color: '#888' }}>Saving…</span>}
                        {saveError && <div style={{ color: '#ef4444', fontSize: 12 }}>{saveError}</div>}
                    </label>
                    <div style={{display: 'flex', gap: 8}}>
                        <button onClick={async () => {
                            const newRange = 'week';
                            setSelectedRange(newRange);
                            setSaving(true);
                            setSaveError(null);
                            const newConfig = { ...data, currency: selectedCurrency, range: newRange, mode: data?.mode || mode };
                            try {
                                await updateWidget(id, { configuration: newConfig });
                                if (typeof onUpdate === 'function') onUpdate(id, newConfig);
                                window.dispatchEvent(new CustomEvent('save-widget-settings', {
                                    detail: { widgetId: id, settings: { range: newRange, currency: selectedCurrency } }
                                }));
                            } catch (err) {
                                setSaveError('Error saving settings');
                            } finally {
                                setSaving(false);
                            }
                        }} aria-pressed={selectedRange === 'week'}>Week
                        </button>
                        <button onClick={async () => {
                            const newRange = 'month';
                            setSelectedRange(newRange);
                            setSaving(true);
                            setSaveError(null);
                            const newConfig = { ...data, currency: selectedCurrency, range: newRange, mode: data?.mode || mode };
                            try {
                                await updateWidget(id, { configuration: newConfig });
                                if (typeof onUpdate === 'function') onUpdate(id, newConfig);
                                window.dispatchEvent(new CustomEvent('save-widget-settings', {
                                    detail: { widgetId: id, settings: { range: newRange, currency: selectedCurrency } }
                                }));
                            } catch (err) {
                                setSaveError('Error saving settings');
                            } finally {
                                setSaving(false);
                            }
                        }} aria-pressed={selectedRange === 'month'}>Month
                        </button>
                        <button onClick={async () => {
                            const newRange = 'year';
                            setSelectedRange(newRange);
                            setSaving(true);
                            setSaveError(null);
                            const newConfig = { ...data, currency: selectedCurrency, range: newRange, mode: data?.mode || mode };
                            try {
                                await updateWidget(id, { configuration: newConfig });
                                if (typeof onUpdate === 'function') onUpdate(id, newConfig);
                                window.dispatchEvent(new CustomEvent('save-widget-settings', {
                                    detail: { widgetId: id, settings: { range: newRange, currency: selectedCurrency } }
                                }));
                            } catch (err) {
                                setSaveError('Error saving settings');
                            } finally {
                                setSaving(false);
                            }
                        }} aria-pressed={selectedRange === 'year'}>Year
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    // compute days for PopularCurrenciesChart
    const days = useMemo(() => ({week: 7, month: 30, year: 365}[selectedRange] || 30), [selectedRange]);

    return (
        <Widget id={id} mode={mode} data={data} settings={settingsNode} className="widget--chart">
            <div style={{width: '100%', height: '100%', display: 'flex', flex: 1, minHeight: 0, position: 'relative'}}>
                <div
                    style={{
                        position: 'absolute',
                        top: 8,
                        left: 0,
                        width: '100%',
                        textAlign: 'center',
                        fontWeight: 600,
                        fontSize: 18,
                        color: '#111',
                        letterSpacing: 1,
                        pointerEvents: 'none',
                        zIndex: 2,
                        textShadow: '0 1px 4px #fff',
                    }}
                >
                    {selectedCurrency}
                </div>
                <div style={{width: '100%', height: '100%', display: 'flex', flex: 1, minHeight: 0}}>
                    {loading ? (
                        <div style={{padding: 12}}>Loading chart…</div>
                    ) : error ? (
                        <div style={{padding: 12}}>Error: {error}</div>
                    ) : (!series || series.length === 0) ? (
                        <div style={{padding: 12}}>No data</div>
                    ) : (
                        <PopularCurrenciesChart currencies={[selectedCurrency]} days={days} highlight={selectedCurrency} />
                    )}
                </div>
            </div>
        </Widget>
    );
}