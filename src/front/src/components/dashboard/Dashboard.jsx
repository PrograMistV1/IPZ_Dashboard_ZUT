import React, {useEffect, useState} from "react";
import {useDashboards} from "./DashboardContext";
import {useOutletContext} from "react-router-dom";
import DashboardGrid from "./DashboardGrid";
import * as dashboardService from "../../services/dashboard";
import {tokenManager} from "../../services/tokenManager";

export default function Dashboard() {
    const {setDashboardInfo} = useOutletContext() || {};

    const {activeDashboardId} = useDashboards();

    const [slotsCount, setSlotsCount] = useState(4);
    const [widgets, setWidgets] = useState({});

    const [loading, setLoading] = useState(false);

    const addSlot = async () => {
        if (!activeDashboardId || slotsCount >= 8) return;

        const newCount = slotsCount + 1;
        setSlotsCount(newCount);

        try {
            await dashboardService.updateDashboard(activeDashboardId, {
                slotsCount: newCount,
            });
        } catch (err) {
            console.error("Failed to update slotsCount", err);
        }
    };

    const removeSlot = async () => {
        if (!activeDashboardId || slotsCount <= 1) return;

        const lastSlot = slotsCount;
        const widget = widgets[lastSlot];
        const token = tokenManager.get();
        if (!token) return;

        if (widget) {
            await fetch(
                `http://127.0.0.1:8000/api/dashboards/${activeDashboardId}/widgets/${widget.id}`,
                {
                    method: "DELETE",
                    headers: {Authorization: `Bearer ${token}`},
                }
            );

            setWidgets((prev) => {
                const copy = {...prev};
                delete copy[lastSlot];
                return copy;
            });
        }

        const newCount = slotsCount - 1;
        setSlotsCount(newCount);

        try {
            await dashboardService.updateDashboard(activeDashboardId, {
                slotsCount: newCount,
            });
        } catch (err) {
            console.error("Failed to update slotsCount", err);
        }
    };

    const clearWidget = async (slot) => {
        const widget = widgets[slot];
        if (!widget || !activeDashboardId) return;

        const token = tokenManager.get();
        if (!token) return;

        await fetch(
            `http://127.0.0.1:8000/api/dashboards/${activeDashboardId}/widgets/${widget.id}`,
            {
                method: "DELETE",
                headers: {Authorization: `Bearer ${token}`},
            }
        );

        setWidgets((prev) => {
            const copy = {...prev};
            delete copy[slot];
            return copy;
        });
    };

    const mapServerTypeToRegistry = (type) => {
        if (type === "rates") return "currency";
        if (type === "news") return "news";
        return type;
    };

    useEffect(() => {
        if (!activeDashboardId) return;

        const loadDashboard = async () => {
            setLoading(true);
            try {
                const d = await dashboardService.getDashboard(activeDashboardId);

                setSlotsCount(d.slotsCount ?? 4);

                const newWidgets = {};
                (d.widgets || []).forEach((w) => {
                    if (w.position) {
                        newWidgets[w.position] = {
                            id: w.id,
                            type: mapServerTypeToRegistry(w.type),
                            configuration: w.configuration,
                            enabled: w.enabled,
                            position: w.position,
                        };
                    }
                });

                setWidgets(newWidgets);
            } catch (err) {
                console.error("Failed to load dashboard", err);
            }
            setLoading(false);
        };

        loadDashboard();
    }, [activeDashboardId]);


    useEffect(() => {
        const handler = async (e) => {
            if (!activeDashboardId) return;

            const {type, slot, config: detailConfig} = e.detail || {};
            if (!type || !slot) return;
            if (slot > slotsCount || widgets[slot]) return;

            const config = detailConfig || {};

            if (type === "news") {
                const category = config.category;
                if (!category) return; // require category selected via UI
            }

            try {
                const serverType = type === "currency" ? "rates" : type;

                const created = await dashboardService.createWidget(activeDashboardId, {
                    type: serverType,
                    configuration: config,
                    position: slot,
                });

                setWidgets((prev) => ({
                    ...prev,
                    [slot]: {
                        id: created.id,
                        type: mapServerTypeToRegistry(created.type),
                        configuration: created.configuration,
                        enabled: created.enabled,
                        position: created.position,
                    },
                }));
            } catch (err) {
                console.error("Failed to create widget", err);
            }
        };

        window.addEventListener("add-widget", handler);
        return () => window.removeEventListener("add-widget", handler);
    }, [activeDashboardId, slotsCount, widgets]);

    const updateWidgetLocal = (widgetId, newConfig) => {
        setWidgets((prev) => {
            const copy = {...prev};
            Object.keys(copy).forEach((slot) => {
                if (copy[slot]?.id === widgetId) {
                    copy[slot] = {
                        ...copy[slot],
                        configuration: newConfig,
                    };
                }
            });
            return copy;
        });
    };

    const handleReorder = async (orderedSlots) => {
        if (!activeDashboardId) return;

        const newWidgets = {};
        orderedSlots.forEach((w, i) => {
            const position = i + 1;
            if (w.widget) {
                newWidgets[position] = {
                    ...widgets[w.widget.position],
                    position,
                };
            }
        });

        setWidgets(newWidgets);

        const token = tokenManager.get();
        if (!token) return;

        try {
            await fetch(
                `http://127.0.0.1:8000/api/dashboards/${activeDashboardId}/widgets/reorder`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        widgets: orderedSlots
                            .map((w, i) =>
                                w.widget?.id ? {id: w.widget.id, position: i + 1} : null
                            )
                            .filter(Boolean),
                    }),
                }
            );
        } catch (err) {
            console.error("Failed to reorder widgets", err);
        }
    };

    useEffect(() => {
        if (!setDashboardInfo) return;

        setDashboardInfo({
            slotsCount,
            widgets,
            onAddSlot: addSlot,
            onRemoveSlot: removeSlot,
            onClearWidget: clearWidget,
        });
    }, [slotsCount, widgets]);

    return (
        <>
            <DashboardGrid
                slotsCount={slotsCount}
                widgets={widgets}
                onReorder={handleReorder}
                onWidgetUpdate={updateWidgetLocal}
            />

            {/*
      <DashboardInfoPanel
        slotsCount={slotsCount}
        widgets={widgets}
        onAddSlot={addSlot}
        onRemoveSlot={removeSlot}
        onClearWidget={clearWidget}
      />
      */}
        </>
    );
}
