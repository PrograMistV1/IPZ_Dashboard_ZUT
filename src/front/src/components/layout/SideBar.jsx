import React from "react";

import dashboardIcon from "../../assets/icons/dashboard.png";
import dashboardInfoIcon from "../../assets/icons/dashboard-info.png";
import economyIcon from "../../assets/icons/economy.png"; // nowa ikona

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
        {/* Dashboard custom */}
        <li className="sidebar-item">
          <span className="sidebar-menu-icon">
            <img src={dashboardInfoIcon} alt="Dashboard custom" />
          </span>
          <span className="label">Dashboard custom</span>
        </li>

        {/* Economy */}
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
