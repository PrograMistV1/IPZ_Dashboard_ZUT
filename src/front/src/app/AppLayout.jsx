import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import TopBar from "../components/layout/TopBar";
import EconomyTopBar from "../components/layout/EconomyTopBar";
import SideBar from "../components/layout/SideBar";
import DashboardInfoPanel from "../components/dashboard/DashboardInfoPanel";
import { useAuth } from "../auth/AuthContext";
import EconomyDashboard from "../components/economy/EconomyDashboard";


export default function AppLayout() {
  const { user } = useAuth();

  const [dashboardInfo, setDashboardInfo] = useState(null);
  const [layoutMode, setLayoutMode] = useState("custom"); 

  const [infoOpen, setInfoOpen] = useState(false);
  const [mode, setMode] = useState("custom");

  if (!user) return null;

  return (
    <div className="app-layout">
      <SideBar
  layoutMode={layoutMode}
  setLayoutMode={setLayoutMode}
/>
      <div className="app-body">
        <TopBar />

        <main className="app-content">
  {layoutMode === "custom" && (
    <Outlet context={{ setDashboardInfo }} />
  )}

  {layoutMode === "economy" && (
    <EconomyDashboard />
  )}
</main>


        {/* OVERLAY — łapie klik poza modalką */}
        {infoOpen && (
          <div
            className="dashboard-info-overlay"
            onClick={() => setInfoOpen(false)}
          />
        )}

        {/* UCHWYT (pionowa smuga) */}
        {dashboardInfo && (
          <div
            className={`dashboard-info-handle ${infoOpen ? "open" : ""}`}
            onClick={() => setInfoOpen((v) => !v)}
            title="Dashboard settings"
          />
        )}

        {/* PRAWA MODALKA */}
        {dashboardInfo && (
          <div
            className={`dashboard-info-drawer ${infoOpen ? "open" : ""}`}
            onClick={(e) => e.stopPropagation()} // blokuje zamknięcie przy kliknięciu w środek
          >
            <DashboardInfoPanel
              {...dashboardInfo}
              onClose={() => setInfoOpen(false)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
