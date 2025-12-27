import React from "react";
import { widgetRegistry } from "../widgets/registry";
import "./layout.css";

export default function SideBar() {
  const addWidget = (type) => {
    window.dispatchEvent(
      new CustomEvent("add-widget", {
        detail: type,
      })
    );
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-section">
        <strong>Widgets</strong>
      </div>

      <ul className="sidebar-menu">
        {Object.entries(widgetRegistry).map(
          ([key, widget]) => (
            <li
              key={key}
              className="sidebar-item"
              onClick={() => addWidget(key)}
            >
              {widget.title}
            </li>
          )
        )}
      </ul>
    </aside>
  );
}
