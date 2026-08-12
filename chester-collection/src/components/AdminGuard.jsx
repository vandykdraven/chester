import { Navigate, Outlet, useLocation } from "react-router-dom";

export default function AdminGuard({ allowedRoles }) {
  const location = useLocation();

  // 1. Ambil token
  const token =
    localStorage.getItem("adminToken") || sessionStorage.getItem("adminToken");

  // 2. Ambil data user
  const userStr =
    localStorage.getItem("admin") || sessionStorage.getItem("admin");

  // Jika tidak ada token atau data user (berarti belum login), lempar ke halaman login
  if (!token || !userStr) {
    return <Navigate to="/admin-login" state={{ from: location }} replace />;
  }

  // Parse data string menjadi objek JSON
  const user = JSON.parse(userStr);

  // 3. Logika Validasi Peran (Role) - ANTI SENSITIF HURUF
  if (allowedRoles && allowedRoles.length > 0) {
    // Ubah role pengguna saat ini menjadi huruf kecil, default 'editor' jika kosong
    const currentUserRole = (user.role || "editor").toLowerCase();

    // Ubah semua array allowedRoles menjadi huruf kecil juga
    const normalizedAllowedRoles = allowedRoles.map((role) =>
      role.toLowerCase(),
    );

    if (!normalizedAllowedRoles.includes(currentUserRole)) {
      // Jika role tidak sesuai, lemparkan kembali ke dashboard utama admin
      return <Navigate to="/admin" replace />;
    }
  }

  // 4. Jika lolos semua pengecekan, silakan masuk ke rute yang diminta
  return <Outlet />;
}
