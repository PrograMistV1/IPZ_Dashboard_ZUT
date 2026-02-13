import React, {useCallback, useEffect, useRef, useState} from "react";
import FeedWidget, {CurrencyFeedItem} from "./FeedWidget";
import {updateWidget} from "../../services/dashboard";

const CURRENCIES = ["USD", "EUR", "GBP", "CHF", "JPY", "AUD", "CAD", "SEK", "NOK", "DKK"];

export default function CurrencyFeedWidget({
                                               widgetId,
                                               configuration,
                                               onDelete,
                                               onUpdate,
                                           }) {
    const [rates, setRates] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedCurrencies, setSelectedCurrencies] = useState(
        configuration?.currencies || ["USD", "EUR", "GBP"]
    );
    const [scrollDirection, setScrollDirection] = useState(configuration?.scrollDirection || "vertical");

    const initialLoadRef = useRef(true);
    const previousConfigRef = useRef(JSON.stringify({currencies: selectedCurrencies, scrollDirection}));

    // Fetch current rates for all selected currencies
    const fetchRates = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const today = new Date().toISOString().split("T")[0];
            const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

            const ratesData = await Promise.all(
                selectedCurrencies.map(async (currency) => {
                    try {
                        const response = await fetch("http://127.0.0.1:8000/rates", {
                            method: "POST",
                            headers: {"Content-Type": "application/json"},
                            body: JSON.stringify({
                                currency,
                                date_from: yesterday,
                                date_to: today,
                            }),
                        });

                        if (!response.ok) return null;

                        const data = await response.json();
                        const ratesList = data.rates || [];

                        if (ratesList.length === 0) return null;

                        const latest = ratesList[ratesList.length - 1];
                        const previous = ratesList.length > 1 ? ratesList[ratesList.length - 2] : latest;

                        return {
                            id: currency,
                            code: currency,
                            rate: latest.rate,
                            change: latest.rate - previous.rate,
                            date: latest.date,
                        };
                    } catch {
                        return null;
                    }
                })
            );

            setRates(ratesData.filter(Boolean));
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [selectedCurrencies]);

    useEffect(() => {
        fetchRates();
    }, [fetchRates]);

    // Save configuration
    useEffect(() => {
        if (!widgetId) return;

        const currentConfig = JSON.stringify({currencies: selectedCurrencies, scrollDirection});

        if (initialLoadRef.current) {
            initialLoadRef.current = false;
            previousConfigRef.current = currentConfig;
            return;
        }

        if (previousConfigRef.current === currentConfig) return;
        previousConfigRef.current = currentConfig;

        const newConfig = {currencies: selectedCurrencies, scrollDirection};
        updateWidget(widgetId, {configuration: newConfig})
            .then(() => onUpdate?.(widgetId, newConfig))
            .catch((err) => console.error("Error updating widget:", err));
    }, [selectedCurrencies, scrollDirection, widgetId, onUpdate]);

    const toggleCurrency = (currency) => {
        setSelectedCurrencies((prev) => {
            if (prev.includes(currency)) {
                return prev.filter((c) => c !== currency);
            }
            return [...prev, currency];
        });
    };

    const settingsPanel = (
        <div className="feed-settings-content">
            <label style={{display: "block", marginBottom: "8px", color: "#ddd", fontSize: "13px"}}>
                Select currencies
            </label>
            <div style={{display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "12px"}}>
                {CURRENCIES.map((currency) => (
                    <button
                        key={currency}
                        onClick={() => toggleCurrency(currency)}
                        style={{
                            padding: "6px 10px",
                            borderRadius: "4px",
                            border: "1px solid #5a5a5a",
                            background: selectedCurrencies.includes(currency) ? "#2563eb" : "#4a4a4a",
                            color: "#fff",
                            fontSize: "12px",
                            cursor: "pointer",
                        }}
                    >
                        {currency}
                    </button>
                ))}
            </div>

            <label style={{display: "block", marginBottom: "8px", color: "#ddd", fontSize: "13px"}}>
                Scroll Direction
            </label>
            <div style={{display: "flex", gap: "8px"}}>
                <button
                    onClick={() => setScrollDirection("vertical")}
                    style={{
                        flex: 1,
                        padding: "8px",
                        borderRadius: "4px",
                        border: "1px solid #5a5a5a",
                        background: scrollDirection === "vertical" ? "#2563eb" : "#4a4a4a",
                        color: "#fff",
                        fontSize: "13px",
                        cursor: "pointer",
                    }}
                >
                    ↕ Vertical
                </button>
                <button
                    onClick={() => setScrollDirection("horizontal")}
                    style={{
                        flex: 1,
                        padding: "8px",
                        borderRadius: "4px",
                        border: "1px solid #5a5a5a",
                        background: scrollDirection === "horizontal" ? "#2563eb" : "#4a4a4a",
                        color: "#fff",
                        fontSize: "13px",
                        cursor: "pointer",
                    }}
                >
                    ↔ Horizontal
                </button>
            </div>
        </div>
    );

    return (
        <FeedWidget
            title="Currency Rates"
            ItemComponent={CurrencyFeedItem}
            items={rates}
            loading={loading}
            onDelete={onDelete}
            onSettings={() => {
            }}
            settingsPanel={settingsPanel}
            emptyMessage={error || "No rates available"}
            scrollDirection={scrollDirection}
        />
    );
}
