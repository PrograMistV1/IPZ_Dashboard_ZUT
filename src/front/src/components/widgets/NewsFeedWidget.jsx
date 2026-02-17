import React, {useEffect, useState} from 'react';
import Widget from './Widget';
import {getNews} from '../../services/news';
import {updateWidget} from '../../services/dashboard';

const CATEGORIES = [
  { value: 'general', label: 'General' },
  { value: 'business', label: 'Business' },
  { value: 'technology', label: 'Technology' },
  { value: 'sports', label: 'Sports' },
  { value: 'health', label: 'Health' },
  { value: 'science', label: 'Science' },
  { value: 'entertainment', label: 'Entertainment' },
];

export default function NewsFeedWidget({ widgetId, id, mode = 'feed', data: _data, onUpdate }) {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [category, setCategory] = useState((_data && (_data.category || _data.configuration?.category)) || 'general');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await getNews(category);
        if (!mounted) return;
        setArticles(res.articles || []);
      } catch (e) {
        if (!mounted) return;
        setError(e.message || String(e));
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [category]);

  // Save category to DB on change
  const handleCategoryChange = async (e) => {
    const newCategory = e.target.value;
    setCategory(newCategory);
    setSaving(true);
    setSaveError(null);
    const wid = widgetId || id;
    const newConfig = { category: newCategory };
    try {
      await updateWidget(wid, { configuration: newConfig });
      if (typeof onUpdate === 'function') {
        onUpdate(wid, newConfig);
      }
    } catch (err) {
      setSaveError('Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  // Widget settings (category)
  const settingsNode = (
    <div className="widget-settings-portal">
      <div className="widget-settings-inner">
        <strong>Settings — {id}</strong>
        <div style={{ marginTop: 8, display: 'flex', gap: 8, flexDirection: 'column' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            Category:
            <select
              value={category}
              onChange={handleCategoryChange}
              onMouseDown={e => e.stopPropagation()}
              onPointerDown={e => e.stopPropagation()}
              disabled={saving}
            >
              {CATEGORIES.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            {saving && <span style={{ fontSize: 12, color: '#888' }}>Saving…</span>}
          </label>
          {saveError && <div style={{ color: '#ef4444', fontSize: 12 }}>{saveError}</div>}
        </div>
      </div>
    </div>
  );

  return (
    <Widget id={widgetId || id} mode={mode} data={articles} settings={settingsNode}>
      {loading ? (
        <div style={{ padding: 12 }}>Loading…</div>
      ) : error ? (
        <div style={{ padding: 12, color: '#ef4444' }}>Error: {error}</div>
      ) : (
        <ul style={{ paddingLeft: 16, margin: 0 }}>
          {Array.isArray(articles) && articles.length ? (
            articles.map((item, i) => (
              <li key={item.url || item.id || i} style={{ marginBottom: 10 }}>
                <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 2 }}>
                  {item.url ? (
                    <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', textDecoration: 'none' }}>{item.title || item.headline}</a>
                  ) : (
                    item.title || item.headline
                  )}
                </div>
                <div style={{ fontSize: 12, color: '#555', marginBottom: 2 }}>
                  {item.source || item.source_name || '—'}
                  {item.published_at && (
                    <span style={{ marginLeft: 8, color: '#888' }}>{new Date(item.published_at).toLocaleString()}</span>
                  )}
                </div>
                {item.description && (
                  <div style={{ fontSize: 13, color: '#444' }}>{item.description}</div>
                )}
              </li>
            ))
          ) : (
            <li>No news</li>
          )}
        </ul>
      )}
    </Widget>
  );
}
