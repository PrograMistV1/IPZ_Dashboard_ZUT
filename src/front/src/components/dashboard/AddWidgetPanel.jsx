import React, { useState } from "react";
import { widgetRegistry } from "../widgets/registry";
import MiniActionModal from "./MiniActionModal";
import WeatherModal from "./WeatherModal";
import "./dashboard.css";

export default function AddWidgetPanel({
  slot,
  onAdd,
  onClose,
}) {
  const [type, setType] = useState(null);
  const [newsCategory, setNewsCategory] = useState(null);
  const [weatherConfig, setWeatherConfig] = useState(null);
  const [showNewsModal, setShowNewsModal] = useState(false);
  const [showWeatherModal, setShowWeatherModal] = useState(false);

  const canAdd =
    type && (type !== "news" || newsCategory) && (type !== "weather" || weatherConfig);

  const handleTypeClick = (key) => {
    if (key === "news") {
      setType("news");
      setShowNewsModal(true);
    } else if (key === "weather") {
      setType("weather");
      setShowWeatherModal(true);
    } else {
      setType(key);
      setNewsCategory(null);
    }
  };

  return (
    <>
      <div className="add-widget-panel">
        <div className="add-widget-title">
          Add widget (Slot {slot})
        </div>

        <div className="add-widget-grid">
          {Object.entries(widgetRegistry).map(([key, w]) => (
            <button
              key={key}
              onClick={() => handleTypeClick(key)}
              className={
                type === key
                  ? "widget-type active"
                  : "widget-type"
              }
            >
              {w.title}
            </button>
          ))}

          <button
            className="widget-action"
            disabled={!canAdd}
            onClick={() => {
              let cfg = {};
              if (type === "news") cfg = { category: newsCategory };
              else if (type === "weather") cfg = weatherConfig || {};
              onAdd(type, cfg);
            }}
          >
            Add
          </button>

          <button
            className="widget-action"
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </div>

      {showNewsModal && (
        <MiniActionModal
          onSelect={(category) => {
            setNewsCategory(category);
            setShowNewsModal(false);
          }}
        />
      )}

      {showWeatherModal && (
        <WeatherModal
          onSelect={(cfg) => {
            setWeatherConfig(cfg);
            setShowWeatherModal(false);
          }}
          onCancel={() => {
            setType(null);
            setWeatherConfig(null);
            setShowWeatherModal(false);
          }}
        />
      )}
    </>
  );
}
