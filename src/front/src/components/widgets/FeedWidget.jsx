import React, {useEffect, useRef, useState} from "react";
import "./feedWidget.css";

/**
 * FeedWidget - wrapper component for displaying multiple data items as a scrollable feed
 *
 * @param {Object} props
 * @param {React.ComponentType} props.ItemComponent - component for rendering a single item
 * @param {Array} props.items - array of data to display
 * @param {Function} props.onLoadMore - function to load more data
 * @param {boolean} props.hasMore - whether there is more data to load
 * @param {boolean} props.loading - whether data is loading
 * @param {string} props.title - widget title
 * @param {Function} props.onDelete - function to delete widget
 * @param {Function} props.onSettings - function to open settings
 * @param {React.ReactNode} props.settingsPanel - settings panel component
 * @param {string} props.emptyMessage - message when no data
 * @param {('vertical'|'horizontal')} props.scrollDirection - scroll direction
 */
export default function FeedWidget({
                                       ItemComponent,
                                       items = [],
                                       onLoadMore,
                                       hasMore = false,
                                       loading = false,
                                       title = "Feed",
                                       onDelete,
                                       onSettings,
                                       settingsPanel,
                                       emptyMessage = "No items",
                                       itemProps = {},
                                       scrollDirection = "vertical",
                                   }) {
    const [showSettings, setShowSettings] = useState(false);
    const feedRef = useRef(null);

    const isHorizontal = scrollDirection === "horizontal";

    // Infinite scroll
    useEffect(() => {
        const feedEl = feedRef.current;
        if (!feedEl || !onLoadMore || !hasMore) return;

        const handleScroll = () => {
            if (isHorizontal) {
                const {scrollLeft, scrollWidth, clientWidth} = feedEl;
                if (scrollWidth - scrollLeft - clientWidth < 100 && !loading) {
                    onLoadMore();
                }
            } else {
                const {scrollTop, scrollHeight, clientHeight} = feedEl;
                if (scrollHeight - scrollTop - clientHeight < 100 && !loading) {
                    onLoadMore();
                }
            }
        };

        feedEl.addEventListener("scroll", handleScroll);
        return () => feedEl.removeEventListener("scroll", handleScroll);
    }, [onLoadMore, hasMore, loading, isHorizontal]);

    return (
        <div className={`feed-widget ${isHorizontal ? "horizontal" : "vertical"}`}>
            {/* Header */}
            <div className="feed-header">
                <h4 className="feed-title">{title}</h4>
                <div className="feed-actions">
                    {onSettings && (
                        <button
                            className="feed-icon-btn"
                            title="Settings"
                            onClick={() => setShowSettings(!showSettings)}
                        >
                            ⚙
                        </button>
                    )}
                    {onDelete && (
                        <button
                            className="feed-icon-btn danger"
                            title="Delete"
                            onClick={() => {
                                if (window.confirm("Delete this widget?")) {
                                    onDelete();
                                }
                            }}
                        >
                            🗑
                        </button>
                    )}
                </div>
            </div>

            {/* Settings Panel */}
            {showSettings && settingsPanel && (
                <div className="feed-settings">
                    {settingsPanel}
                    <button
                        className="feed-settings-close"
                        onClick={() => setShowSettings(false)}
                    >
                        Close
                    </button>
                </div>
            )}

            {/* Feed Content */}
            <div className={`feed-content ${isHorizontal ? "horizontal" : "vertical"}`} ref={feedRef}>
                {items.length === 0 && !loading && (
                    <div className="feed-empty">{emptyMessage}</div>
                )}

                {items.map((item, index) => (
                    <div key={item.id || index} className={`feed-item ${isHorizontal ? "horizontal" : ""}`}>
                        <ItemComponent item={item} {...itemProps} />
                    </div>
                ))}

                {loading && (
                    <div className="feed-loading">Loading...</div>
                )}

                {hasMore && !loading && items.length > 0 && (
                    <button className="feed-load-more" onClick={onLoadMore}>
                        Load more
                    </button>
                )}
            </div>
        </div>
    );
}

/**
 * Simple component for news item in feed
 */
export function NewsFeedItem({item}) {
    return (
        <div className="news-feed-item">
            <a href={item.url} target="_blank" rel="noreferrer" className="news-feed-title">
                {item.title}
            </a>
            {item.description && (
                <p className="news-feed-description">{item.description}</p>
            )}
            <div className="news-feed-meta">
                <span className="news-feed-source">{item.source}</span>
                {item.published_at && (
                    <span className="news-feed-date">
                        {new Date(item.published_at).toLocaleString()}
                    </span>
                )}
            </div>
        </div>
    );
}

/**
 * Component for currency item in feed
 */
export function CurrencyFeedItem({item}) {
    const changeClass = item.change > 0 ? "positive" : item.change < 0 ? "negative" : "";

    return (
        <div className="currency-feed-item">
            <div className="currency-feed-main">
                <span className="currency-feed-code">{item.code}</span>
                <span className="currency-feed-rate">{item.rate?.toFixed(4)}</span>
            </div>
            {item.change !== undefined && (
                <span className={`currency-feed-change ${changeClass}`}>
                    {item.change > 0 ? "+" : ""}{item.change?.toFixed(4)}
                </span>
            )}
        </div>
    );
}
