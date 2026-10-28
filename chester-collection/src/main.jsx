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
        title="Chester Collection" 
        description="Fashion Wanita terlengkap di Solo Raya dengan koleksi pakaian dan aksesoris wanita yang stylish dan berkualitas tinggi. Temukan tren terbaru dan penawaran eksklusif hanya di Chester Collection."
        keywords="chester collection, Fashion Wanita, Solo Raya, Pakaian Wanita, Aksesoris Wanita"
      />
      <App />
    </HelmetProvider>
  </React.StrictMode>
);