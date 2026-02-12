import React, {useCallback, useEffect, useRef, useState} from "react";
import CurrencyLineChart from "./CurrencyLineChart";
import CurrencyCandleChart from "./CurrencyCandleChart";
import "../../styles/currencyWidget.css";
import {updateWidget} from "../../services/dashboard";

export default function CurrencyWidget({
                                           widgetId,
                                           configuration,
                                           onUpdate,
                                           enabled = true,
                                           onDelete,
                                       }) {
    const isMountedRef = useRef(false);
    const initialConfigRef = useRef(null);

    const [editing, setEditing] = useState(false);

    const [currency, setCurrency] = useState("");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [rates, setRates] = useState([]);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const [showValue, setShowValue] = useState(false);
    const [showChart, setShowChart] = useState(false);
    const [showTable, setShowTable] = useState(false);
    const [chartType, setChartType] = useState("line");

    useEffect(() => {
        if (!widgetId) return;

        setCurrency(configuration?.currency || "");
        setDateFrom(configuration?.dateFrom || "");
        setDateTo(configuration?.dateTo || "");
        setShowValue(configuration?.showValue ?? false);
        setShowChart(configuration?.showChart ?? false);
        setShowTable(configuration?.showTable ?? false);
        setChartType(configuration?.chartType || "line");
        setRates([]);
        setError("");
 
        if (initialConfigRef.current === null) {
            initialConfigRef.current = configuration || null;
        }

        isMountedRef.current = true;
    }, [widgetId]);

    const fetchRates = useCallback(async () => {
        setError("");
        setLoading(true);

        try {
            const response = await fetch("http://127.0.0.1:8000/rates", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({
                    currency,
                    date_from: dateFrom,
                    date_to: dateTo,
                }),
            });

            if (!response.ok) {
                const err = await response.json();
                console.error("Error fetching rates:", err);
                setError(err.detail || "Backend error");
                setLoading(false);
                return;
            }

            const data = await response.json();
            setRates(data.rates || []);
        } catch (err) {
            console.error("Error fetching rates:", err);
            setError(err.message);
            setLoading(false);
        }

        setLoading(false);
    }, [currency, dateFrom, dateTo]);

    useEffect(() => {
        if (currency && dateFrom && dateTo && enabled) {
            fetchRates().then(() => {
            });
        }
    }, [currency, dateFrom, dateTo, fetchRates, enabled]);

    useEffect(() => {
        if (!widgetId || !isMountedRef.current) return;

        const newConfig = {
            currency,
            dateFrom,
            dateTo,
            showValue,
            showChart,
            showTable,
            chartType,
        };

        try {
            const prev = initialConfigRef.current || {};
            const prevJson = JSON.stringify(prev || {});
            const newJson = JSON.stringify(newConfig || {});
            if (prevJson === newJson) {
                return;
            }
        } catch (err) {
        }

        if (!newConfig.currency && !newConfig.dateFrom && !newConfig.dateTo) {
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
        currency,
        dateFrom,
        dateTo,
        showValue,
        showChart,
        showTable,
        chartType,
        widgetId,
        enabled,
    ]);

    const latestRate =
        rates.length > 0 ? rates[rates.length - 1].rate : null;

    if (!enabled) {
        return (
            <div className="currency-widget disabled">
                <div className="currency-header">
                    <h3>Currency rates (NBP)</h3>
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
                <h3>Currency rates (NBP)</h3>

                <div className="currency-actions">
                    <button
                        className="icon-btn"
                        title="Settings"
                        onClick={() => setEditing(true)}
                    >
                        ⚙
                    </button>

                    <button
                        className="icon-btn danger"
                        title="Delete"
                        onClick={() => {
                            if (
                                window.confirm(
                                    "Are you sure you want to delete this widget?"
                                )
                            ) {
                                onDelete?.();
                            }
                        }}
                    >
                        🗑
                    </button>
                </div>
            </div>

            {/* ===== SETTINGS PANEL ===== */}
            {editing && (
                <div className="currency-settings-panel">
                    <div className="settings-header">
                        <h4>Widget settings</h4>
                        <button
                            className="icon-btn"
                            onClick={() => setEditing(false)}
                        >
                            ✕
                        </button>
                    </div>

                    <div className="currency-form">
                        <select
                            value={currency}
                            onChange={(e) => setCurrency(e.target.value)}
                        >
                            <option value="" disabled>
                                Select currency
                            </option>
                            <option value="USD">USD</option>
                            <option value="EUR">EUR</option>
                            <option value="GBP">GBP</option>
                            <option value="CHF">CHF</option>
                            <option value="JPY">JPY</option>
                        </select>

                        <input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                        />

                        <input
                            type="date"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                        />
                    </div>

                    <div className="currency-toggles">
                        <label>
                            <input
                                type="checkbox"
                                checked={showChart}
                                onChange={() => setShowChart((v) => !v)}
                            />
                            Chart
                        </label>

                        {showChart && (
                            <>
                                <label>
                                    <input
                                        type="radio"
                                        checked={chartType === "line"}
                                        onChange={() => setChartType("line")}
                                    />
                                    Line
                                </label>

                                <label>
                                    <input
                                        type="radio"
                                        checked={chartType === "candle"}
                                        onChange={() => setChartType("candle")}
                                    />
                                    Candle
                                </label>
                            </>
                        )}

                        <label>
                            <input
                                type="checkbox"
                                checked={showValue}
                                onChange={() => setShowValue((v) => !v)}
                            />
                            Value
                        </label>

                        <label>
                            <input
                                type="checkbox"
                                checked={showTable}
                                onChange={() => setShowTable((v) => !v)}
                            />
                            Table
                        </label>
                    </div>
                </div>
            )}

            {/* ===== CONTENT ===== */}
            {loading && <p>Loading...</p>}
            {error && <p className="error">{error}</p>}

            {showValue && latestRate && (
                <div className="currency-value">
                    <strong>Current rate:</strong> {latestRate}
                </div>
            )}

            {showChart && rates.length > 1 && (
                <div className="currency-chart-box">
                    {chartType === "line" && (
                        <CurrencyLineChart rates={rates}/>
                    )}
                    {chartType === "candle" && (
                        <CurrencyCandleChart rates={rates}/>
                    )}
                </div>
            )}

            {showTable && rates.length > 0 && (
                <table className="currency-table">
                    <thead>
                    <tr>
                        <th>Date</th>
                        <th>Rate</th>
                    </tr>
                    </thead>
                    <tbody>
                    {rates.map((r, i) => (
                        <tr key={i}>
                            <td>{r.date}</td>
                            <td>{r.rate}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}
