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
      <ul>
        {articles.map((a, i) => (
          <li key={i}>
            <a href={a.url} target="_blank" rel="noreferrer">
              {a.title}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
