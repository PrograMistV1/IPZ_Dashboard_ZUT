import React, { useState } from "react";
import { widgetRegistry } from "../widgets/registry";
import "./dashboard.css";

export default function AddWidgetPanel({
  slot,
  onAdd,
  onClose,
}) {
  const [type, setType] =
    useState(null);

  const confirm = () => {
    if (!type) return;
    onAdd(type);
  };

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h3>Add widget (Slot {slot})</h3>

        {Object.entries(
          widgetRegistry
        ).map(([key, w]) => (
          <button
            key={key}
            onClick={() =>
              setType(key)
            }
            className={
              type === key
                ? "active"
                : ""
            }
          >
            {w.title}
          </button>
        ))}

        <div className="panel-actions">
          <button
            onClick={confirm}
            disabled={!type}
          >
            Add
          </button>
          <button onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
