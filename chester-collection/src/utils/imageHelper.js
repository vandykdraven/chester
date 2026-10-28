// File: src/utils/imageHelper.js

export const getImageUrl = (imagePath) => {
  // 1. Evaluasi Kritis: Jika data gambar kosong, kembalikan gambar default
  // Pastikan kamu memiliki file 'placeholder.png' di dalam folder 'public' frontend-mu
  if (!imagePath) return "/placeholder.png";

  // 2. Deteksi Cerdas URL Eksternal: 
  // Jika path sudah berupa URL lengkap dari internet (misal: Unsplash, web lain)
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath;
  }

  // 3. Penggabungan Path Internal:
  // Ambil URL backend dari file .env (misal: http://localhost:5000)
  const baseUrl = import.meta.env.VITE_BASE_URL || "";

  // Pastikan penggabungan URL tidak menghasilkan garis miring ganda (//)
  const cleanPath = imagePath.startsWith("/") ? imagePath : `/${imagePath}`;

  return `${baseUrl}${cleanPath}`;
};