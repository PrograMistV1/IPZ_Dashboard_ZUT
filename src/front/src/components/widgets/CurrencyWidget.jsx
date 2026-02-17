import React, {useCallback, useEffect, useState} from 'react';
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

const RANGE_TO_DAYS = {week: 7, month: 30, year: 365};

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

function getDefaultBase(data, rates) {
    return data?.base || (rates.length ? rates[0].code : 'USD');
}

function normalizeRates(res) {
    return (res || []).map(r => ({
        date: r.date,
        value: Number(r.rate)
    })).sort((a, b) => a.date.localeCompare(b.date));
}

export default function CurrencyWidget({id, mode = 'standard', data = {}}) {
    const rates = data && data.rates ? data.rates : [];
    const base = getDefaultBase(data, rates);

    const [selectedRange, setSelectedRange] = useState(() => data?.range || 'month');
    const [series, setSeries] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        let mounted = true;
        const load = async () => {
            try {
                setLoading(true);
                setError(null);
                const end = new Date();
                const start = new Date();
                const days = RANGE_TO_DAYS[selectedRange] || 30;
                start.setDate(end.getDate() - (days - 1));
                const from = start.toISOString().slice(0, 10);
                const to = end.toISOString().slice(0, 10);
                const res = await fetchRates(base, from, to);
                if (!mounted) return;
                setSeries(normalizeRates(res));
            } catch (err) {
                if (!mounted) return;
                setError(err.message || String(err));
            } finally {
                if (mounted) setLoading(false);
            }
        };
        load();
        return () => {
            mounted = false;
        };
    }, [base, selectedRange]);

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

    const handleRangeChange = useCallback((range) => {
        setSelectedRange(range);
        window.dispatchEvent(new CustomEvent('save-widget-settings', {
            detail: {
                widgetId: id,
                settings: {range}
            }
        }));
        window.dispatchEvent(new CustomEvent('close-widget-settings', {detail: {widgetId: id}}));
    }, [id]);

    const settingsNode = (
        <div className="widget-settings-portal">
            <div className="widget-settings-inner">
                <strong>Period — {id}</strong>
                <div style={{marginTop: 8, display: 'flex', gap: 8}}>
                    <button onClick={() => handleRangeChange('week')} aria-pressed={selectedRange === 'week'}>Week
                    </button>
                    <button onClick={() => handleRangeChange('month')} aria-pressed={selectedRange === 'month'}>Month
                    </button>
                    <button onClick={() => handleRangeChange('year')} aria-pressed={selectedRange === 'year'}>Year
                    </button>
                </div>
            </div>
        </div>
    );

    const padding = {left: 40, top: 8, right: 8, bottom: 32};
    const width = 400;
    const height = 250;
    const chartData = series.map((point) => ({x: point.date, y: point.value}));

    return (
        <Widget id={id} mode={mode} data={data} settings={settingsNode} className="widget--chart">
            <div style={{width: '100%', height: '100%', display: 'flex', flex: 1, minHeight: 0}}>
                <div style={{width: '100%', height: '100%', display: 'flex', flex: 1, minHeight: 0}}>
                    {loading ? (
                        <div style={{padding: 12}}>Loading chart…</div>
                    ) : error ? (
                        <div style={{padding: 12}}>Error: {error}</div>
                    ) : (!series || series.length === 0) ? (
                        <div style={{padding: 12}}>No data</div>
                    ) : (
                        <VictoryChart
                            theme={VictoryTheme.material}
                            width={width}
                            height={height}
                            padding={padding}
                            domainPadding={{y: 10}}
                            style={{parent: {height: '100%', width: '100%', display: 'flex', flex: 1, minHeight: 0}}}
                            containerComponent={
                                <VictoryVoronoiContainer
                                    labels={({datum}) => `${datum.x}\n${datum.y}`}
                                    labelComponent={
                                        <VictoryTooltip
                                            flyoutStyle={{fill: '#fff', stroke: '#2563eb', strokeWidth: 1}}
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
                            />
                            <VictoryAxis
                                style={{
                                    tickLabels: {fontSize: 10, padding: 4, angle: -45}
                                }}
                                fixLabelOverlap
                            />
                            <VictoryLine
                                name="line"
                                data={chartData}
                                style={{data: {stroke: '#2563eb', strokeWidth: 2.2}}}
                                voronoiBlacklist={["line"]}
                            />
                            <VictoryScatter
                                name="points"
                                data={chartData}
                                size={3.5}
                                style={{data: {fill: '#2563eb'}}}
                            />
                        </VictoryChart>
                    )}
                </div>
            </div>
        </Widget>
    );
}