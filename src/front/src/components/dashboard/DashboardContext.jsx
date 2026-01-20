import React, { createContext, useContext, useEffect, useState } from "react";
import * as dashboardService from "../../services/dashboard";

const DashboardContext = createContext(null);

const STORAGE_KEY = "lastDashboardId";

export function DashboardProvider({ children }) {
  const [dashboards, setDashboards] = useState([]);
  const [activeDashboardId, setActiveDashboardId] = useState(null);
  const [loading, setLoading] = useState(false);

  // Load dashboards list
  useEffect(() => {
    const loadDashboards = async () => {
      setLoading(true);
      try {
        const list = await dashboardService.getDashboards();
        setDashboards(list || []);

        if (!list || list.length === 0) {
          setActiveDashboardId(null);
          localStorage.removeItem(STORAGE_KEY);
          return;
        }

        const savedId = localStorage.getItem(STORAGE_KEY);
        const exists = list.find((d) => String(d.id) === String(savedId));

        const initialId = exists ? exists.id : list[0].id;
        setActiveDashboardId(initialId);
        localStorage.setItem(STORAGE_KEY, initialId);
      } catch (err) {
        console.error("Failed to load dashboards", err);
      }
      setLoading(false);
    };

    loadDashboards();
  }, []);

  // Change active dashboard
  const changeActiveDashboard = (id) => {
    setActiveDashboardId(id);
    if (id) {
      localStorage.setItem(STORAGE_KEY, id);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  };


  // Create dashboard
  const createDashboard = async (payload) => {
    const created = await dashboardService.createDashboard(payload);
    setDashboards((prev) => [...prev, created]);
    changeActiveDashboard(created.id);
    return created;
  };

  // Delete dashboard
  const deleteDashboard = async (id) => {
  try {
    console.log("[deleteDashboard] Deleting dashboard id:", id);
    await dashboardService.deleteDashboard(id);

    setDashboards((prev) => {
      const newDashboards = prev.filter((d) => String(d.id) !== String(id));
      console.log("[deleteDashboard] Updated dashboards:", newDashboards);

      if (String(activeDashboardId) === String(id)) {
        const next = newDashboards.length > 0 ? newDashboards[0].id : null;
        console.log("[deleteDashboard] Active dashboard deleted, switching to:", next);
        changeActiveDashboard(next);
      }

      return newDashboards;
    });
  } catch (err) {
    console.error("[deleteDashboard] Error deleting dashboard:", err);
  }
};


  return (
    <DashboardContext.Provider
      value={{
        dashboards,
        activeDashboardId,
        setActiveDashboardId: changeActiveDashboard,
        createDashboard,
        deleteDashboard,
        loading,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboards() {
  const ctx = useContext(DashboardContext);
  if (!ctx) {
    throw new Error("useDashboards must be used inside DashboardProvider");
  }
  return ctx;
}
