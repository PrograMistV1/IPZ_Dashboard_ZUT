import React, { useState } from "react";
import DashboardInfoPanel from "../dashboard/DashboardInfoPanel";

import dashboardIcon from "../../assets/icons/dashboard.png";
import dashboardInfoIcon from "../../assets/icons/dashboard-info.png";

import "./layout.css";

export default function SideBar({ dashboardInfo }) {
  const [open, setOpen] = useState(false);

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
        <li
          className="sidebar-item"
          onClick={() => setOpen(v => !v)}
        >
          <span className="sidebar-menu-icon">
            <img src={dashboardInfoIcon} alt="Dashboard info" />
          </span>
          <span className="label">Dashboard info</span>
        </li>
      </ul>

      {/* ===== INFO PANEL ===== */}
      {open && dashboardInfo && (
        <div className="sidebar-info-panel">
          <DashboardInfoPanel {...dashboardInfo} />
        </div>
      )}
    </aside>
  );
}
