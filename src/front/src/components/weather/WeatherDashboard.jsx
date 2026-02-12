import React, { useState } from "react";
import { listEconomyConfigs, createEconomyConfig, updateEconomyConfig } from "../../services/economy";
import "./weather.css";

export default function WeatherDashboard() {
  // placeholder scaffold, similar to EconomyDashboard but empty for now
  const [configId, setConfigId] = useState(null);

  React.useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        // reuse economy service for config listing until dedicated service exists
        const list = await listEconomyConfigs();
        if (!mounted) return;
        const cfg = list.find((c) => c.name === "weather-dashboard") || list[0];
        if (cfg) setConfigId(cfg.id);
      } catch (err) {
        // ignore for scaffold
      }
    };
    load();
    return () => (mounted = false);
  }, []);

  return (
    <div className="weather-dashboard">
      <div className="weather-placeholder">
        <h3>Weather Dashboard (template)</h3>
        <p>This is a scaffolded dashboard for weather widgets — empty for now.</p>
      </div>
    </div>
  );
}
