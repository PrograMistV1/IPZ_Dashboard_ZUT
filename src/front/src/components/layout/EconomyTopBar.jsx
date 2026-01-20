import React from "react";
import "./layout.css";

export default function EconomyTopBar() {
  return (
    <header className="topbar economy-topbar">
      <div className="topbar-controls">
        <span className="economy-title">
          Economy
        </span>
      </div>

      <div className="topbar-right">
        {/* Поки що пусто.
            Тут пізніше будуть фільтри, кнопки, селекти і т.д. */}
      </div>
    </header>
  );
}
