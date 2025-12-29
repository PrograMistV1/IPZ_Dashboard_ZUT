import React, { useEffect, useState } from "react";
import DashboardGrid from "./DashboardGrid";
import DashboardInfoPanel from "./DashboardInfoPanel";
import * as dashboardService from "../../services/dashboard";

export default function Dashboard() {
  const [slotsCount, setSlotsCount] = useState(4);
  const [widgets, setWidgets] = useState({});
  const [dashboardId, setDashboardId] = useState(null);
  const [loading, setLoading] = useState(false);

  const addSlot = () => {
    setSlotsCount((c) => {
      const newCount = Math.min(c + 1, 8);

      if (dashboardId) {
        dashboardService
          .updateDashboard(dashboardId, { slotsCount: newCount })
          .catch((err) =>
            console.error("Failed to update slotsCount", err)
          );
      }

      return newCount;
    });
  };

  const removeSlot = () => {
    setSlotsCount((c) => {
      const newCount = Math.max(c - 1, 1);

      if (dashboardId) {
        dashboardService
          .updateDashboard(dashboardId, { slotsCount: newCount })
          .catch((err) =>
            console.error("Failed to update slotsCount", err)
          );
      }

      return newCount;
    });
  };

  const clearWidget = (slot) => {
    setWidgets((prev) => ({
      ...prev,
      [slot]: null,
    }));
  };

  const mapServerTypeToRegistry = (type) => {
    if (type === "rates") return "currency";
    if (type === "news") return "news";
    return type;
  };

  const loadDashboards = async () => {
    setLoading(true);
    try {
      const list = await dashboardService.getDashboards();
      if (Array.isArray(list) && list.length > 0) {
        const d = list[0];
        setDashboardId(d.id);
        setSlotsCount(d.slotsCount ?? 4);

        const newWidgets = {};
        (d.widgets || []).forEach((w) => {
          const slot = w.position || 1;
          newWidgets[slot] = {
            id: w.id,
            type: mapServerTypeToRegistry(w.type),
            configuration: w.configuration,
            enabled: w.enabled,
            position: w.position,
          };
        });

        setWidgets(newWidgets);
      }
    } catch (err) {
      console.error("Failed to load dashboards", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadDashboards();
  }, []);

  useEffect(() => {
    const handler = async (e) => {
      const freeSlot =
        Object.values(widgets).filter(Boolean).length + 1;

      if (freeSlot <= slotsCount && dashboardId) {
        const selectedType = e.detail;
        let config = {};

        if (selectedType === "news") {
          const category = window.prompt(
            "Enter news category (e.g. tech)",
            "tech"
          );
          if (!category) return;
          config.category = category;
        }

        try {
          const serverType =
            selectedType === "currency" ? "rates" : selectedType;

          const created = await dashboardService.createWidget(
            dashboardId,
            {
              type: serverType,
              configuration: config,
              position: freeSlot,
            }
          );

          setWidgets((prev) => ({
            ...prev,
            [freeSlot]: {
              id: created.id,
              type: mapServerTypeToRegistry(created.type),
              configuration: created.configuration,
              enabled: created.enabled,
              position: created.position,
            },
          }));
        } catch (err) {
          console.error("Failed to create widget", err);
          alert(err.message || "Failed to create widget");
        }
      }
    };

    window.addEventListener("add-widget", handler);
    return () =>
      window.removeEventListener("add-widget", handler);
  }, [widgets, slotsCount, dashboardId]);

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
