import React, {useEffect, useState} from "react";
import {useOutletContext, useParams} from "react-router-dom";
import {tokenManager} from "../../services/tokenManager";
import * as dashboardService from "../../services/dashboard";
import WidgetGrid from "./WidgetGrid";
import AddWidgetModal from "./AddWidgetModal";
import "../../styles/dashboard.css";

export default function Dashboard() {
    const {setDashboardInfo} = useOutletContext() || {};
    const {id} = useParams();

    const dashboardId = parseInt(id, 10);

    const [widgets, setWidgets] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);

    const addWidget = async (type, mode, config = {}) => {
        if (!dashboardId) return;

        try {
            // Build server type based on type and mode
            let serverType;
            if (type === "news") {
                serverType = "newsFeed"; // news is always feed
            } else if (type === "currency") {
                serverType = mode === "feed" ? "currencyFeed" : "rates";
            } else {
                serverType = type;
            }

            const created = await dashboardService.createWidget(dashboardId, {
                type: serverType,
                configuration: {...config, mode},
            });

            const newWidget = {
                id: created.id,
                type: created.type,
                configuration: created.configuration,
                enabled: created.enabled,
                layout: {
                    x: 0,
                    y: Infinity, // Will be placed at the bottom
                    w: 4,
                    h: 4,
                },
            };

            setWidgets((prev) => [...prev, newWidget]);
            setShowAddModal(false);
        } catch (err) {
            console.error("Failed to create widget", err);
        }
    };

    const clearWidget = async (widgetId) => {
        if (!widgetId || !dashboardId) return;

        const token = tokenManager.get();
        if (!token) return;

        await fetch(
            `http://127.0.0.1:8000/api/dashboards/${dashboardId}/widgets/${widgetId}`,
            {
                method: "DELETE",
                headers: {Authorization: `Bearer ${token}`},
            }
        );

        setWidgets((prev) => prev.filter((w) => w.id !== widgetId));
    };

    const updateWidgetConfig = (widgetId, newConfig) => {
        setWidgets((prev) =>
            prev.map((w) =>
                w.id === widgetId ? {...w, configuration: newConfig} : w
            )
        );
    };

    const handleLayoutChange = async (layoutMap) => {
        // Update local state
        setWidgets((prev) =>
            prev.map((w) => ({
                ...w,
                layout: layoutMap[String(w.id)] || w.layout,
            }))
        );

        // Save layout to backend for each widget
        for (const [widgetId, layout] of Object.entries(layoutMap)) {
            try {
                await dashboardService.updateWidget(parseInt(widgetId), {layout});
            } catch (err) {
                console.error(`Failed to save layout for widget ${widgetId}`, err);
            }
        }
    };

    useEffect(() => {
        if (!dashboardId) return;

        const loadDashboard = async () => {
            setLoading(true);
            try {
                const d = await dashboardService.getDashboard(dashboardId);

                const loadedWidgets = (d.widgets || []).map((w, index) => ({
                    id: w.id,
                    type: w.type, // Server types directly map to registry
                    configuration: w.configuration,
                    enabled: w.enabled,
                    layout: w.layout || {
                        x: (index % 3) * 4,
                        y: Math.floor(index / 3) * 4,
                        w: 4,
                        h: 4,
                    },
                }));

                setWidgets(loadedWidgets);
            } catch (err) {
                console.error("Failed to load dashboard", err);
            }
            setLoading(false);
        };

        loadDashboard();
    }, [dashboardId]);

    useEffect(() => {
        if (!setDashboardInfo) return;

        setDashboardInfo({
            widgets,
            onClearWidget: clearWidget,
            onAddWidget: () => setShowAddModal(true),
        });
    }, [widgets]);

    return (
        <div className="dashboard-container">
            {loading ? (
                <p>Loading dashboard...</p>
            ) : (
                <>
                    <div className="dashboard-header">
                        <button
                            className="add-widget-btn"
                            onClick={() => setShowAddModal(true)}
                        >
                            + Add Widget
                        </button>
                    </div>

                    {widgets.length > 0 ? (
                        <WidgetGrid
                            widgets={widgets}
                            onLayoutChange={handleLayoutChange}
                            onWidgetUpdate={updateWidgetConfig}
                            onWidgetDelete={clearWidget}
                        />
                    ) : (
                        <p className="dashboard-placeholder">
                            No widgets yet. Click "Add Widget" to get started.
                        </p>
                    )}
                </>
            )}

            {showAddModal && (
                <AddWidgetModal
                    onAdd={addWidget}
                    onClose={() => setShowAddModal(false)}
                />
            )}
        </div>
    );
}
