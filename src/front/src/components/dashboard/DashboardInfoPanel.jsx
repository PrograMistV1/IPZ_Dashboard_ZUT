import React from "react";
import "../../styles/dashboard.css";

export default function DashboardInfoPanel({
  widgets,
  onClearWidget,
}) {
    const widgetCount = widgets?.length || 0;

  return (
    <div className="dashboard-info">
      <div className="dashboard-info-section">
        <strong>Dashboard info</strong>
      </div>

      <div className="dashboard-info-row">
          <span>Widgets:</span>
          <span>{widgetCount}</span>
      </div>

        {widgetCount > 0 && (
        <div className="dashboard-info-section">
            <strong>Widget list</strong>

            {widgets.map((widget) => (
                <div key={widget.id} className="dashboard-widget-row">
                    <span>{widget.type}</span>

                    <button onClick={() => onClearWidget(widget.id)}>
                        Clear
                    </button>
                </div>
            ))}
        </div>
      )}
    </div>
  );
}
