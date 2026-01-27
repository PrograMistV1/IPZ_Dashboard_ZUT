import React, {useEffect, useRef, useState} from "react";
import {getNews} from "../../services/news";
import {updateWidget} from "../../services/dashboard";
import "../../styles/newsWidget.css";

export default function NewsWidget({
  widgetId,
  configuration,
  onDelete,
  onUpdate,
}) {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [editing, setEditing] = useState(false);
  const [category, setCategory] = useState(
    configuration?.category || "general"
  );

  const initialLoadRef = useRef(true);
  const previousCategoryRef = useRef(category);

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

  useEffect(() => {
    if (!widgetId) return;

    if (initialLoadRef.current) {
      initialLoadRef.current = false;
      previousCategoryRef.current = category;
      return;
    }

    if (previousCategoryRef.current === category) {
      return;
    }

    previousCategoryRef.current = category;
    const newConfig = { category };

    updateWidget(widgetId, { configuration: newConfig });
    onUpdate?.(widgetId, newConfig);
  }, [category, widgetId, onUpdate]);

  return (
    <div className="widget news-widget">
      {/* ===== HEADER ===== */}
      <div className="news-header">
        <h4>News — {category}</h4>

        <div className="news-actions">
          <button
            className="icon-btn"
            title="Settings"
            onClick={() => setEditing(true)}
          >
            ⚙
          </button>

          <button
            className="icon-btn danger"
            title="Delete"
            onClick={() => {
              if (window.confirm("Delete this widget?")) {
                onDelete?.();
              }
            }}
          >
            🗑
          </button>
        </div>
      </div>

      {/* ===== SETTINGS PANEL ===== */}
      {editing && (
        <div className="news-settings-panel">
          <div className="settings-header">
            <strong>Widget settings</strong>
            <button
              className="icon-btn"
              onClick={() => setEditing(false)}
            >
              ✕
            </button>
          </div>

          <label>
            Category
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="general">General</option>
              <option value="business">Business</option>
              <option value="technology">Technology</option>
              <option value="sports">Sports</option>
              <option value="health">Health</option>
              <option value="science">Science</option>
              <option value="entertainment">Entertainment</option>
            </select>
          </label>
        </div>
      )}

      {/* ===== CONTENT ===== */}
      <div className="news-content">
        {loading && <div className="widget-loading">Loading...</div>}
        {error && <div className="widget-error">{error}</div>}

        {!loading && !error && (
          <ul className="news-list">
            {articles.length === 0 && <li>No articles</li>}
            {articles.map((article) => (
                <li key={article.url || article.id} className="news-item">
                  <a href={article.url} target="_blank" rel="noreferrer">
                    {article.title}
                </a>
                <div className="news-meta">
                  {article.source} —{" "}
                  {article.published_at
                      ? new Date(article.published_at).toLocaleString()
                    : ""}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
