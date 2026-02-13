import CurrencyWidget from "./CurrencyWidget";
import NewsFeedWidget from "./NewsFeedWidget";
import CurrencyFeedWidget from "./CurrencyFeedWidget";

/**
 * Widget data types configuration
 * - news: feed mode only (single news item doesn't make sense)
 * - currency: feed or standard (with chart)
 */
export const widgetTypes = {
    news: {
        title: "News",
        description: "News articles from various sources",
        modes: ["feed"],
        defaultMode: "feed",
    },
    currency: {
        title: "Currency",
        description: "Currency exchange rates",
        modes: ["feed", "standard"],
        defaultMode: "feed",
    },
};

/**
 * Widget components mapping by type and mode
 */
export const widgetComponents = {
    news: {
        feed: NewsFeedWidget,
    },
    currency: {
        feed: CurrencyFeedWidget,
        standard: CurrencyWidget,
    },
};

/**
 * Server type to component mapping
 * Maps backend widget types to their React components
 */
export const serverTypeMap = {
    newsFeed: NewsFeedWidget,
    currencyFeed: CurrencyFeedWidget,
    rates: CurrencyWidget,
};

/**
 * Get widget component by type and mode
 */
export function getWidgetComponent(type, mode = "feed") {
    return widgetComponents[type]?.[mode] || null;
}

/**
 * Get widget component by server type
 */
export function getComponentByServerType(serverType) {
    return serverTypeMap[serverType] || null;
}
