import React, {useState} from "react";
import {useLocation, useNavigate} from "react-router-dom";
import {useDashboards} from "../dashboard/DashboardContext";

import dashboardIcon from "../../assets/icons/dashboard.png";
import "../../styles/layout.css";

export default function SideBar() {
    const navigate = useNavigate();
    const location = useLocation();
    const [collapsed, setCollapsed] = useState(false);

    const {
        dashboards,
        createDashboard,
        deleteDashboard,
    } = useDashboards();

    const handleCreate = async () => {
        const name = prompt("New dashboard name");
        if (!name) return;

        try {
            await createDashboard({name});
        } catch (err) {
            console.error("Failed to create dashboard", err);
        }
    };

    const handleDelete = async (id) => {
        const current = dashboards.find((d) => String(d.id) === String(id));
        const ok = window.confirm(
            `Delete dashboard "${current?.name || "Dashboard"}"?`
        );
        if (!ok) return;

        try {
            await deleteDashboard(id);
        } catch (err) {
            console.error("Failed to delete dashboard", err);
        }
    };

    return (
        <aside className={`sidebar${collapsed ? " collapsed" : ""}`}>
            {/* ===== HEADER ===== */}
            <div className="sidebar-header">
                <span className="sidebar-app-icon">
                    <img src={dashboardIcon} alt="Dashboard"/>
                </span>
                <span className="sidebar-title">Dashboard</span>
                <button
                    style={{
                        marginLeft: "auto",
                        background: "none",
                        border: "none",
                        color: "#fff",
                        fontSize: 18,
                        cursor: "pointer"
                    }}
                    onClick={() => setCollapsed(v => !v)}
                    title={collapsed ? "Развернуть" : "Свернуть"}
                >
                    {collapsed ? "→" : "←"}
                </button>
            </div>

            {/* ===== MENU ===== */}
            <ul className="sidebar-menu">
                {/* ===== DASHBOARD LIST ===== */}
                {dashboards.map((d) => (
                    <li
                        key={d.id}
                        className={`sidebar-item ${location.pathname === `/dashboard/${d.id}` ? "active" : ""}`}
                        onClick={() => navigate(`/dashboard/${d.id}`)}
                    >
                        <span className="sidebar-item-title">
                            {d.name || `Dashboard ${d.id}`}
                        </span>
                        <button
                            className="sidebar-item-delete"
                            onClick={e => { e.stopPropagation(); handleDelete(d.id); }}
                            disabled={dashboards.length <= 1}
                            title="Delete dashboard"
                            type="button"
                        >
                            ✕
                        </button>
                    </li>
                ))}
                {/* ===== DASHBOARD ===== */}
                <li
                    className={`sidebar-item add-dashboard${collapsed ? '' : ''}`}
                    onClick={handleCreate}
                    title="Добавить дэшборд"
                >
                    {collapsed ? '+' : '+ Add dashboard'}
                </li>
            </ul>
        </aside>
    );
}
