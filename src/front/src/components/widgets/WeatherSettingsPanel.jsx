import React from "react";

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
                <div style={{display: "block"}}>
                    <label style={{display: "block", marginBottom: "8px", color: "#ddd", fontSize: "13px"}}>
                        Display Mode
                    </label>
                    <div style={{display: "flex", flexDirection: "column", gap: "8px", paddingLeft: "16px"}}>
                        <label style={{display: "flex", alignItems: "center", gap: "6px"}}>
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
                            <label style={{display: "flex", alignItems: "center", gap: "6px"}}>
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
                                <div style={{marginTop: "8px", marginLeft: "24px", display: "flex", gap: "8px", flexWrap: "wrap"}}>
                                    {Object.keys(series).map((k) => (
                                        <label key={k} style={{display: "flex", alignItems: "center", gap: "6px"}}>
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
