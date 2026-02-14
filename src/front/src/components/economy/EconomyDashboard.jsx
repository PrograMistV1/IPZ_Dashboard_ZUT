import React, {useState} from "react";
import {createEconomyConfig, listEconomyConfigs, updateEconomyConfig} from "../../services/economy";
import "../../styles/economy.css";
import SmallCurrencyCard from "./SmallCurrencyCard";
import PopularCurrenciesChart from "./PopularCurrenciesChart";
import NewsHeadlines from "./NewsHeadlines";

export default function EconomyDashboard() {
  const available = ["USD", "EUR", "GBP", "CHF", "JPY", "UAH"];
  const [topSelected, setTopSelected] = useState(available.slice(0, 6));
  const [configId, setConfigId] = useState(null);

  // load saved config on mount
  React.useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const list = await listEconomyConfigs();
        if (!mounted) return;
        const cfg = list.find((c) => c.name === "economy-dashboard") || list[0];
        if (cfg) {
          setConfigId(cfg.id);
          const conf = cfg.configuration || {};
          if (Array.isArray(conf.topSelected) && conf.topSelected.length) {
            setTopSelected(conf.topSelected);
          }
        }
      } catch (err) {
        // ignore
      }
    };
    load();
    return () => (mounted = false);
  }, []);

  const saveConfig = async (newTop) => {
    const payload = { name: "economy-dashboard", configuration: { topSelected: newTop } };
    try {
      if (configId) {
        await updateEconomyConfig(configId, { configuration: payload.configuration });
      } else {
        const created = await createEconomyConfig(payload);
        if (created?.id) setConfigId(created.id);
      }
    } catch (err) {
      console.error("Failed to save config", err);
    }
  };

  return (
    <div className="economy-dashboard">

      {/* ===== TOP ROW: selectable small cards ===== */}
      <div className="economy-top">
        {topSelected.map((c, i) => (
          <SmallCurrencyCard
            key={i}
            currency={c}
            selected={false}
            options={available}
            onSelect={(newC) => {
              const copy = [...topSelected];
              copy[i] = newC;
              setTopSelected(copy);
              saveConfig(copy);
            }}
          />
        ))}
      </div>

      {/* ===== MIDDLE AREA (2 COLUMNS) ===== */}
      <div className="economy-main">

        {/* LEFT COLUMN: chart only (removed bottom bar) */}
        <div className="economy-left-column">
          <div className="economy-widget wide chart-container">
            <PopularCurrenciesChart currencies={topSelected} days={30} highlight={topSelected[0]} />
          </div>
        </div>

        {/* RIGHT COLUMN: business news headlines */}
        <div className="economy-widget side news-column">
          <NewsHeadlines category="business" />
        </div>

      </div>

    </div>
  );
}
