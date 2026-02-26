import React, { useEffect, useState } from "react";
import { CURRENCY_OPTIONS } from "../../constants/api";

export default function SmallCurrencyCard({ currency, selected, onSelect, onPrimaryClick, options = CURRENCY_OPTIONS, showPrimaryButton = true, onCardClick }) {
  const [rate, setRate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const today = new Date().toISOString().slice(0, 10);
        const res = await fetch("http://127.0.0.1:8000/rates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ currency, date_from: today, date_to: today }),
        });
        const data = await res.json();
        if (!mounted) return;
        const last = (data.rates || []).slice(-1)[0];
        setRate(last ? last.rate : null);
      } catch (err) {
        if (!mounted) return;
        setError(err.message || String(err));
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => (mounted = false);
  }, [currency]);

  const handleClick = () => {
    if (onCardClick) onCardClick(currency);
  };

  return (
    <div
      className={"economy-small-card" + (selected ? " selected" : "")}
      onClick={handleClick}
      role={onCardClick ? "button" : undefined}
      tabIndex={onCardClick ? 0 : undefined}
      onKeyPress={(e) => {
        if (!onCardClick) return;
        if (e.key === "Enter" || e.key === " ") onCardClick(currency);
      }}
    >
      <div className="card-main">
        <div className="currency-name">{currency}</div>
        <div className="currency-rate">{loading ? "…" : error ? "—" : rate ?? "—"}</div>
      </div>
    </div>
  );
}
