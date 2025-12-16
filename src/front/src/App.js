import React, { useState } from "react";
import "./App.css";
import Login from "./Login";
import Register from "./Register";

function App() {
  const [currency, setCurrency] = useState("USD");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [rates, setRates] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [mode, setMode] = useState("login");

  if (!user) {
    if (mode === "login") {
      return <Login onLogin={setUser} onRegister={() => setMode("register")} />;
    }
    return <Register onBackToLogin={() => setMode("login")} />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setRates([]);
    setLoading(true);

    const payload = {
      currency: currency,
      date_from: dateFrom,
      date_to: dateTo,
    };

    try {
      const response = await fetch("http://127.0.0.1:8000/rates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const err = await response.json();
        setError(err.detail || "Błąd serwera");
        setLoading(false);
        return;
      }

      const data = await response.json();
      setRates(data.rates);
    } catch (err) {
      setError("Błąd połączenia z backendem");
    }

    setLoading(false);
  };

  return (
    <div className="container">
      <h1>Kursy walut NBP</h1>

      <form onSubmit={handleSubmit} className="form">
        <label>Waluta:</label>
        <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
          <option value="USD">USD</option>
          <option value="EUR">EUR</option>
          <option value="GBP">GBP</option>
          <option value="CHF">CHF</option>
          <option value="JPY">JPY</option>
        </select>

        <label>Data od:</label>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          required
        />

        <label>Data do:</label>
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          required
        />

        <button type="submit">Pobierz</button>
      </form>

      {loading && <p>Ładowanie...</p>}
      {error && <p className="error">{error}</p>}

      {rates.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Data</th>
              <th>Kurs</th>
            </tr>
          </thead>
          <tbody>
            {rates.map((item, idx) => (
              <tr key={idx}>
                <td>{item.date}</td>
                <td>{item.rate}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default App;
