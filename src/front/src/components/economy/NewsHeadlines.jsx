import React, { useEffect, useState } from "react";
import { getNews } from "../../services/news";

export default function NewsHeadlines({ category = "business", limit = 8 }) {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getNews(category);
        if (!mounted) return;
        setArticles((res.articles || []).slice(0, limit));
      } catch (err) {
        if (!mounted) return;
        setError(err.message || String(err));
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => (mounted = false);
  }, [category, limit]);

  if (loading) return <div className="news-headlines">Loading…</div>;
  if (error) return <div className="news-headlines">Error: {error}</div>;

  return (
    <div className="news-headlines">
      <h4>Business news</h4>
      <div className="news-list">
        {articles.map((a, i) => (
          <div key={i} className="news-item">
            <a href={a.url} target="_blank" rel="noreferrer" className="news-link">
              <div className="news-title">{a.title}</div>
              {a.description && <div className="news-desc">{a.description}</div>}
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
