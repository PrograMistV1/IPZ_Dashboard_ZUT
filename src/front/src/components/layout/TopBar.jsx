import React, {useState} from "react";
import UserMenu from "./UserMenu";
import {useLocation} from "react-router-dom";
import {createWeatherConfig, listWeatherConfigs, updateWeatherConfig} from "../../services/weather";
import "./layout.css";

function TopBarCityControl() {
  const [val, setVal] = useState("");
  const persistCity = async (city) => {
    if (!city) return;
    try {
      const list = await listWeatherConfigs().catch(() => []);
      const existing = (list || []).find((c) => c.name === "weather-dashboard");
      if (existing) {
        await updateWeatherConfig(existing.id, { city });
      } else {
        await createWeatherConfig("weather-dashboard", { city });
      }
    } catch (err) {
      console.error(err);
    }
    window.dispatchEvent(new CustomEvent("weather:cityChange", { detail: city }));
  };

  return (
    <div className="city-control">
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
