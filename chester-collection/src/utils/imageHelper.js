// File: src/utils/imageHelper.js

export const getImageUrl = (imagePath) => {
  // Evaluasi kritis: Jika data gambar kosong dari database, cegah error dengan merender path kosong atau gambar default
  if (!imagePath) return "";

  const baseUrl = import.meta.env.VITE_BASE_URL;

  // Pastikan penggabungan URL tidak menghasilkan garis miring ganda (//)
  const cleanPath = imagePath.startsWith("/") ? imagePath : `/${imagePath}`;

  return `${baseUrl}${cleanPath}`;
};
