import React from "react";
import { Outlet } from "react-router-dom";
import TopBar from "../components/layout/TopBar";
import SideBar from "../components/layout/SideBar";
import { useAuth } from "../auth/AuthContext";

export default function AppLayout() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <div className="app-layout">
      <TopBar />

      <div className="app-body">
        <SideBar />

        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
