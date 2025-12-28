import React, { useState } from "react";
import AddWidgetPanel from "./AddWidgetPanel";
import { widgetRegistry } from "../widgets/registry";
import "./dashboard.css";

export default function DashboardGrid({
  slotsCount,
  widgets,
  setWidgets,
}) {
  const [addSlot, setAddSlot] = useState(null);

  const slots = Array.from(
    { length: slotsCount },
    (_, i) => i + 1
  );

  const addWidget = (slot, type) => {
    // Inform parent via programmatic event — parent handles server call
    const event = new CustomEvent("add-widget", { detail: type });
    window.dispatchEvent(event);
    setAddSlot(null);
  };

  return (
    <>
      <div className="dashboard-grid">
        {slots.map((slot) => {
          const widgetData = widgets[slot];

          if (widgetData) {
            const Widget =
              widgetRegistry[widgetData.type]
                .component;

            return (
              <div
                key={slot}
                className="widget-slot"
              >
                <Widget configuration={widgetData.configuration} />
              </div>
            );
          }

          return (
            <div
              key={slot}
              className="widget-slot"
            >
              <button
                onClick={() =>
                  setAddSlot(slot)
                }
              >
                + Add widget
              </button>
            </div>
          );
        })}
      </div>

      {addSlot && (
        <AddWidgetPanel
          slot={addSlot}
          onAdd={(type) =>
            addWidget(addSlot, type)
          }
          onClose={() =>
            setAddSlot(null)
          }
        />
      )}
    </>
  );
}
