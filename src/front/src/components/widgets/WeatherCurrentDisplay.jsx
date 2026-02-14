import React from "react";

export default function WeatherCurrentDisplay({currentPoint}) {
    if (!currentPoint) {
        return null;
    }

    return (
        <div className="weather-current">
            <div className="current-temp">
                <span className="temp-value">
                    {Math.round(currentPoint.temp)}°C
                </span>
                <span className="weather-description">
                    {currentPoint?.["weather_description"]
                        ? currentPoint["weather_description"].replace(/^\w/, (c) =>
                              c.toUpperCase()
                          )
                        : currentPoint["weather_main"] || ""}
                </span>
            </div>
            <div className="current-details">
                <div className="detail">
                    <span className="label">Feels like:</span>
                    <span className="value">
                        {Math.round(currentPoint.feels_like)}°C
                    </span>
                </div>
                <div className="detail">
                    <span className="label">Pressure:</span>
                    <span className="value">
                        {currentPoint.pressure} hPa
                    </span>
                </div>
                <div className="detail">
                    <span className="label">Humidity:</span>
                    <span className="value">
                        {currentPoint.humidity}%
                    </span>
                </div>
                <div className="detail">
                    <span className="label">Wind speed:</span>
                    <span className="value">
                        {currentPoint.wind_speed} m/s
                    </span>
                </div>
            </div>
        </div>
    );
}
