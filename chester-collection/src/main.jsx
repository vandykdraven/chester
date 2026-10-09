import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";

// 1. Load Tailwind CSS (Harus paling atas)
import "./index.css";

// 2. Konteks SEO Dinamis dan Komponen Default
import { HelmetProvider } from "react-helmet-async";
import SEO from "./components/SEO"; // Pastikan path ini sesuai dengan letak komponen SEO milikmu

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <HelmetProvider>
      {/* 
        Jaring Pengaman SEO Global:
        Data ini akan selalu dieksekusi jika halaman spesifik tidak memiliki komponen <SEO/> sendiri.
      */}
      <SEO 
        title="Chester Collection | Mroblong" 
        description="Produsen kaos polos terbesar di Surakarta. Menyediakan bahan cotton combed premium 30s & 24s dan melayani pemesanan kaos custom sablon DTF."
        keywords="kaos polos surakarta, sablon dtf, cotton combed premium, mroblong, chester collection"
      />
      <App />
    </HelmetProvider>
  </React.StrictMode>
);