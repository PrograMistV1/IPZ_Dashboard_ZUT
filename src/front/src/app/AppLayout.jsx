import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import TopBar from "../components/layout/TopBar";
import SideBar from "../components/layout/SideBar";
import DashboardInfoPanel from "../components/dashboard/DashboardInfoPanel";
import { useAuth } from "../auth/AuthContext";

export default function AppLayout() {
  const { user } = useAuth();

  const [dashboardInfo, setDashboardInfo] = useState(null);
  const [infoOpen, setInfoOpen] = useState(false);

  if (!user) return null;

  return (
    <div className="app-layout">
      <SideBar />

      <div className="app-body">
        <TopBar />

        <main className="app-content">
          <Outlet context={{ setDashboardInfo }} />
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
