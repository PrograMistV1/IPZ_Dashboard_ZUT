import React from "react";
import "./dashboard.css";

export default function DashboardInfoPanel({
  slotsCount,
  widgets,
  onAddSlot,
  onRemoveSlot,
  onClearWidget,
}) {
  const usedSlots = Object.values(widgets).filter(Boolean).length;

  return (
    <div className="dashboard-info">
      <div className="dashboard-info-section">
        <strong>Dashboard info</strong>
      </div>

      <div className="dashboard-info-row">
        <span>Slots:</span>
        <span>
          {usedSlots} / {slotsCount}
        </span>
      </div>

      <div className="dashboard-info-actions">
        <button onClick={onAddSlot} disabled={slotsCount >= 8}>
          + Add slot
        </button>

        <button onClick={onRemoveSlot} disabled={slotsCount <= 1}>
          − Remove slot
        </button>
      </div>

      {usedSlots > 0 && (
        <div className="dashboard-info-section">
          <strong>Widgets</strong>

          {Object.entries(widgets).map(
            ([slot, widget]) =>
              widget && (
                <div
                  key={slot}
                  className="dashboard-widget-row"
                >
                  <span>
                    Slot {slot}: {widget.type}
                  </span>

                  <button
                    onClick={() =>
                      onClearWidget(slot)
                    }
                  >
                    Clear
                  </button>
                </div>
              )
          )}
        </div>
      )}
    </div>
  );
}
