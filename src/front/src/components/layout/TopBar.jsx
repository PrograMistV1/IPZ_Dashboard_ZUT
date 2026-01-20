import React from "react";
import UserMenu from "./UserMenu";
import "./layout.css";

export default function TopBar() {
  return (
    <header className="topbar">
      {/* ліва частина — поки що порожня */}
      <div className="topbar-left"></div>

      {/* права частина — меню юзера */}
      <div className="topbar-right">
        <UserMenu />
      </div>
    </header>
  );
}
