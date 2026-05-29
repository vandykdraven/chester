import { Helmet } from "react-helmet-async";

export default function SEO({
  title,
  description,
  keywords,
  image,
  url,
  noindex,
}) {
  const defaultTitle = "Chester Collection | Pakaian Wanita Premium";
  const defaultDesc =
    "Temukan koleksi pakaian wanita premium terbaik di Chester Collection.";
  const defaultImage = "https://domainkamu.com/default-banner.jpg"; // Gambar default jika tidak ada
  const siteUrl = "https://domainkamu.com";

  return (
    <Helmet>
      {/* Standar SEO */}
      <title>{title ? `${title} | Chester Collection` : defaultTitle}</title>
      <meta name="description" content={description || defaultDesc} />
      <meta
        name="keywords"
        content={keywords || "fashion wanita, chester collection"}
      />

      {/* Pengaturan Indexing (Mencegah Google membaca halaman rahasia) */}
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      {/* Open Graph / Sosial Media (Untuk share WA, FB, dll) */}
      <meta property="og:title" content={title || defaultTitle} />
      <meta property="og:description" content={description || defaultDesc} />
      <meta property="og:image" content={image || defaultImage} />
      <meta property="og:url" content={url ? `${siteUrl}${url}` : siteUrl} />
      <meta property="og:type" content="website" />
    </Helmet>
  );
}
