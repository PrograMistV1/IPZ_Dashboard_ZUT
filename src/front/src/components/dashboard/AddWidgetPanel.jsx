import React, { useState } from "react";
import { widgetRegistry } from "../widgets/registry";
import "./dashboard.css";

export default function AddWidgetPanel({
  slot,
  onAdd,
  onClose,
}) {
  const [type, setType] = useState(null);

  return (
    <div className="add-widget-panel">
      <div className="add-widget-title">
        Add widget (Slot {slot})
      </div>

      <div className="add-widget-grid">
        {Object.entries(widgetRegistry).map(
          ([key, w]) => (
            <button
              key={key}
              onClick={() => setType((prev) => (prev === key ? null : key))}
              className={
                type === key
                  ? "widget-type active"
                  : "widget-type"
              }
            >
              {w.title}
            </button>
          )
        )}

        <button
          className="widget-action"
          disabled={!type}
          onClick={() => onAdd(type)}
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
  );
}