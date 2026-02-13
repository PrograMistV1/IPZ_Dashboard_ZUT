import React, { useEffect, useState } from "react";
import { getNews } from "../../services/news";

export default function WeatherNews({ category = "science", limit = 5 }) {
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

  if (loading) return <div className="weather-news">Loading…</div>;
  if (error) return <div className="weather-news">Error: {error}</div>;

  return (
    <div className="weather-news">
      <h4>News</h4>
      <div className="news-cards">
        {articles.map((a, i) => (
          <a key={i} className="news-card" href={a.url} target="_blank" rel="noreferrer">
            <div className="card-title">{a.title}</div>
            <div className="card-source">{a.source || a.author || ''}</div>
          </a>
        ))}
      </div>
    </div>
  );
}
