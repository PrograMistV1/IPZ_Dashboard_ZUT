import CurrencyWidget from "./CurrencyWidget";
import NewsWidget from "./NewsWidget";
import WeatherWidget from "./WeatherWidget";

export const widgetRegistry = {
  currency: {
    title: "Currency rates",
    component: CurrencyWidget,
  },

  news: {
    title: "News",
    component: NewsWidget,
  },

  weather: {
    title: "Weather",
    component: WeatherWidget,
  },
};

