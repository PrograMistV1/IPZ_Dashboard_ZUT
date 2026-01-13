import React from "react";
import UserMenu from "./UserMenu";
import "./layout.css";

export default function TopBar() {
  return (
    <header className="topbar">
      <div className="topbar-left">
        
      </div>

      <div className="topbar-right">
        <UserMenu />
      </div>
    </header>
  );
}
