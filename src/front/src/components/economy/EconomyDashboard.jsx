import React, { useState, useRef } from "react";
import { listEconomyConfigs, createEconomyConfig, updateEconomyConfig } from "../../services/economy";
import "./economy.css";
import SmallCurrencyCard from "./SmallCurrencyCard";
import PopularCurrenciesChart from "./PopularCurrenciesChart";
import NewsHeadlines from "./NewsHeadlines";
import { FULL_CURRENCY_LIST } from '../../constants/api';

export default function EconomyDashboard() {
  const available = FULL_CURRENCY_LIST; // array of {code,label}
  const topRowRef = useRef(null);
  const [topSelected, setTopSelected] = useState(available.slice(0, 6).map(o => o.code));
  const [configId, setConfigId] = useState(null);
  const [creating, setCreating] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const firstSaveRef = React.useRef(true);
  const [selectedMain, setSelectedMain] = useState(available[0]?.code || 'USD');
  const [days, setDays] = useState(365);

  // load saved config (exposed so user can refresh without reloading page)
  const loadConfigs = React.useCallback(async () => {
    try {
      const list = await listEconomyConfigs();
      const cfg = list.find((c) => c.name === "economy-dashboard");
      // skip saving while applying loaded config
      firstSaveRef.current = true;
      if (cfg) {
        setConfigId(cfg.id);
        const conf = cfg.configuration || {};
        if (Array.isArray(conf.topSelected) && conf.topSelected.length) {
          setTopSelected(conf.topSelected);
        }
        if (conf.selectedMain) setSelectedMain(conf.selectedMain);
        // do not restore days from config (timeframe buttons should not be persisted)
      }
    } catch (err) {
      // ignore
    } finally {
      setLoaded(true);
    }
  }, []);

  React.useEffect(() => {
    let mounted = true;
    if (mounted) loadConfigs();
    return () => (mounted = false);
  }, [loadConfigs]);

  // add-currency modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [search, setSearch] = useState("");
  const allOptions = available; // array of {code,label}

  const addCurrencyToTop = (cur) => {
    setTopSelected((prev) => {
      const filtered = prev.filter((p) => p !== cur);
      return [cur, ...filtered];
    });
    setShowAddModal(false);
  };

  const saveConfig = async () => {
    if (creating) return;
    const payload = { name: "economy-dashboard", configuration: { topSelected, selectedMain } };
    try {
      if (configId) {
        const res = await updateEconomyConfig(configId, { configuration: payload.configuration });
        return res;
      } else {
        setCreating(true);
        const created = await createEconomyConfig(payload);
        if (created && created.id) setConfigId(created.id);
        setCreating(false);
        return created;
      }
    } catch (err) {
      setCreating(false);
      console.error("Failed to save config", err);
      throw err;
    }
  };

  // persist only topSelected and selectedMain when they change (replace config)
  React.useEffect(() => {
    if (!loaded) return; // wait until initial load completes
    if (firstSaveRef.current) {
      firstSaveRef.current = false; // skip initial effect run after load
      return;
    }
    saveConfig();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMain, topSelected, loaded]);

  const scrollTopRow = (delta) => {
    const el = topRowRef.current;
    if (!el) return;
    el.scrollBy({ left: delta, behavior: 'smooth' });
  };

  return (
    <div className="economy-dashboard">

      {/* ===== TOP ROW: selectable small cards (scrollable) ===== */}
      <div className="economy-top-wrap">
        <button className="top-scroll left" onClick={() => scrollTopRow(-220)}>{'<'}</button>
        <div className="economy-top" ref={topRowRef}>
          {/* left add tile */}
          <div className="economy-top-item add-tile" onClick={() => setShowAddModal(true)}>
            <div className="add-square">+</div>
          </div>

          {topSelected.map((c, i) => (
            <div key={i} className="economy-top-item">
              <SmallCurrencyCard
                currency={c}
                selected={selectedMain === c}
                options={available.map(o => o.code)}
                onSelect={(newC) => {
                  const copy = [...topSelected];
                  copy[i] = newC;
                  setTopSelected(copy);
                }}
                showPrimaryButton={false}
                onCardClick={(cur) => setSelectedMain(cur)}
              />
            </div>
          ))}
        </div>
        <button className="top-scroll right" onClick={() => scrollTopRow(220)}>{'>'}</button>
      </div>

      {/* ===== MIDDLE AREA (2 COLUMNS) ===== */}
      <div className="economy-main">

        {/* LEFT COLUMN: big chart with controls */}
        <div className="economy-left-column">
          <div className="economy-widget wide chart-header">
            <div className="chart-top-controls">
              <div className="chart-selected">
                <div className="selected-label">Top Stock</div>
                <div className="selected-value">{selectedMain}</div>
              </div>
              <div className="chart-timeframe">
                <button className={days===3? 'active':''} onClick={()=>setDays(3)}>3D</button>
                <button className={days===7? 'active':''} onClick={()=>setDays(7)}>7D</button>
                <button className={days===30? 'active':''} onClick={()=>setDays(30)}>1M</button>
                <button className={days===180? 'active':''} onClick={()=>setDays(180)}>6M</button>
                <button className={days===365? 'active':''} onClick={()=>setDays(365)}>1Y</button>
              </div>
            </div>
            <div className="chart-container">
              <PopularCurrenciesChart currencies={[selectedMain]} days={days} highlight={selectedMain} />
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: stacked news boxes */}
        <div className="economy-widget side news-column stacked-news">
          <NewsHeadlines category="business" limit={3} />
        </div>

      </div>

      {/* Add Currency Modal (centered) */}
      {showAddModal && (
        <div className="add-currency-modal">
          <div className="add-currency-panel">
            <button className="modal-close" onClick={()=>setShowAddModal(false)} aria-label="Close">×</button>
            <h3>Add currency</h3>
            <input className="add-currency-search" placeholder="Search" value={search} onChange={(e)=>setSearch(e.target.value)} />
            <div className="add-currency-list">
              {allOptions
                .filter(o => o.label.toLowerCase().includes(search.toLowerCase()))
                .map((o) => (
                  <div key={o.code} className="add-currency-item" onClick={() => addCurrencyToTop(o.code)}>{o.label}</div>
                ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
