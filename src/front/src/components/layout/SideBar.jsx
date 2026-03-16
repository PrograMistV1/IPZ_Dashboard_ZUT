import React, {useState} from "react";
import {useLocation, useNavigate} from "react-router-dom";
import {useDashboards} from "../dashboard/DashboardContext";

import dashboardIcon from "../../assets/icons/dashboard.png";
import dashboardInfoIcon from "../../assets/icons/dashboard-info.png";
import economyIcon from "../../assets/icons/economy.png";
import weatherIcon from "../../assets/icons/weather.png";

import "./layout.css";

export default function SideBar() {
    const navigate = useNavigate();
    const location = useLocation();
    const [open, setOpen] = useState(false);

    const {
        dashboards,
        createDashboard,
        deleteDashboard,
    } = useDashboards();

    const [creating, setCreating] = useState(false);
    const [newName, setNewName] = useState("");

    const handleCreateClick = () => {
        setCreating(true);
        setNewName("");
    };

    const handleCreateSubmit = async (e) => {
        e && e.preventDefault && e.preventDefault();
        const name = (newName || "").trim();
        if (!name) return;

        try {
            await createDashboard({ name });
            setCreating(false);
            setNewName("");
        } catch (err) {
            console.error("Failed to create dashboard", err);
            // keep the input open so user can retry
        }
    };

    const handleCreateCancel = () => {
        setCreating(false);
        setNewName("");
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
        <aside className="sidebar" onMouseLeave={() => setOpen(false)}>
            {/* ===== HEADER ===== */}
            <div className="sidebar-header">
                <span className="sidebar-app-icon">
                    <img src={dashboardIcon} alt="Dashboard"/>
                </span>
                <span className="sidebar-title">Dashboard</span>
            </div>

            {/* ===== MENU ===== */}
            <ul className="sidebar-menu">
                {/* ===== DASHBOARD CUSTOM (ACCORDION) ===== */}
                <li
                    className="sidebar-item sidebar-accordion"
                    onClick={() => setOpen((v) => !v)}
                >
                    <span className="sidebar-menu-icon">
                        <img src={dashboardInfoIcon} alt="Dashboard custom"/>
                    </span>
                    <span className="label">Dashboard custom</span>
                    <span className={`accordion-arrow ${open ? "open" : ""}`}>
                        ▾
                    </span>
                </li>

                {/* ===== SUBMENU WITH DASHBOARDS ===== */}
                {open && (
                    <ul className="sidebar-submenu">
                        {/* ===== LIST OF DASHBOARDS ===== */}
                        {dashboards.map((d) => (
                            <li
                                key={d.id}
                                className={`sidebar-subitem ${
                                    location.pathname === `/dashboard/${d.id}` ? "active" : ""
                                }`}
                            >
                                <span
                                    className="sidebar-subitem-title"
                                    onClick={() => navigate(`/dashboard/${d.id}`)}
                                >
                                    {d.name || `Dashboard ${d.id}`}
                                </span>

                                <button
                                    className="sidebar-subitem-delete"
                                    onClick={() => handleDelete(d.id)}
                                    disabled={dashboards.length <= 1}
                                    title="Delete dashboard"
                                >
                                    ✕
                                </button>
                            </li>
                        ))}

                        {/* ===== ADD DASHBOARD (ALWAYS LAST) ===== */}
                        <li className="sidebar-subitem add-dashboard">
                            {!creating && (
                                <div onClick={handleCreateClick} style={{cursor: 'pointer'}}>
                                    + Add dashboard
                                </div>
                            )}

                            {creating && (
                                <form onSubmit={handleCreateSubmit} className="add-form">
                                    <input autoFocus value={newName} onChange={e => setNewName(e.target.value)} placeholder="New dashboard name" />
                                    <div className="add-actions">
                                        <button type="button" className="cancel-btn" onClick={handleCreateCancel}>Cancel</button>
                                        <button type="submit" className="create-btn">Create</button>
                                    </div>
                                </form>
                            )}
                        </li>
                    </ul>
                )}

                {/* ===== ECONOMY ===== */}
                <li
                    className="sidebar-item"
                    onClick={() => navigate("/economy")}
                >
                    <span className="sidebar-menu-icon economy-icon">
                        <img src={economyIcon} alt="Economy"/>
                    </span>
                    <span className="label">Economy</span>
                </li>

                {/* ===== WEATHER ===== */}
                <li
                    className="sidebar-item"
                    onClick={() => navigate("/weather")}
                >
                    <span className="sidebar-menu-icon weather-icon">
                        <img src={weatherIcon} alt="Weather"/>
                    </span>
                    <span className="label">Weather</span>
                </li>
            </ul>
        </aside>
    );
}
