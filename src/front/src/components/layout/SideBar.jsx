import React, { useState } from "react";
import { useDashboards } from "../dashboard/DashboardContext";

import dashboardIcon from "../../assets/icons/dashboard.png";
import dashboardInfoIcon from "../../assets/icons/dashboard-info.png";
import economyIcon from "../../assets/icons/economy.png";

import "./layout.css";

export default function SideBar() {
  const [open, setOpen] = useState(false);

  const {
    dashboards,
    activeDashboardId,
    setActiveDashboardId,
    createDashboard,
    deleteDashboard,
    loading,
  } = useDashboards();

  const handleCreate = async () => {
    const name = prompt("New dashboard name");
    if (!name) return;

    try {
      await createDashboard({ name });
    } catch (err) {
      console.error("Failed to create dashboard", err);
    }
  };

  const handleDelete = async (id) => {
    const current = dashboards.find((d) => String(d.id) === String(id));

    const ok = window.confirm(
      `Delete dashboard "${current?.name || "Dashboard"}"?`
    );
    if (!ok) return;

    try {
      await deleteDashboard(id);
    } catch (err) {
      console.error("Failed to delete dashboard", err);
    }
  };

  return (
    <aside
      className="sidebar"
      onMouseLeave={() => setOpen(false)}
    >
      {/* ===== HEADER ===== */}
      <div className="sidebar-header">
        <span className="sidebar-app-icon">
          <img src={dashboardIcon} alt="Dashboard" />
        </span>
        <span className="sidebar-title">Dashboard</span>
      </div>

      {/* ===== MENU ===== */}
      <ul className="sidebar-menu">

        {/* ===== DASHBOARD CUSTOM (ACCORDION) ===== */}
        <li
          className="sidebar-item sidebar-accordion"
          onClick={() => setOpen((v) => !v)}
        >
          <span className="sidebar-menu-icon">
            <img src={dashboardInfoIcon} alt="Dashboard custom" />
          </span>

          <span className="label">Dashboard custom</span>

          <span className={`accordion-arrow ${open ? "open" : ""}`}>
            ▾
          </span>
        </li>

        {open && (
          <ul className="sidebar-submenu">

            {/* ===== LIST OF DASHBOARDS ===== */}
            {dashboards.map((d) => (
              <li
                key={d.id}
                className={`sidebar-subitem ${
                  String(d.id) === String(activeDashboardId) ? "active" : ""
                }`}
              >
                <span
                  className="sidebar-subitem-title"
                  onClick={() => setActiveDashboardId(d.id)}
                >
                  {d.name || `Dashboard ${d.id}`}
                </span>

                <button
                  className="sidebar-subitem-delete"
                  onClick={() => handleDelete(d.id)}
                  disabled={dashboards.length <= 1}
                  title="Delete dashboard"
                >
                  ✕
                </button>
              </li>
            ))}

            {/* ===== ADD DASHBOARD (ALWAYS LAST) ===== */}
            <li
              className="sidebar-subitem add-dashboard"
              onClick={handleCreate}
            >
              + Add dashboard
            </li>

          </ul>
        )}

        {/* ===== ECONOMY ===== */}
        <li className="sidebar-item">
          <span className="sidebar-menu-icon economy-icon">
            <img src={economyIcon} alt="Economy" />
          </span>
          <span className="label">Economy</span>
        </li>

      </ul>
    </aside>
  );
}
