import React, { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import DashboardGrid from "./DashboardGrid";
import DashboardInfoPanel from "./DashboardInfoPanel";
import * as dashboardService from "../../services/dashboard";
import { tokenManager } from "../../services/tokenManager";

export default function Dashboard() {
  const { setDashboardInfo } = useOutletContext() || {};

  const [slotsCount, setSlotsCount] = useState(4);
  const [widgets, setWidgets] = useState({});
  const [dashboardId, setDashboardId] = useState(null);
  const [loading, setLoading] = useState(false);

  const addSlot = async () => {
    if (!dashboardId || slotsCount >= 8) return;

    const newCount = slotsCount + 1;
    setSlotsCount(newCount);

    try {
      await dashboardService.updateDashboard(dashboardId, {
        slotsCount: newCount,
      });
    } catch (err) {
      console.error("Failed to update slotsCount", err);
    }
  };

  const removeSlot = async () => {
    if (!dashboardId || slotsCount <= 1) return;

    const lastSlot = slotsCount;
    const widget = widgets[lastSlot];
    const token = tokenManager.get();
    if (!token) return;

    if (widget) {
      await fetch(
        `http://127.0.0.1:8000/api/dashboards/${dashboardId}/widgets/${widget.id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setWidgets((prev) => {
        const copy = { ...prev };
        delete copy[lastSlot];
        return copy;
      });
    }

    const newCount = slotsCount - 1;
    setSlotsCount(newCount);

    try {
      await dashboardService.updateDashboard(dashboardId, {
        slotsCount: newCount,
      });
    } catch (err) {
      console.error("Failed to update slotsCount", err);
    }
  };

  const clearWidget = async (slot) => {
    const widget = widgets[slot];
    if (!widget || !dashboardId) return;

    const token = tokenManager.get();
    if (!token) return;

    await fetch(
      `http://127.0.0.1:8000/api/dashboards/${dashboardId}/widgets/${widget.id}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    setWidgets((prev) => {
      const copy = { ...prev };
      delete copy[slot];
      return copy;
    });
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
          if (w.position) {
            newWidgets[w.position] = {
              id: w.id,
              type: mapServerTypeToRegistry(w.type),
              configuration: w.configuration,
              enabled: w.enabled,
              position: w.position,
            };
          }
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
      if (!dashboardId) return;

      const { type, slot } = e.detail || {};
      if (!type || !slot) return;
      if (slot > slotsCount || widgets[slot]) return;

      let config = {};

      if (type === "news") {
        const category = window.prompt(
          "Enter news category (e.g. tech)",
          "tech"
        );
        if (!category) return;
        config.category = category;
      }

      try {
        const serverType = type === "currency" ? "rates" : type;

        const created = await dashboardService.createWidget(dashboardId, {
          type: serverType,
          configuration: config,
          position: slot,
        });

        setWidgets((prev) => ({
          ...prev,
          [slot]: {
            id: created.id,
            type: mapServerTypeToRegistry(created.type),
            configuration: created.configuration,
            enabled: created.enabled,
            position: created.position,
          },
        }));
      } catch (err) {
        console.error("Failed to create widget", err);
      }
    };

    window.addEventListener("add-widget", handler);
    return () => window.removeEventListener("add-widget", handler);
  }, [dashboardId, slotsCount, widgets]);

  const updateWidgetLocal = (widgetId, newConfig) => {
    setWidgets((prev) => {
      const copy = { ...prev };
      Object.keys(copy).forEach((slot) => {
        if (copy[slot]?.id === widgetId) {
          copy[slot] = {
            ...copy[slot],
            configuration: newConfig,
          };
        }
      });
      return copy;
    });
  };

  const handleReorder = async (orderedSlots) => {
    if (!dashboardId) return;

    const newWidgets = {};
    orderedSlots.forEach((w, i) => {
      const position = i + 1;
      if (w.widget) {
        newWidgets[position] = {
          ...widgets[w.widget.position],
          position,
        };
      }
    });

    setWidgets(newWidgets);

    const token = tokenManager.get();
    if (!token) return;

    try {
      await fetch(
        `http://127.0.0.1:8000/api/dashboards/${dashboardId}/widgets/reorder`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            widgets: orderedSlots
              .filter((w) => w.widget?.id)
              .map((w, i) => ({
                id: w.widget.id,
                position: i + 1,
              })),
          }),
        }
      );
    } catch (err) {
      console.error("Failed to reorder widgets", err);
    }
  };

  useEffect(() => {
    if (!setDashboardInfo) return;

    setDashboardInfo({
      slotsCount,
      widgets,
      onAddSlot: addSlot,
      onRemoveSlot: removeSlot,
      onClearWidget: clearWidget,
    });
  }, [slotsCount, widgets]);

  return (
    <>
      <DashboardGrid
        slotsCount={slotsCount}
        widgets={widgets}
        onReorder={handleReorder}
        onWidgetUpdate={updateWidgetLocal}
      />

      {/*
      <DashboardInfoPanel
        slotsCount={slotsCount}
        widgets={widgets}
        onAddSlot={addSlot}
        onRemoveSlot={removeSlot}
        onClearWidget={clearWidget}
      />
      */}
    </>
  );
}
