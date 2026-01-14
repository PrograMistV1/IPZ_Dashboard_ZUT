import CurrencyWidget from "./CurrencyWidget";
import NewsWidget from "./NewsWidget";

export const widgetRegistry = {
  currency: {
    title: "Currency rates",
    component: CurrencyWidget,
  },

  news: {
    title: "News",
    component: NewsWidget,
  },
};

