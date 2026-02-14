import React from "react";
import "../../styles/weatherSettings.css";

export default function WeatherSettingsPanel({
    city,
    onCityChange,
    showCurrent,
    onShowCurrentChange,
    showChart,
    onShowChartChange,
    series,
    onSeriesChange,
    onClose,
}) {
    // Find which metric is selected (first one that is true)
    const selectedMetric = Object.keys(series).find(k => series[k]) || "temp";

    return (
        <div className="currency-settings-panel">
            <div className="settings-header">
                <h4>Widget settings</h4>
                <button className="icon-btn" onClick={onClose}>
                    ✕
                </button>
            </div>

            <div className="currency-form">
                <input
                    type="text"
                    placeholder="Enter city name (e.g., Warsaw, London, Tokyo)"
                    value={city}
                    onChange={(e) => onCityChange(e.target.value)}
                />
            </div>

            <div className="currency-toggles">
                <div className="weather-settings-container">
                    <label className="weather-display-mode-label">
                        Display Mode
                    </label>
                    <div className="weather-display-mode-options">
                        <label className="weather-display-mode-option">
                            <input
                                type="radio"
                                name="display-mode"
                                checked={showCurrent && !showChart}
                                onChange={() => {
                                    onShowCurrentChange(true);
                                    onShowChartChange(false);
                                }}
                            />
                            Current Weather
                        </label>
                        <div>
                            <label className="weather-forecast-option">
                                <input
                                    type="radio"
                                    name="display-mode"
                                    checked={!showCurrent && showChart}
                                    onChange={() => {
                                        onShowCurrentChange(false);
                                        onShowChartChange(true);
                                    }}
                                />
                                Forecast Chart
                            </label>
                            {showChart && (
                                <div className="weather-chart-metrics">
                                    {Object.keys(series).map((k) => (
                                        <label key={k} className="weather-chart-metric-option">
                                            <input
                                                type="radio"
                                                name="chart-metric"
                                                checked={selectedMetric === k}
                                                onChange={() => {
                                                    const newSeries = {};
                                                    Object.keys(series).forEach(key => {
                                                        newSeries[key] = key === k;
                                                    });
                                                    onSeriesChange(newSeries);
                                                }}
                                            />
                                            {k.replace(/_/g, " ")}
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
