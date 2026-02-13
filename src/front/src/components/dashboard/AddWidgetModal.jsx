import React, {useEffect, useState} from "react";
import {widgetTypes} from "../widgets/registry";
import "./addWidgetModal.css";

export default function AddWidgetModal({onAdd, onClose}) {
    const [selectedType, setSelectedType] = useState(null);
    const [selectedMode, setSelectedMode] = useState(null);
    const [newsCategory, setNewsCategory] = useState(null);

    const newsCategories = [
        {id: "general", label: "General"},
        {id: "business", label: "Business"},
        {id: "technology", label: "Technology"},
        {id: "science", label: "Science"},
        {id: "health", label: "Health"},
        {id: "sports", label: "Sports"},
        {id: "entertainment", label: "Entertainment"},
    ];

    // Auto-select mode if only one is available
    useEffect(() => {
        if (selectedType) {
            const typeInfo = widgetTypes[selectedType];
            if (typeInfo?.modes.length === 1) {
                setSelectedMode(typeInfo.modes[0]);
            } else {
                setSelectedMode(typeInfo?.defaultMode || null);
            }
        } else {
            setSelectedMode(null);
        }
    }, [selectedType]);

    const needsCategory = selectedType === "news";
    const needsModeSelection = selectedType && widgetTypes[selectedType]?.modes.length > 1;

    const canAdd = selectedType && selectedMode && (!needsCategory || newsCategory);

    const handleAdd = () => {
        if (!canAdd) return;

        let config = {
            mode: selectedMode,
        };

        if (needsCategory) {
            config.category = newsCategory;
        }

        onAdd(selectedType, selectedMode, config);
    };

    const selectedTypeInfo = selectedType ? widgetTypes[selectedType] : null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>Add Widget</h3>
                    <button className="modal-close" onClick={onClose}>×</button>
                </div>

                <div className="modal-body">
                    {/* Step 1: Select data type */}
                    <p className="modal-label">1. Select data type:</p>
                    <div className="widget-type-list">
                        {Object.entries(widgetTypes).map(([key, typeInfo]) => (
                            <button
                                key={key}
                                className={`widget-type-card ${selectedType === key ? "active" : ""}`}
                                onClick={() => {
                                    setSelectedType(key);
                                    setNewsCategory(null);
                                }}
                            >
                                <span className="widget-type-title">{typeInfo.title}</span>
                                <span className="widget-type-desc">{typeInfo.description}</span>
                                <span className="widget-type-modes">
                                    {typeInfo.modes.map(m => m === "feed" ? "📜 Feed" : "📊 Standard").join(" • ")}
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* Step 2: Select display mode (if multiple available) */}
                    {needsModeSelection && (
                        <>
                            <p className="modal-label">2. Select display mode:</p>
                            <div className="widget-mode-grid">
                                {selectedTypeInfo.modes.map((mode) => (
                                    <button
                                        key={mode}
                                        className={`widget-mode-btn ${selectedMode === mode ? "active" : ""}`}
                                        onClick={() => setSelectedMode(mode)}
                                    >
                                        <span className="mode-icon">{mode === "feed" ? "📜" : "📊"}</span>
                                        <span className="mode-title">{mode === "feed" ? "Feed" : "Standard"}</span>
                                        <span className="mode-desc">
                                            {mode === "feed"
                                                ? "Scrollable list of items"
                                                : "Single item with chart/details"}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </>
                    )}

                    {/* Step 3: Category for news */}
                    {needsCategory && (
                        <>
                            <p className="modal-label">{needsModeSelection ? "3." : "2."} Select news category:</p>
                            <div className="widget-type-grid">
                                {newsCategories.map((cat) => (
                                    <button
                                        key={cat.id}
                                        className={`widget-type-btn ${newsCategory === cat.id ? "active" : ""}`}
                                        onClick={() => setNewsCategory(cat.id)}
                                    >
                                        {cat.label}
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                <div className="modal-footer">
                    <button className="modal-btn cancel" onClick={onClose}>
                        Cancel
                    </button>
                    <button
                        className="modal-btn add"
                        onClick={handleAdd}
                        disabled={!canAdd}
                    >
                        Add Widget
                    </button>
                </div>
            </div>
        </div>
    );
}
