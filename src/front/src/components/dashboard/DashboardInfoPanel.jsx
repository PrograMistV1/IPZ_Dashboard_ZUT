import React, {useEffect, useRef, useState} from "react";
import "../../styles/dashboard.css";

export default function DashboardInfoPanel({
                                               widgets, onClearWidget, onAddWidget, onClose,
                                           }) {
    const widgetCount = widgets?.length || 0;
    const [activeSettingsWidgetId, setActiveSettingsWidgetId] = useState(null);
    const containersRef = useRef({});

    const dispatchWidgetSettings = (widgetId, el) => {
        try {
            if (!el) return;
            if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
                window.requestAnimationFrame(() => {
                    window.dispatchEvent(new CustomEvent('request-widget-settings', {
                        detail: {widgetId, targetEl: el}
                    }));
                });
            } else {
                setTimeout(() => {
                    window.dispatchEvent(new CustomEvent('request-widget-settings', {
                        detail: {widgetId, targetEl: el}
                    }));
                }, 20);
            }
        } catch (err) {
            console.error('[DashboardInfoPanel] dispatchWidgetSettings error', err);
        }
    };

    const requestSettingsFor = (widgetId) => {
        const idStr = String(widgetId);
        if (activeSettingsWidgetId === idStr) {
            // close and inform widget
            try {
                window.dispatchEvent(new CustomEvent('close-widget-settings', {detail: {widgetId: idStr}}));
            } catch (err) {
                // ignore
            }
            setActiveSettingsWidgetId(null);
            return;
        }

        // close previous if needed
        if (activeSettingsWidgetId && activeSettingsWidgetId !== idStr) {
            try {
                window.dispatchEvent(new CustomEvent('close-widget-settings', {detail: {widgetId: activeSettingsWidgetId}}));
            } catch (err) {
                // ignore
            }
        }

        setActiveSettingsWidgetId(idStr);
    };

    // When active widget changes, dispatch its container if exists
    useEffect(() => {
        if (!activeSettingsWidgetId) return;
        const el = containersRef.current[activeSettingsWidgetId] || null;
        console.debug('[DashboardInfoPanel] activeSettingsWidgetId changed', {activeSettingsWidgetId, hasEl: !!el});
        if (el instanceof Element) {
            dispatchWidgetSettings(activeSettingsWidgetId, el);
        }
    }, [activeSettingsWidgetId]);

    // Re-dispatch container when widgets array changes (in case DOM updated)
    useEffect(() => {
        if (!activeSettingsWidgetId) return;
        const el = containersRef.current[activeSettingsWidgetId] || null;
        if (el instanceof Element) {
            dispatchWidgetSettings(activeSettingsWidgetId, el);
        }
    }, [widgets, activeSettingsWidgetId]);

    return (
        <div className="dashboard-info">
            <div className="dashboard-info-section">
                <strong>Dashboard info</strong>
            </div>

            <div className="dashboard-info-row">
                <span>Widgets:</span>
                <span>{widgetCount}</span>
            </div>

            {/* Add Widget button placed here in the info panel */}
            <div className="dashboard-info-row">
                <button
                    className="add-widget-btn"
                    onClick={() => {
                        if (typeof onAddWidget === 'function') onAddWidget();
                        // if parent provided onClose (from AppLayout), close the drawer immediately
                        if (typeof onClose === 'function') onClose();
                    }}
                    title="Add Widget"
                >+ Add Widget
                </button>
            </div>

            {widgetCount > 0 && (
                <div className="dashboard-info-section">
                    <strong>Widget list</strong>

                    {widgets.map((widget) => {
                        const widStr = String(widget.id);
                        const isActive = String(activeSettingsWidgetId) === widStr;
                        return (
                            <React.Fragment key={widStr}>
                                <div className="dashboard-widget-row">
                                    <span>{widget.type}</span>

                                    <div style={{display: 'flex', gap: 8}}>
                                        <button onClick={() => requestSettingsFor(widget.id)} title="Настроить">⚙
                                        </button>
                                        <button onClick={() => onClearWidget(widget.id)} title="Удалить">🗑</button>
                                    </div>
                                </div>

                                {/* container placed directly under the widget row — widget will portal its settings into the .body element */}
                                <div className={`dashboard-widget-settings-container ${isActive ? 'active' : ''}`}>
                                    {/* body element used by widgets to portal settings into */}
                                    <div ref={(el) => {
                                        containersRef.current[widStr] = el;
                                        try {
                                            if (el instanceof Element && isActive) {
                                                dispatchWidgetSettings(widStr, el);
                                            }
                                        } catch (err) {
                                            // ignore
                                        }
                                    }} className="dashboard-widget-settings-body"/>
                                </div>
                            </React.Fragment>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
