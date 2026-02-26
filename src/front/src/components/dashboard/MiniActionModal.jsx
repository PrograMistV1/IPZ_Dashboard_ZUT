import React from "react";
import "../../styles/miniActionModal.css";

const CATEGORIES = [
  "general",
  "business",
  "technology",
  "sports",
  "health",
  "science",
  "entertainment",
];

export default function MiniActionModal({ onSelect }) {
  return (
    <div className="mini-modal">
      <h3>Select news category</h3>

      <div className="mini-modal-buttons">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => onSelect(cat)}
          >
            {cat}
          </button>
        ))}
      </div>
    </div>
  );
}
