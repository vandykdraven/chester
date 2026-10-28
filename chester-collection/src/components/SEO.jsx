import { Helmet } from "react-helmet-async";

// Mengambil URL API Backend untuk menyusun URL gambar absolut
const BASE_API_URL = import.meta.env.VITE_API_URL 
  ? import.meta.env.VITE_API_URL.replace("/api", "") 
  : "";

export default function SEO({
  title,
  description,
  keywords,
  image,
  url,
  noindex,
}) {
  // 1. Identitas Default yang Kuat & Sesuai Fakta Bisnis
  const defaultTitle = "Chester Collection | All About Fashion";
  const defaultDesc =
    "Fashion Wanita terlengkap di Solo Raya dengan koleksi pakaian dan aksesoris wanita yang stylish dan berkualitas tinggi. Temukan tren terbaru dan penawaran eksklusif hanya di Chester Collection.";
  const defaultKeywords =
    "chester collection, Fashion Wanita, Solo Raya, Pakaian Wanita, Aksesoris Wanita";

  // 2. Deteksi Domain Frontend Secara Otomatis
  const siteUrl = typeof window !== "undefined" ? window.location.origin : "";
  const defaultImage = `${siteUrl}/logo.png`; // Pastikan file logo.png ada di dalam folder public/

  // 3. Logika Pembuatan URL Gambar Absolut untuk Open Graph
  let ogImage = defaultImage;
  if (image) {
    if (image.startsWith("http")) {
      ogImage = image; // Jika sudah absolut dari internet
    } else {
      ogImage = `${BASE_API_URL}${image}`; // Jika path relatif dari server backend lokal kita
    }
  }

  // 4. Logika Pembuatan URL Halaman Absolut
  const ogUrl = url ? `${siteUrl}${url}` : siteUrl;

  return (
    <Helmet>
      {/* Standar SEO Google */}
      <title>{title ? `${title} | All About Fashion` : defaultTitle}</title>
      <meta name="description" content={description || defaultDesc} />
      <meta name="keywords" content={keywords || defaultKeywords} />

      {/* Pengaturan Indexing (Mencegah Google membaca halaman seperti Checkout/Keranjang) */}
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      {/* Open Graph / Sosial Media (Penting untuk thumbnail WhatsApp, Facebook, dll) */}
      <meta property="og:title" content={title || defaultTitle} />
      <meta property="og:description" content={description || defaultDesc} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:url" content={ogUrl} />
      <meta property="og:type" content="website" />
      
      {/* Twitter Card (Memastikan preview gambar besar jika di-share di X/Twitter) */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title || defaultTitle} />
      <meta name="twitter:description" content={description || defaultDesc} />
      <meta name="twitter:image" content={ogImage} />
    </Helmet>
  );
}