import React from "react";
import ReactDOM from "react-dom/client";

import App from "./app/App";
import "./styles/global.css";
import weaIcon from "./assets/icons/wea.png";
import ratesIcon from "./assets/icons/rates.png";
import newsIcon from "./assets/icons/news.png";

// Preload frequently-used widget icons so they appear immediately when modals open
try {
  const _img1 = new Image(); _img1.src = weaIcon;
  const _img2 = new Image(); _img2.src = ratesIcon;
  const _img3 = new Image(); _img3.src = newsIcon;
} catch (e) {
  // ignore in environments where Image isn't available
}

const root = ReactDOM.createRoot(
  document.getElementById("root")
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

