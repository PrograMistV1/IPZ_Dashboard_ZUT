import React from "react";
import "./economy.css";

export default function EconomyDashboard() {
  return (
    <div className="economy-dashboard">

      {/* ===== TOP ROW ===== */}
      <div className="economy-top">
        <div className="economy-widget small">Widget A</div>
        <div className="economy-widget small">Widget B</div>
        <div className="economy-widget small">Widget C</div>
      </div>

      {/* ===== MIDDLE AREA (2 COLUMNS) ===== */}
      <div className="economy-main">

        {/* LEFT COLUMN (Wide + New stacked) */}
        <div className="economy-left-column">
          <div className="economy-widget wide">
            Wide widget (future chart)
          </div>

          <div className="economy-widget bottom">
            New!
          </div>
        </div>

        {/* RIGHT COLUMN (Side widget full height) */}
        <div className="economy-widget side">
          Side widget
        </div>

      </div>

    </div>
  );
}
