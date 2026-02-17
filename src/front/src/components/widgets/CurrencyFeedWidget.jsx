import React, {useEffect, useState} from 'react';
import Widget from './Widget';
import {CURRENCY_OPTIONS, DIRECTIONS} from '../../constants/api';
import {updateWidget} from '../../services/dashboard';

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

export default function CurrencyFeedWidget({id, mode = 'feed', data: _data, onUpdate}) {
    const config = _data && (_data.configuration || _data) || {};
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [direction, setDirection] = useState(config.direction || DIRECTIONS[0].value);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState(null);

    useEffect(() => {
        let mounted = true;
        async function load() {
            setLoading(true);
            setError(null);
            try {
                const today = new Date();
                const yesterday = new Date();
                yesterday.setDate(today.getDate() - 1);
                const from = yesterday.toISOString().slice(0, 10);
                const to = today.toISOString().slice(0, 10);
                const promises = CURRENCY_OPTIONS.map(async (code) => {
                    try {
                        const rates = await fetchRates(code, from, to);
                        let value = null, prevValue = null;
                        if (rates.length === 2) {
                            prevValue = Number(rates[0].rate);
                            value = Number(rates[1].rate);
                        } else if (rates.length === 1) {
                            value = Number(rates[0].rate);
                        }
                        return { code, value, prevValue };
                    } catch (e) {
                        return { code, value: null, prevValue: null };
                    }
                });
                const results = await Promise.all(promises);
                if (mounted) setData(results);
            } catch (e) {
                if (mounted) setError(e.message || String(e));
            } finally {
                if (mounted) setLoading(false);
            }
        }
        load();
        return () => { mounted = false; };
    }, []);

    // Save direction to DB on change
    const handleDirectionChange = async (e) => {
        const newDirection = e.target.value;
        setDirection(newDirection);
        setSaving(true);
        setSaveError(null);
        const newConfig = { direction: newDirection };
        try {
            await updateWidget(id, { configuration: newConfig });
            if (typeof onUpdate === 'function') {
                onUpdate(id, newConfig);
            }
        } catch (err) {
            setSaveError('Error saving settings');
        } finally {
            setSaving(false);
        }
    };

    const settingsNode = (
        <div className="widget-settings-portal">
            <div className="widget-settings-inner">
                <strong>Settings — {id}</strong>
                <div style={{ marginTop: 8, display: 'flex', gap: 8, flexDirection: 'column' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        Direction:
                        <select
                            value={direction}
                            onChange={handleDirectionChange}
                            onMouseDown={e => e.stopPropagation()}
                            onPointerDown={e => e.stopPropagation()}
                            disabled={saving}
                        >
                            {DIRECTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                        {saving && <span style={{ fontSize: 12, color: '#888' }}>Saving…</span>}
                    </label>
                    {saveError && <div style={{ color: '#ef4444', fontSize: 12 }}>{saveError}</div>}
                </div>
            </div>
        </div>
    );

    const isHorizontal = direction === 'horizontal';
    const listStyle = isHorizontal
        ? {
            display: 'flex',
            flexDirection: 'row',
            overflowX: 'auto',
            gap: 4,
            padding: 0,
            margin: 0,
            listStyle: 'none',
            alignItems: 'stretch',
            minHeight: 48,
            height: '100%',
        }
        : {
            paddingLeft: 0,
            margin: 0,
            listStyle: 'none',
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            rowGap: 8,
            flex: 1,
            alignItems: 'stretch',
        };
    const itemStyle = isHorizontal
        ? {
            minWidth: 120,
            height: 'auto',
            minHeight: 48,
            marginBottom: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'stretch',
            gap: 4,
            padding: '8px 10px',
            background: '#f7fafc',
            borderRadius: 8,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            marginRight: 0,
            overflow: 'hidden',
            justifyContent: 'center',
            flex: '0 1 auto',
        }
        : {
            minWidth: 120,
            width: 'auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'stretch',
            gap: 4,
            padding: '12px 16px',
            background: '#f7fafc',
            borderRadius: 10,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            justifyContent: 'center',
            flex: '0 1 auto',
        };

    return (
        <Widget id={id} mode={mode} data={data} settings={settingsNode}>
            {loading ? (
                <div style={{ padding: 12 }}>Loading…</div>
            ) : error ? (
                <div style={{ padding: 12, color: '#ef4444' }}>Error: {error}</div>
            ) : (
                <ul style={listStyle}>
                    {Array.isArray(data) && data.length ? (
                        data.map((r, i) => {
                            const code = r.code || '—';
                            const value = r.value != null ? r.value : '—';
                            const prev = r.prevValue;
                            let diff = null, diffStr = '', diffColor = '#888';
                            if (typeof value === 'number' && typeof prev === 'number') {
                                diff = value - prev;
                                if (diff > 0) {
                                    diffStr = `+${diff.toFixed(2)}`;
                                    diffColor = '#10b981'; // green
                                } else if (diff < 0) {
                                    diffStr = `${diff.toFixed(2)}`;
                                    diffColor = '#ef4444'; // red
                                } else {
                                    diffStr = '+0.00';
                                    diffColor = '#888'; // gray
                                }
                            }
                            return (
                                <li key={code + i} style={{
                                    ...itemStyle,
                                    ...(isHorizontal && i === data.length - 1 ? { borderRight: 'none' } : { borderRight: '1px solid #eee' })
                            }}>
                                <div style={{fontWeight: 500, fontSize: 15, minWidth: 38, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>{code}</div>
                                <div style={{display: 'flex', alignItems: 'center', gap: 8, width: '100%'}}>
                                    <span style={{fontWeight: 600, fontSize: 16, maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>{value}</span>
                                    {diff !== null && (
                                        <span style={{color: diffColor, fontWeight: 500, fontSize: 14, maxWidth: 60, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>{diffStr}</span>
                                    )}
                                </div>
                            </li>
                            );
                        })
                    ) : (
                        <li>No currency feed</li>
                    )}
                </ul>
            )}
        </Widget>
    );
}
