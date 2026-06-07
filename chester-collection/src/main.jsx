import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";

// 1. Load Tailwind CSS (Harus paling atas)
import "./index.css";

import { HelmetProvider } from "react-helmet-async";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </React.StrictMode>,
);
