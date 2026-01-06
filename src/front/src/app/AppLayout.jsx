import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import TopBar from "../components/layout/TopBar";
import SideBar from "../components/layout/SideBar";
import { useAuth } from "../auth/AuthContext";

export default function AppLayout() {
  const { user } = useAuth();
  const [dashboardInfo, setDashboardInfo] = useState(null);

  if (!user) return null;

  return (
    <div className="app-layout">
      <TopBar />

      <div className="app-body">
        <SideBar dashboardInfo={dashboardInfo} />

        <main className="app-content">
          <Outlet context={{ setDashboardInfo }} />
        </main>
      </div>
    </div>
  );
}
