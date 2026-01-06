import React, { useState } from "react";
import DashboardInfoPanel from "../dashboard/DashboardInfoPanel";
import "./layout.css";

export default function SideBar({ dashboardInfo }) {
  const [open, setOpen] = useState(false);

  return (
    <aside className="sidebar">
      <div className="sidebar-section">
        <strong>Tools</strong>
      </div>

      <ul className="sidebar-menu">
        <li
          className="sidebar-item"
          onClick={() => setOpen((v) => !v)}
        >
          Dashboard info
        </li>
      </ul>

      {open && dashboardInfo && (
        <div className="sidebar-info-panel">
          <DashboardInfoPanel {...dashboardInfo} />
        </div>
      )}
    </aside>
  );
}
