import React, { useEffect, useRef, useState } from "react";
import CurrencyLineChart from "./CurrencyLineChart";
import CurrencyCandleChart from "./CurrencyCandleChart";
import "./currencyWidget.css";
import { updateWidget } from "../../services/dashboard";

export default function CurrencyWidget({
  widgetId,
  configuration,
  onUpdate,
}) {
  const isMountedRef = useRef(false);

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

    isMountedRef.current = true;
  }, [widgetId]);

  const fetchRates = async () => {
    setError("");
    setLoading(true);

    try {
      const response = await fetch("http://127.0.0.1:8000/rates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currency,
          date_from: dateFrom,
          date_to: dateTo,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || "Server error");
      }

      const data = await response.json();
      setRates(data.rates || []);
    } catch (err) {
      setError(err.message || "Backend error");
    }

    setLoading(false);
  };

  useEffect(() => {
    if (currency && dateFrom && dateTo) {
      fetchRates();
    }
  }, [currency, dateFrom, dateTo]);

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

    updateWidget(widgetId, { configuration: newConfig });

    if (onUpdate) {
      onUpdate(widgetId, newConfig);
    }
  }, [
    currency,
    dateFrom,
    dateTo,
    showValue,
    showChart,
    showTable,
    chartType,
    widgetId,
  ]);

  const latestRate =
    rates.length > 0 ? rates[rates.length - 1].rate : null;

  return (
    <div className="currency-widget">
      <h3>Currency rates (NBP)</h3>

      <div className="currency-form">
        <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
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

      {loading && <p>Loading...</p>}
      {error && <p className="error">{error}</p>}

      {showValue && latestRate && (
        <div className="currency-value">
          <strong>Current rate:</strong> {latestRate}
        </div>
      )}

      {showChart && chartType === "line" && rates.length > 1 && (
        <CurrencyLineChart rates={rates} />
      )}

      {showChart && chartType === "candle" && rates.length > 1 && (
        <CurrencyCandleChart rates={rates} />
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
