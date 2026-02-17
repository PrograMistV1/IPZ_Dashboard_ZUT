import React, {useEffect, useMemo, useState} from 'react';
import Widget from './Widget';
import {ChartGrid, generateXLabels, generateYTicks, useContainerDimensions,} from './chartUtils';

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

export default function CurrencyWidget({id, mode = 'standard', data = {}}) {
    const rates = data && data.rates ? data.rates : [];
    const base = data?.base || (rates.length ? rates[0].code : 'USD');

    const [selectedRange, setSelectedRange] = useState(() => data?.range || 'month');
    const rangeToDays = useMemo(() => ({week: 7, month: 30, year: 365}), []);

    // no hard minimums here - let the hook measure the real container size
    const {containerRef, dimensions} = useContainerDimensions(0, 0);
    const [series, setSeries] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // load data for selectedRange (single-currency series)
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
                const res = await fetchRates(base, from, to);
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
    }, [base, selectedRange, rangeToDays]);

    // handle global save-widget-settings as compatibility (in case panel dispatches it)
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
            } catch (err) {
                // ignore
            }
        };
        window.addEventListener('save-widget-settings', handler);
        return () => window.removeEventListener('save-widget-settings', handler);
    }, [id]);

    // settings UI (portalized by Widget)
    const settingsNode = (
        <div className="widget-settings-portal">
            <div className="widget-settings-inner">
                <strong>Period — {id}</strong>
                <div style={{marginTop: 8, display: 'flex', gap: 8}}>
                    <button onClick={() => {
                        setSelectedRange('week');
                        window.dispatchEvent(new CustomEvent('save-widget-settings', {
                            detail: {
                                widgetId: id,
                                settings: {range: 'week'}
                            }
                        }));
                        window.dispatchEvent(new CustomEvent('close-widget-settings', {detail: {widgetId: id}}));
                    }} aria-pressed={selectedRange === 'week'}>Week
                    </button>
                    <button onClick={() => {
                        setSelectedRange('month');
                        window.dispatchEvent(new CustomEvent('save-widget-settings', {
                            detail: {
                                widgetId: id,
                                settings: {range: 'month'}
                            }
                        }));
                        window.dispatchEvent(new CustomEvent('close-widget-settings', {detail: {widgetId: id}}));
                    }} aria-pressed={selectedRange === 'month'}>Month
                    </button>
                    <button onClick={() => {
                        setSelectedRange('year');
                        window.dispatchEvent(new CustomEvent('save-widget-settings', {
                            detail: {
                                widgetId: id,
                                settings: {range: 'year'}
                            }
                        }));
                        window.dispatchEvent(new CustomEvent('close-widget-settings', {detail: {widgetId: id}}));
                    }} aria-pressed={selectedRange === 'year'}>Year
                    </button>
                </div>
            </div>
        </div>
    );

    // chart rendering using chartUtils
    // уменьшенный padding для максимального заполнения графиком
    const padding = {left: 40, top: 8, right: 8, bottom: 8};
    // use exact measured dimensions so svg fills the container
    const width = Math.max(1, dimensions.width);
    const height = Math.max(1, dimensions.height);
    const chartWidth = Math.max(1, width - padding.left - padding.right);
    const chartHeight = Math.max(1, height - padding.top - padding.bottom);

    const n = series.length;

    const scaleX = (i) => padding.left + (n <= 1 ? chartWidth / 2 : (i / (n - 1)) * chartWidth);
    const values = series.map(s => s.value).filter(v => v != null && !isNaN(v));
    const yMin = values.length ? Math.min(...values) : 0;
    const yMax = values.length ? Math.max(...values) : 1;
    const yRange = Math.max(1e-6, yMax - yMin);
    const scaleY = (v) => padding.top + chartHeight - ((v - yMin) / yRange) * chartHeight;

    const pathPoints = series.map((p, i) => `${scaleX(i)},${scaleY(p.value)}`).join(' ');

    const yTicks = generateYTicks(yMin, yRange, scaleY, 4);
    const xLabels = generateXLabels(series, chartWidth, scaleX, 'date');

    return (
        <Widget id={id} mode={mode} data={data} settings={settingsNode} className="widget--chart">
            {/* Make container take full size and allow svg to fill it */}
            <div ref={containerRef} style={{width: '100%', height: '100%', display: 'flex', flex: 1, minHeight: 0}}>
                {loading ? (
                    <div style={{padding: 12}}>Loading chart…</div>
                ) : error ? (
                    <div style={{padding: 12}}>Error: {error}</div>
                ) : (!series || series.length === 0) ? (
                    <div style={{padding: 12}}>No data</div>
                ) : (
                    <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none"
                         style={{width: '100%', height: '100%', display: 'block', flex: 1, minHeight: 0}}>
                        <ChartGrid height={height} padding={padding} yTicks={yTicks} xLabels={xLabels}
                                   chartWidth={chartWidth} chartHeight={chartHeight}/>

                        <polyline points={pathPoints} fill="none" stroke="#2563eb" strokeWidth={2.2}
                                  strokeLinejoin="round" strokeLinecap="round"/>

                        {/* small circles for points */}
                        {series.map((p, i) => (
                            <circle key={p.date} cx={scaleX(i)} cy={scaleY(p.value)} r={2.8} fill="#2563eb"/>
                        ))}
                    </svg>
                )}
            </div>
        </Widget>
    );
}