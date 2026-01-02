import CurrencyWidget from "./CurrencyWidget";
import ContentHeadlineList from "./ContentHeadlineList";

export const widgetRegistry = {
  currency: {
    title: "Currency rates",
    component: CurrencyWidget,
  },

  news: {
    title: "News",
    component: ContentHeadlineList,
  },
};
