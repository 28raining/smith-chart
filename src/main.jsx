import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { initI18n } from "./i18n.js";
import "./index.css";
import App from "./App.jsx";

initI18n().then(() => {
  createRoot(document.getElementById("root")).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});
