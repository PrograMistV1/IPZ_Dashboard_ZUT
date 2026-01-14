import React, { useState } from "react";
import AddWidgetPanel from "./AddWidgetPanel";
import { widgetRegistry } from "../widgets/registry";
import "./dashboard.css";

export default function DashboardGrid({
  slotsCount,
  widgets,
  onReorder,
  onWidgetUpdate,
}) {
  const [openSlots, setOpenSlots] = useState({});
  const [draggedSlot, setDraggedSlot] = useState(null);

  const slots = Array.from({ length: slotsCount }, (_, i) => i + 1);

  const openAddPanel = (slot) => {
    setOpenSlots((prev) => ({ ...prev, [slot]: true }));
  };

  const closeAddPanel = (slot) => {
    setOpenSlots((prev) => {
      const copy = { ...prev };
      delete copy[slot];
      return copy;
    });
  };

  const addWidget = (slot, type, config) => {
    console.log("DISPATCH add-widget", { slot, type, config });
  
    window.dispatchEvent(
      new CustomEvent("add-widget", {
        detail: { type, slot, config },
      })
    );
  
    closeAddPanel(slot);
  };
  
  

  const onDragStart = (slot) => {
    setDraggedSlot(slot);
  };

  const onDragOver = (e) => {
    e.preventDefault();
  };

  const onDrop = (targetSlot) => {
    if (draggedSlot === null || draggedSlot === targetSlot) return;

    const slotsMap = slots.map((s) => ({
      position: s,
      widget: widgets[s] || null,
    }));

    const fromIndex = slotsMap.findIndex(
      (w) => w.position === draggedSlot
    );
    const toIndex = slotsMap.findIndex(
      (w) => w.position === targetSlot
    );

    if (fromIndex === -1 || toIndex === -1) return;

    const [moving] = slotsMap.splice(fromIndex, 1);
    slotsMap.splice(toIndex, 0, moving);

    setDraggedSlot(null);

    onReorder?.(
      slotsMap.map((w, i) => ({
        position: i + 1,
        widget: w.widget || null,
      }))
    );
  };

  return (
    <div className="dashboard-grid">
      {slots.map((slot) => {
        const widgetData = widgets[slot];
        const isAdding = openSlots[slot];

        return (
          <div
            key={widgetData ? `widget-${widgetData.id}` : `empty-${slot}`}
            className="widget-slot"
            draggable
            onDragStart={() => onDragStart(slot)}
            onDragOver={onDragOver}
            onDrop={() => onDrop(slot)}
          >
            {widgetData ? (
              (() => {
                const Widget =
                  widgetRegistry[widgetData.type]?.component;
                if (!Widget) return null;

                return (
                  <Widget
                    widgetId={widgetData.id}
                    configuration={widgetData.configuration}
                    onUpdate={onWidgetUpdate}
                  />
                );
              })()
            ) : !isAdding ? (
              <button onClick={() => openAddPanel(slot)}>
                + Add widget
              </button>
            ) : (
              <AddWidgetPanel
                slot={slot}
                onAdd={(type) => addWidget(slot, type)}
                onClose={() => closeAddPanel(slot)}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
