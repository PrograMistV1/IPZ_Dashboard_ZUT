import React, { useState } from "react";
import UserMenu from "./UserMenu";
import { useLocation } from "react-router-dom";
import { createWeatherConfig, listWeatherConfigs, updateWeatherConfig } from "../../services/weather";
import "./layout.css";

function TopBarCityControl() {
  const [val, setVal] = useState("");
  return (
    <div className="city-control">
      <input
        value={val}
        onChange={(e) => setVal(e.target.value)}
        placeholder="City"
        onKeyDown={async (e) => {
          if (e.key === "Enter" && val) {
            try {
              const list = await listWeatherConfigs().catch(() => []);
              const existing = (list || []).find((c) => c.name === "weather-dashboard");
              if (existing) {
                await updateWeatherConfig(existing.id, { city: val });
              } else {
                await createWeatherConfig("weather-dashboard", { city: val });
              }
            } catch (err) {
              console.error(err);
            }
            window.dispatchEvent(new CustomEvent('weather:cityChange', { detail: val }));
          }
        }}
      />
      <button
        onClick={async () => {
          if (!val) return;
          try {
            const list = await listWeatherConfigs().catch(() => []);
            const existing = (list || []).find((c) => c.name === "weather-dashboard");
            if (existing) {
              await updateWeatherConfig(existing.id, { city: val });
            } else {
              await createWeatherConfig("weather-dashboard", { city: val });
            }
          } catch (err) {
            console.error(err);
          }
          window.dispatchEvent(new CustomEvent('weather:cityChange', { detail: val }));
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
