import React, { useEffect, useState } from "react";
import CurrencyLineChart from "./CurrencyLineChart";
import "./currencyWidget.css";
import { updateWidget } from "../../services/dashboard";

export default function CurrencyWidget({ widgetId, configuration }) {
  const [currency, setCurrency] = useState(configuration?.currency || "");
  const [dateFrom, setDateFrom] = useState(configuration?.dateFrom || "");
  const [dateTo, setDateTo] = useState(configuration?.dateTo || "");
  const [rates, setRates] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [showValue, setShowValue] = useState(configuration?.showValue ?? false);
  const [showChart, setShowChart] = useState(configuration?.showChart ?? false);
  const [showTable, setShowTable] = useState(configuration?.showTable ?? false);

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
    updateWidget(widgetId, {
      configuration: {
       currency,
       dateFrom,
       dateTo,
       showValue,
       showChart,
       showTable,
      },
    });
  }, [showValue, showChart, showTable]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currency) {
      setError("Select currency first");
      return;
    }

    await fetchRates();

    await updateWidget(widgetId, {
      configuration: {
        currency,
        dateFrom,
        dateTo,
        showValue,
        showChart,
        showTable,
      },
    });
  };

  const latestRate =
    rates.length > 0 ? rates[rates.length - 1].rate : null;

  return (
    <div className="currency-widget">
      <h3>Currency rates (NBP)</h3>

      <form onSubmit={handleSubmit} className="currency-form">
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
          required
        />

        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          required
        />

        <button type="submit">Fetch</button>
      </form>

      <div className="currency-toggles">
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
            checked={showChart}
            onChange={() => setShowChart((v) => !v)}
          />
          Chart
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

      {showChart && rates.length > 1 && (
        <CurrencyLineChart rates={rates} />
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
