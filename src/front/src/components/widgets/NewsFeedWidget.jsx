import React, {useEffect, useRef, useState} from "react";
import ReactDOM from "react-dom";
import FeedWidget, {NewsFeedItem} from "./FeedWidget";
import {getNews} from "../../services/news";
import {updateWidget} from "../../services/dashboard";

const CATEGORIES = [
    {id: "general", label: "General"},
    {id: "business", label: "Business"},
    {id: "technology", label: "Technology"},
    {id: "sports", label: "Sports"},
    {id: "health", label: "Health"},
    {id: "science", label: "Science"},
    {id: "entertainment", label: "Entertainment"},
];

export default function NewsFeedWidget({
                                           widgetId,
                                           configuration,
                                           onDelete,
                                           onUpdate,
                                       }) {
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [category, setCategory] = useState(configuration?.category || "general");
    const [scrollDirection, setScrollDirection] = useState(configuration?.scrollDirection || "vertical");

    const [portalTarget, setPortalTarget] = useState(null);

    const initialLoadRef = useRef(true);
    const previousConfigRef = useRef(JSON.stringify({category, scrollDirection}));

    // Load news
    useEffect(() => {
        let mounted = true;

        const load = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await getNews(category);
                if (!mounted) return;
                setArticles(res.articles || []);
            } catch (err) {
                if (!mounted) return;
                setError(err.message || String(err));
            } finally {
                if (mounted) setLoading(false);
            }
        };

        load();

        return () => {
            mounted = false;
        };
    }, [category]);

    // Save configuration
    useEffect(() => {
        if (!widgetId) return;

        const currentConfig = JSON.stringify({category, scrollDirection});

        if (initialLoadRef.current) {
            initialLoadRef.current = false;
            previousConfigRef.current = currentConfig;
            return;
        }

        if (previousConfigRef.current === currentConfig) return;
        previousConfigRef.current = currentConfig;

        const newConfig = {category, scrollDirection};
        updateWidget(widgetId, {configuration: newConfig})
            .then(() => onUpdate?.(widgetId, newConfig))
            .catch((err) => console.error("Error updating widget:", err));
    }, [category, scrollDirection, widgetId, onUpdate]);

    const settingsPanel = (
        <div className="feed-settings-content">
            <label style={{display: "block", marginBottom: "8px", color: "#ddd", fontSize: "13px"}}>
                Category
            </label>
            <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{
                    width: "100%",
                    padding: "8px",
                    borderRadius: "4px",
                    border: "1px solid #5a5a5a",
                    background: "#4a4a4a",
                    color: "#fff",
                    fontSize: "13px",
                    marginBottom: "12px",
                }}
            >
                {CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                        {cat.label}
                    </option>
                ))}
            </select>

            <label style={{display: "block", marginBottom: "8px", color: "#ddd", fontSize: "13px"}}>
                Scroll Direction
            </label>
            <div style={{display: "flex", gap: "8px"}}>
                <button
                    onClick={() => setScrollDirection("vertical")}
                    style={{
                        flex: 1,
                        padding: "8px",
                        borderRadius: "4px",
                        border: "1px solid #5a5a5a",
                        background: scrollDirection === "vertical" ? "#2563eb" : "#4a4a4a",
                        color: "#fff",
                        fontSize: "13px",
                        cursor: "pointer",
                    }}
                >
                    ↕ Vertical
                </button>
                <button
                    onClick={() => setScrollDirection("horizontal")}
                    style={{
                        flex: 1,
                        padding: "8px",
                        borderRadius: "4px",
                        border: "1px solid #5a5a5a",
                        background: scrollDirection === "horizontal" ? "#2563eb" : "#4a4a4a",
                        color: "#fff",
                        fontSize: "13px",
                        cursor: "pointer",
                    }}
                >
                    ↔ Horizontal
                </button>
            </div>
        </div>
    );

    // Respond to DashboardInfoPanel asking to mount settings into a target container
    useEffect(() => {
        const handler = (e) => {
            try {
                const detail = e?.detail || {};
                if (detail.widgetId && detail.widgetId === widgetId) {
                    const target = detail.targetEl || null;
                    setPortalTarget(target);
                }
            } catch (err) {
                // ignore
            }
        };
        window.addEventListener('request-widget-settings', handler);
        return () => window.removeEventListener('request-widget-settings', handler);
    }, [widgetId]);

    // When settings change while portal is open, re-dispatch target so portal receives the update reliably
    useEffect(() => {
        try {
            if (portalTarget instanceof Element) {
                window.dispatchEvent(new CustomEvent('request-widget-settings', {detail: {widgetId, targetEl: portalTarget}}));
            }
        } catch (err) {
            // ignore
        }
    }, [category, scrollDirection, portalTarget, widgetId]);

    // Respond to close requests
    useEffect(() => {
        const handler = (e) => {
            try {
                const detail = e?.detail || {};
                if (detail.widgetId && detail.widgetId === widgetId) {
                    setPortalTarget(null);
                }
            } catch (err) {
                // ignore
            }
        };
        window.addEventListener('close-widget-settings', handler);
        return () => window.removeEventListener('close-widget-settings', handler);
    }, [widgetId]);

    const handleOpenSettings = () => {
        // Ask DashboardInfoPanel to provide a container for this widget's settings
        window.dispatchEvent(new CustomEvent('request-settings-open', {detail: {widgetId}}));
    };

    // Transform articles for feed
    const feedItems = articles.map((article, index) => ({
        id: article.url || index,
        title: article.title,
        description: article.description,
        source: article.source,
        published_at: article.published_at,
        url: article.url,
    }));

    return (
        <>
            <FeedWidget
                title={`News — ${category}`}
                ItemComponent={NewsFeedItem}
                items={feedItems}
                loading={loading}
                onDelete={onDelete}
                onSettings={handleOpenSettings}
                // settingsPanel moved out to DashboardInfoPanel via portal
                emptyMessage={error || "No articles found"}
                scrollDirection={scrollDirection}
            />

            {/* Portal mount point: when portalTarget is set, render settingsPanel into it so it remains reactive */}
            {portalTarget && portalTarget instanceof Element && ReactDOM.createPortal(settingsPanel, portalTarget)}
        </>
    );
}
