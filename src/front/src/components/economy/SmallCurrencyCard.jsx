import React, { useEffect, useRef, useState } from "react";
import { CURRENCY_OPTIONS } from "../../constants/api";

export default function SmallCurrencyCard({ currency, selected, onSelect, onPrimaryClick, options = CURRENCY_OPTIONS, showPrimaryButton = true, onCardClick }) {
  const [rate, setRate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

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

  useEffect(() => {
    const onDoc = (e) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);

  const handleSelect = (c) => {
    setOpen(false);
    onSelect?.(c);
  };

  return (
    <div ref={rootRef} className={"economy-small-card" + (selected ? " selected" : "")}>
      <div
        className="card-main"
        onClick={() => { if (onCardClick) return onCardClick(currency); setOpen((v) => !v); }}
        onDoubleClick={() => setOpen((v) => !v)}
        role="button"
        tabIndex={0}
      >
        <div className="currency-name">{currency}</div>
        <div className="currency-rate">{loading ? "…" : error ? "—" : rate ?? "—"}</div>
      </div>

      {showPrimaryButton && (
        <button className="card-primary-btn" title="Show in main chart" onClick={() => onPrimaryClick?.(currency)}>›</button>
      )}

      {open && (
        <div className="card-dropdown">
          {options.map((c) => (
            <div key={c} className="card-dropdown-item" onClick={() => handleSelect(c)}>
              {c}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
