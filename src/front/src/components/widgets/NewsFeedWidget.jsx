import React, {useEffect, useState, useRef} from 'react';
import Widget from './Widget';
import {getNews} from '../../services/news';
import {updateWidget} from '../../services/dashboard';
import {DIRECTIONS, NEWS_CATEGORIES} from '../../constants/api';

export default function NewsFeedWidget({ widgetId, id, mode = 'feed', data: _data, onUpdate }) {
  const config = _data && (_data.configuration || _data) || {};
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [category, setCategory] = useState(config.category || NEWS_CATEGORIES[0].value);
  const [direction, setDirection] = useState(config.direction || DIRECTIONS[0].value);
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

  // Save category or direction to DB on change
  const handleConfigChange = async (newConfig) => {
    setSaving(true);
    setSaveError(null);
    const wid = widgetId || id;
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

  const handleCategoryChange = async (e) => {
    const newCategory = e.target.value;
    setCategory(newCategory);
    const newConfig = { category: newCategory, direction };
    await handleConfigChange(newConfig);
  };

  const handleDirectionChange = async (e) => {
    const newDirection = e.target.value;
    setDirection(newDirection);
    const newConfig = { category, direction: newDirection };
    await handleConfigChange(newConfig);
  };

  // Widget settings (category, direction)
  const settingsNode = (
    <div className="widget-settings-portal">
      <div className="widget-settings-inner">
        <strong>Settings — {id}</strong>
        <div style={{ marginTop: 0, display: 'flex', gap: 8, flexDirection: 'column' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="field-label">Category:</span>
            <select className="news-select"
              value={category}
              onChange={handleCategoryChange}
              onMouseDown={e => e.stopPropagation()}
              onPointerDown={e => e.stopPropagation()}
              disabled={saving}
            >
              {NEWS_CATEGORIES.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="field-label">Direction:</span>
            <select className="news-select"
              value={direction}
              onChange={handleDirectionChange}
              onMouseDown={e => e.stopPropagation()}
              onPointerDown={e => e.stopPropagation()}
              disabled={saving}
            >
              {DIRECTIONS.map(opt => (
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

  // List style depending on direction
  const isHorizontal = direction === 'horizontal';
  const listStyle = isHorizontal
    ? {
        display: 'flex',
        flexDirection: 'row',
        overflowX: 'auto',
        gap: 8,
        padding: 0,
        margin: 0,
        listStyle: 'none',
        alignItems: 'stretch',
        minHeight: 48,
        height: '100%',
      }
    : {
        paddingLeft: 16,
        margin: 0,
        listStyle: 'none',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        rowGap: 8,
        flex: 1,
        alignItems: 'stretch',
      };
  const itemStyle = isHorizontal
    ? {
        minWidth: 220,
        height: 'auto',
        minHeight: 48,
        marginBottom: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        gap: 4,
        padding: '8px 10px',
        background: '#f7fafc',
        borderRadius: 8,
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        marginRight: 0,
        overflow: 'hidden',
        justifyContent: 'center',
        flex: '0 1 auto',
      }
    : {
        minWidth: 220,
        width: 'auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        gap: 4,
        padding: '12px 16px',
        background: '#f7fafc',
        borderRadius: 10,
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        justifyContent: 'center',
        flex: '0 1 auto',
      };

  const listRef = useRef(null);

  return (
    <Widget id={widgetId || id} mode={mode} data={articles} settings={settingsNode}>
      {loading ? (
        <div style={{ padding: 12 }}>Loading…</div>
      ) : error ? (
        <div style={{ padding: 12, color: '#ef4444' }}>Error: {error}</div>
      ) : (
        <ul ref={listRef} className={isHorizontal ? 'news-list-horizontal' : 'news-list-vertical'} style={listStyle}>
          {Array.isArray(articles) && articles.length ? (
            articles.map((item, i) => (
              <li key={item.url || item.id || i} style={itemStyle}>
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
