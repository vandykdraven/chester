import axios from "axios";

// 1. Inisialisasi API dasar
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// 2. Menambahkan "Interceptor" untuk setiap request yang keluar
api.interceptors.request.use(
  (config) => {
    // Mengambil token dari penyimpanan browser (baik dari localStorage maupun sessionStorage)
    const adminToken = localStorage.getItem("adminToken") || sessionStorage.getItem("adminToken");
    const customerToken = localStorage.getItem("customerToken") || sessionStorage.getItem("customerToken");

    // Mendeteksi apakah user sedang berada di halaman panel admin
    const isAdminArea = window.location.pathname.startsWith("/admin");

    // Logika penyisipan Token secara otomatis
    if (isAdminArea && adminToken) {
      // Jika berada di halaman admin dan token admin ada, gunakan token admin
      config.headers.Authorization = `Bearer ${adminToken}`;
    } else if (customerToken) {
      // Selain itu (berada di halaman katalog/beranda), gunakan token pelanggan
      config.headers.Authorization = `Bearer ${customerToken}`;
    }

    return config;
  },
  (error) => {
    // Tangani jika terjadi error sebelum request terkirim
    return Promise.reject(error);
  }
);

export default api;