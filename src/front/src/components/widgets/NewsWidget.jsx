import React, { useEffect, useState } from "react";
import { getNews } from "../../services/news";

export default function NewsWidget({ widgetId, configuration }) {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const category = configuration?.category || "general";

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

  return (
    <div className="widget news-widget">
      <h4>News — {category}</h4>

      <div className="news-content">
        {loading && <div className="widget-loading">Loading...</div>}
        {error && <div className="widget-error">{error}</div>}

        {!loading && !error && (
          <ul className="news-list">
            {articles.length === 0 && <li>No articles</li>}
            {articles.map((a, idx) => (
              <li key={idx} className="news-item">
                <a href={a.url} target="_blank" rel="noreferrer">
                  {a.title}
                </a>
                <div className="news-meta">{a.source} — {a.published_at ? new Date(a.published_at).toLocaleString() : ''}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
