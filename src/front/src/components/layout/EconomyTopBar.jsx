import React from "react";
import UserMenu from "./UserMenu";
import "./layout.css";

export default function EconomyTopBar() {
  return (
    <header className="topbar economy-topbar">
      <div className="topbar-controls">
        {/* Title intentionally removed for economy template */}
      </div>

      <div className="topbar-right">
        <UserMenu />
      </div>
    </header>
  );
}
