import React from "react";
import { useDashboards } from "../dashboard/DashboardContext";
import UserMenu from "./UserMenu";
import "./layout.css";

export default function TopBar() {
  const {
    dashboards,
    activeDashboardId,
    setActiveDashboardId,
    createDashboard,
    deleteDashboard,
    loading,
  } = useDashboards();

  console.log("[TopBar] dashboards:", dashboards);
  console.log("[TopBar] activeDashboardId:", activeDashboardId);

  const handleCreate = async () => {
    const name = prompt("New dashboard name");
    if (!name) return;
    try {
      await createDashboard({ name });
    } catch (err) {
      console.error("Failed to create dashboard", err);
    }
  };

  const handleDelete = async () => {
    if (!activeDashboardId) return;

    const current = dashboards.find(
      (d) => String(d.id) === String(activeDashboardId)
    );

    const ok = window.confirm(
      `Delete dashboard "${current?.name || "Dashboard"}"?`
    );
    if (!ok) return;

    try {
      await deleteDashboard(activeDashboardId);
    } catch (err) {
      console.error("Failed to delete dashboard", err);
    }
  };

  return (
    <header className="topbar">
      <div className="topbar-controls">
        <select
          className="topbar-select"
          value={activeDashboardId ? String(activeDashboardId) : ""}
          disabled={loading || dashboards.length === 0}
          onChange={(e) => setActiveDashboardId(e.target.value)}
        >
          {dashboards.map((d) => (
            <option key={d.id} value={String(d.id)}>
              {d.name || `Dashboard ${d.id}`}
            </option>
          ))}
        </select>

        <button
          className="topbar-btn danger"
          onClick={handleDelete}
          disabled={!activeDashboardId || dashboards.length <= 1}
        >
          Delete
        </button>
      </div>

      <div className="topbar-right">
        <UserMenu />
      </div>
    </header>
  );
}
