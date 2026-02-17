import React, {useEffect, useMemo, useRef, useState} from 'react';
import Widget from './Widget';
import {
    VictoryAxis,
    VictoryChart,
    VictoryLine,
    VictoryScatter,
    VictoryTheme,
    VictoryTooltip,
    VictoryVoronoiContainer
} from 'victory';
import {CURRENCY_OPTIONS} from '../../constants/api';

async function fetchRates(currency, from, to) {
    const res = await fetch("http://127.0.0.1:8000/rates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currency, date_from: from, date_to: to }),
    });
    if (!res.ok) throw new Error('Failed to load rates');
    const data = await res.json();
    return data.rates || [];
}

export default function CurrencyWidget({ id, mode = 'standard', data = {} }) {
    const rates = data && data.rates ? data.rates : [];
    const base = data?.base || (rates.length ? rates[0].code : 'USD');

    // --- New state for selected currency ---
    const [selectedCurrency, setSelectedCurrency] = useState(() => data?.currency || base || 'USD');
    const [selectedRange, setSelectedRange] = useState(() => data?.range || 'month');
    const rangeToDays = useMemo(() => ({ week: 7, month: 30, year: 365 }), []);

    const [series, setSeries] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

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
                <div style={{ marginTop: 8, display: 'flex', gap: 8, flexDirection: 'column' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        Currency:
                        <select
                            value={selectedCurrency}
                            onChange={e => {
                                setSelectedCurrency(e.target.value);
                                window.dispatchEvent(new CustomEvent('save-widget-settings', {
                                    detail: {
                                        widgetId: id,
                                        settings: { currency: e.target.value, range: selectedRange }
                                    }
                                }));
                                window.dispatchEvent(new CustomEvent('close-widget-settings', { detail: { widgetId: id } }));
                            }}
                            onMouseDown={e => e.stopPropagation()}
                            onPointerDown={e => e.stopPropagation()}
                        >
                            {CURRENCY_OPTIONS.map(cur => (
                                <option key={cur} value={cur}>{cur}</option>
                            ))}
                        </select>
                    </label>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => {
                            setSelectedRange('week');
                            window.dispatchEvent(new CustomEvent('save-widget-settings', {
                                detail: {
                                    widgetId: id,
                                    settings: { range: 'week', currency: selectedCurrency }
                                }
                            }));
                            window.dispatchEvent(new CustomEvent('close-widget-settings', { detail: { widgetId: id } }));
                        }} aria-pressed={selectedRange === 'week'}>Week
                        </button>
                        <button onClick={() => {
                            setSelectedRange('month');
                            window.dispatchEvent(new CustomEvent('save-widget-settings', {
                                detail: {
                                    widgetId: id,
                                    settings: { range: 'month', currency: selectedCurrency }
                                }
                            }));
                            window.dispatchEvent(new CustomEvent('close-widget-settings', { detail: { widgetId: id } }));
                        }} aria-pressed={selectedRange === 'month'}>Month
                        </button>
                        <button onClick={() => {
                            setSelectedRange('year');
                            window.dispatchEvent(new CustomEvent('save-widget-settings', {
                                detail: {
                                    widgetId: id,
                                    settings: { range: 'year', currency: selectedCurrency }
                                }
                            }));
                            window.dispatchEvent(new CustomEvent('close-widget-settings', { detail: { widgetId: id } }));
                        }} aria-pressed={selectedRange === 'year'}>Year
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    // --- Dynamic chart size ---
    const chartContainerRef = useRef(null);
    const [chartSize, setChartSize] = useState({ width: 400, height: 250 });

    useEffect(() => {
        const node = chartContainerRef.current;
        if (!node) return;
        function updateSize() {
            setChartSize({
                width: node.clientWidth || 400,
                height: node.clientHeight || 250
            });
        }
        updateSize();
        const resizeObserver = new window.ResizeObserver(updateSize);
        resizeObserver.observe(node);
        return () => resizeObserver.disconnect();
    }, []);

    // Chart rendering using Victory
    const padding = { left: 40, top: 8, right: 8, bottom: 32 };
    const width = chartSize.width;
    const height = chartSize.height;

    const chartData = series.map((point) => ({ x: point.date, y: point.value }));

    return (
        <Widget id={id} mode={mode} data={data} settings={settingsNode} className="widget--chart">
            <div style={{ width: '100%', height: '100%', display: 'flex', flex: 1, minHeight: 0 }} ref={chartContainerRef}>
                <div style={{ width: '100%', height: '100%', display: 'flex', flex: 1, minHeight: 0 }}>
                    {loading ? (
                        <div style={{ padding: 12 }}>Loading chart…</div>
                    ) : error ? (
                        <div style={{ padding: 12 }}>Error: {error}</div>
                    ) : (!series || series.length === 0) ? (
                        <div style={{ padding: 12 }}>No data</div>
                    ) : (
                        <VictoryChart
                            theme={VictoryTheme.material}
                            width={width}
                            height={height}
                            padding={padding}
                            domainPadding={{ y: 10 }}
                            style={{ parent: { height: '100%', width: '100%', display: 'flex', flex: 1, minHeight: 0 } }}
                            containerComponent={
                                <VictoryVoronoiContainer
                                    labels={({ datum }) => `${datum.x}\n${datum.y}`}
                                    labelComponent={
                                        <VictoryTooltip
                                            flyoutStyle={{ fill: '#fff', stroke: '#2563eb', strokeWidth: 1 }}
                                            style={{ fontSize: 13, fill: '#222' }}
                                            pointerLength={8}
                                            cornerRadius={4}
                                            constrainToVisibleArea
                                            dx={0}
                                            dy={-24}
                                        />
                                    }
                                    voronoiDimension="x"
                                    voronoiBlacklist={["line"]}
                                />
                            }
                        >
                            <VictoryAxis
                                dependentAxis
                                style={{
                                    axis: { stroke: '#888' },
                                    tickLabels: { fontSize: 10, padding: 4 }
                                }}
                            />
                            <VictoryAxis
                                style={{
                                    axis: { stroke: '#888' },
                                    tickLabels: { fontSize: 10, padding: 4, angle: -45 }
                                }}
                                fixLabelOverlap
                            />
                            <VictoryLine
                                name="line"
                                data={chartData}
                                style={{ data: { stroke: '#2563eb', strokeWidth: 2.2 } }}
                                voronoiBlacklist={["line"]}
                            />
                            <VictoryScatter
                                name="points"
                                data={chartData}
                                size={3.5}
                                style={{ data: { fill: '#2563eb' } }}
                            />
                        </VictoryChart>
                    )}
                </div>
            </div>
        </Widget>
    );
}