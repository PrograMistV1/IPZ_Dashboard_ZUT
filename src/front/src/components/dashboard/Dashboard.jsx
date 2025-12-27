import React, { useEffect, useState } from "react";
import DashboardGrid from "./DashboardGrid";
import DashboardInfoPanel from "./DashboardInfoPanel";

export default function Dashboard() {
  const [slotsCount, setSlotsCount] = useState(4);
  const [widgets, setWidgets] = useState({});

  const addSlot = () =>
    setSlotsCount((c) => Math.min(c + 1, 8));

  const removeSlot = () =>
    setSlotsCount((c) => Math.max(c - 1, 1));

  const clearWidget = (slot) => {
    setWidgets((prev) => ({
      ...prev,
      [slot]: null,
    }));
  };

  // 🔗 слушаем события от Sidebar (временно)
  useEffect(() => {
    const handler = (e) => {
      const freeSlot =
        Object.values(widgets).filter(Boolean)
          .length + 1;

      if (freeSlot <= slotsCount) {
        setWidgets((prev) => ({
          ...prev,
          [freeSlot]: {
            type: e.detail,
          },
        }));
      }
    };

    window.addEventListener(
      "add-widget",
      handler
    );
    return () =>
      window.removeEventListener(
        "add-widget",
        handler
      );
  }, [widgets, slotsCount]);

  return (
    <>
      <DashboardGrid
        slotsCount={slotsCount}
        widgets={widgets}
        setWidgets={setWidgets}
      />

      <DashboardInfoPanel
        slotsCount={slotsCount}
        widgets={widgets}
        onAddSlot={addSlot}
        onRemoveSlot={removeSlot}
        onClearWidget={clearWidget}
      />
    </>
  );
}
