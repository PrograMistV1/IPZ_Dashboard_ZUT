import React from "react";

import dashboardIcon from "../../assets/icons/dashboard.png";
import dashboardInfoIcon from "../../assets/icons/dashboard-info.png";

import "./layout.css";

export default function SideBar() {
  return (
    <aside className="sidebar">
      {/* ===== HEADER ===== */}
      <div className="sidebar-header">
        <span className="sidebar-app-icon">
          <img src={dashboardIcon} alt="Dashboard" />
        </span>
        <span className="sidebar-title">Dashboard</span>
      </div>

      {/* ===== MENU ===== */}
      <ul className="sidebar-menu">
        <li className="sidebar-item">
          <span className="sidebar-menu-icon">
            <img src={dashboardInfoIcon} alt="Dashboard info" />
          </span>
          <span className="label">Dashboard custom</span>
        </li>
      </ul>
    </aside>
  );
}
