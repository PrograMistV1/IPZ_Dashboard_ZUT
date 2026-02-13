import React, {useEffect, useRef, useState} from "react";
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
        <FeedWidget
            title={`News — ${category}`}
            ItemComponent={NewsFeedItem}
            items={feedItems}
            loading={loading}
            onDelete={onDelete}
            onSettings={() => {
            }}
            settingsPanel={settingsPanel}
            emptyMessage={error || "No articles found"}
            scrollDirection={scrollDirection}
        />
    );
}
