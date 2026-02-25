import React, { useState, useRef } from "react";
import { listEconomyConfigs, createEconomyConfig, updateEconomyConfig } from "../../services/economy";
import "./economy.css";
import SmallCurrencyCard from "./SmallCurrencyCard";
import PopularCurrenciesChart from "./PopularCurrenciesChart";
import NewsHeadlines from "./NewsHeadlines";

export default function EconomyDashboard() {
  const available = ["USD", "EUR", "GBP", "CHF", "JPY", "UAH"];
  const [topSelected, setTopSelected] = useState(available.slice(0, 6));
  const [configId, setConfigId] = useState(null);
  const [creating, setCreating] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const firstSaveRef = React.useRef(true);
  const [selectedMain, setSelectedMain] = useState(available[0]);
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
  const allOptions = available; // for now use constants; could come from API

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

  const saveAndReload = async () => {
    if (creating) return;
    try {
      setCreating(true);
      await saveConfig();
      // after saving, re-load from server to reflect canonical state
      await loadConfigs();
    } catch (e) {
      console.error('Save and reload failed', e);
    } finally {
      setCreating(false);
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

  return (
    <div className="economy-dashboard">

      {/* ===== TOP ROW: selectable small cards (scrollable) ===== */}
      <div className="economy-top" ref={topRowRef => { if (!topRowRef) return; if (!window.__economyTopRef) window.__economyTopRef = topRowRef; }}>
        {/* left add tile */}
        <div className="economy-top-item add-tile" onClick={() => setShowAddModal(true)}>
          <div className="add-square">+</div>
        </div>

        {topSelected.map((c, i) => (
          <div key={i} className="economy-top-item">
            <SmallCurrencyCard
              currency={c}
              selected={selectedMain === c}
              options={available}
              onSelect={(newC) => {
                const copy = [...topSelected];
                copy[i] = newC;
                setTopSelected(copy);
              }}
              showPrimaryButton={false}
              onCardClick={(cur)=> setSelectedMain(cur)}
            />
          </div>
        ))}

        {/* scroll arrows */}
        <button className="top-scroll left" onClick={() => {
          const el = document.querySelector('.economy-top'); if (el) el.scrollBy({ left: -220, behavior: 'smooth' });
        }}>{'<'}</button>
        <button className="top-scroll right" onClick={() => {
          const el = document.querySelector('.economy-top'); if (el) el.scrollBy({ left: 220, behavior: 'smooth' });
        }}>{'>'}</button>
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
              {allOptions.filter(c=>c.toLowerCase().includes(search.toLowerCase())).map((c)=> (
                <div key={c} className="add-currency-item" onClick={()=>addCurrencyToTop(c)}>{c}</div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
