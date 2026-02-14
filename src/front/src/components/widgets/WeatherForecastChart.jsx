import React from "react";
import WeatherChart from "./WeatherChart";

export default function WeatherForecastChart({rows, series}) {
    if (!rows || rows.length < 2) {
        return null;
    }

    return (
        <div className="weather-chart-box">
            <WeatherChart rows={rows} series={series} />
        </div>
    );
}
