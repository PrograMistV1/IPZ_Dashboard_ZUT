import React, {useState} from "react";
import UserMenu from "./UserMenu";
import {useLocation} from "react-router-dom";
import {createWeatherConfig, listWeatherConfigs, updateWeatherConfig} from "../../services/weather";
import {apiFetch} from "../../services/api";
import "./layout.css";

function TopBarCityControl() {
  const [val, setVal] = useState("");
  
  const updateOrCreateWeatherConfig = async (configData) => {
    const list = await listWeatherConfigs().catch(() => []);
    const existing = (list || []).find((c) => c.name === "weather-dashboard");
    if (existing) {
      await updateWeatherConfig(existing.id, configData);
    } else {
      await createWeatherConfig("weather-dashboard", configData);
    }
  };

  const persistCity = async (city) => {
    if (!city) return;
    try {
      await updateOrCreateWeatherConfig({ city });
    } catch (err) {
      console.error(err);
    }
    window.dispatchEvent(new CustomEvent("weather:cityChange", { detail: city }));
  };

  const handleGeolocation = async () => {
    if (!navigator?.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;
      try {
        await updateOrCreateWeatherConfig({ lat, lon });
        try {
          const res = await apiFetch(`/api/geocode/reverse?lat=${lat}&lon=${lon}`);
          window.dispatchEvent(new CustomEvent("weather:cityChange", { detail: res?.name || '' }));
        } catch (e) {
          window.dispatchEvent(new CustomEvent("weather:cityChange", { detail: '' }));
        }
      } catch (err) {
        console.error(err);
        alert('Failed to save location');
      }
    }, (err) => {
      console.error(err);
      alert('Unable to determine location: ' + (err?.message || err?.code || 'unknown'));
    }, { enableHighAccuracy: true, timeout: 10000 });
  };

  return (
    <div className="city-control">
      <button
        className="geo-btn"
        title="Use my location"
        aria-label="Use my location"
        onClick={handleGeolocation}
      >📍</button>
      <input
        value={val}
        onChange={(e) => setVal(e.target.value)}
        placeholder="City"
        onKeyDown={async (e) => {
          if (e.key === "Enter") {
            await persistCity(val);
          }
        }}
      />
      <button
        onClick={async () => {
          await persistCity(val);
        }}
      >
        Set
      </button>
    </div>
  );
}

export default function TopBar() {
  const location = useLocation();
  return (
    <header className="topbar">
      <div className="topbar-left"></div>

      <div className="topbar-right">
        {location.pathname === "/weather" && <TopBarCityControl />}
        <UserMenu />
      </div>
    </header>
  );
}
