import React, {useEffect, useState} from 'react';
import {createPortal} from 'react-dom';
import './widget.css';

/**
 * Base Widget component
 * Props:
 * - id: string|number (unique id)
 * - mode: 'feed'|'standard'
 * - data: any (widget content)
 * - settings: React node (optional) — UI for settings that will be portaled into the DashboardInfoPanel
 */
export default function Widget({id, mode, data, children, settings}) {
    const [settingsTarget, setSettingsTarget] = useState(null);

    useEffect(() => {
        const handler = (e) => {
            try {
                const detail = e?.detail || {};
                if (!detail) return;
                if (String(detail.widgetId) !== String(id)) return;
                const targetEl = detail.targetEl || null;
                if (targetEl instanceof Element) setSettingsTarget(targetEl);
                else setSettingsTarget(null);
            } catch (err) {
                // ignore
            }
        };

        const closeHandler = (e) => {
            try {
                const detail = e?.detail || {};
                if (!detail) return;
                if (String(detail.widgetId) !== String(id)) return;
                setSettingsTarget(null);
            } catch (err) {
                // ignore
            }
        };

        window.addEventListener('request-widget-settings', handler);
        window.addEventListener('close-widget-settings', closeHandler);
        return () => {
            window.removeEventListener('request-widget-settings', handler);
            window.removeEventListener('close-widget-settings', closeHandler);
        };
    }, [id]);

    return (
        <div className={`widget widget--${mode}`} data-widget-id={id}>
            <div className="widget__body">{children || (data ? JSON.stringify(data) : null)}</div>
            {settings && settingsTarget ? createPortal(settings, settingsTarget) : null}
        </div>
    );
}
