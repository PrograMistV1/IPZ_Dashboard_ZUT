import React, {useEffect, useRef, useState} from "react";
import "../../styles/dashboard.css";

export default function DashboardInfoPanel({
                                               widgets, onClearWidget, onAddWidget,
                                           }) {
    const widgetCount = widgets?.length || 0;
    const [activeSettingsWidgetId, setActiveSettingsWidgetId] = useState(null);
    const containersRef = useRef({});

    // When a widget requests opening settings (by dispatching 'request-settings-open'),
    // mark it active so we render a container under its row and send the container back to the widget.
    useEffect(() => {
        const handler = (e) => {
            try {
                const detail = e?.detail || {};
                if (!detail || !detail.widgetId) return;
                const newId = detail.widgetId;
                // close previous if any
                setActiveSettingsWidgetId((prev) => {
                    if (prev && prev !== newId) {
                        window.dispatchEvent(new CustomEvent('close-widget-settings', {detail: {widgetId: prev}}));
                    }
                    return newId;
                });
            } catch (err) {
                // ignore
            }
        };
        window.addEventListener('request-settings-open', handler);
        return () => window.removeEventListener('request-settings-open', handler);
    }, []);

    // When activeSettingsWidgetId changes, attempt to send the container element back to the widget
    useEffect(() => {
        if (!activeSettingsWidgetId) return;
        const el = containersRef.current[activeSettingsWidgetId] || null;
        if (el instanceof Element) {
            window.dispatchEvent(new CustomEvent('request-widget-settings', {
                detail: {
                    widgetId: activeSettingsWidgetId,
                    targetEl: el
                }
            }));
        }
    }, [activeSettingsWidgetId]);

    // Ensure that when widgets prop or active widget changes (for example after updating configuration)
    // we re-dispatch the container element so the widget's portal receives updates and stays reactive.
    useEffect(() => {
        if (!activeSettingsWidgetId) return;
        const el = containersRef.current[activeSettingsWidgetId] || null;
        if (el instanceof Element) {
            // re-dispatch to make sure widget gets the latest target whenever widgets list updates
            try {
                window.dispatchEvent(new CustomEvent('request-widget-settings', {
                    detail: {
                        widgetId: activeSettingsWidgetId,
                        targetEl: el
                    }
                }));
            } catch (err) {
                // ignore
            }
        }
    }, [widgets, activeSettingsWidgetId]);

    const requestSettingsFor = (widgetId) => {
        // Toggle: if already active for this widget, close it
        if (activeSettingsWidgetId === widgetId) {
            // inform widget to unmount its portal
            window.dispatchEvent(new CustomEvent('close-widget-settings', {detail: {widgetId}}));
            setActiveSettingsWidgetId(null);
            return;
        }

        // close previous if opening a different widget
        if (activeSettingsWidgetId && activeSettingsWidgetId !== widgetId) {
            window.dispatchEvent(new CustomEvent('close-widget-settings', {detail: {widgetId: activeSettingsWidgetId}}));
        }

        // User clicked the settings button in the list — open the panel under that row
        setActiveSettingsWidgetId(widgetId);
    };

    return (<div className="dashboard-info">
            <div className="dashboard-info-section">
                <strong>Dashboard info</strong>
            </div>

            <div className="dashboard-info-row">
                <span>Widgets:</span>
                <span>{widgetCount}</span>
            </div>

            {/* Add Widget button placed here in the info panel */}
            <div className="dashboard-info-row">
                <button className="add-widget-btn" onClick={() => (typeof onAddWidget === 'function') && onAddWidget()} title="Add Widget">+ Add Widget</button>
            </div>

            {widgetCount > 0 && (<div className="dashboard-info-section">
                    <strong>Widget list</strong>

                    {widgets.map((widget) => (<React.Fragment key={widget.id}>
                            <div className="dashboard-widget-row">
                                <span>{widget.type}</span>

                                <div style={{display: 'flex', gap: 8}}>
                                    <button onClick={() => requestSettingsFor(widget.id)} title="Настроить">⚙</button>
                                    <button onClick={() => onClearWidget(widget.id)} title="Удалить">🗑</button>
                                </div>
                            </div>

                            {/* container placed directly under the widget row — widget will portal its settings into the .body element */}
                            <div
                                className={`dashboard-widget-settings-container ${activeSettingsWidgetId === widget.id ? 'active' : ''}`}>
                                {activeSettingsWidgetId === widget.id && (
                                    <div className="dashboard-widget-settings-header">
                                        <strong>Settings — Widget {widget.id}</strong>
                                        {/* internal Close button intentionally removed; use the settings toggle button in the list to close */}
                                    </div>)}

                                <div ref={(el) => {
                                    containersRef.current[widget.id] = el;
                                    // if the container just appeared and it's the active widget, notify the widget with the new target
                                    try {
                                        if (el instanceof Element && activeSettingsWidgetId === widget.id) {
                                            window.dispatchEvent(new CustomEvent('request-widget-settings', {
                                                detail: {
                                                    widgetId: widget.id,
                                                    targetEl: el
                                                }
                                            }));
                                        }
                                    } catch (err) {
                                        // ignore
                                    }
                                }} className="dashboard-widget-settings-body"/>
                            </div>
                        </React.Fragment>))}
                </div>)}
        </div>);
}
