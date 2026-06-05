import { Navigate, Outlet } from "react-router-dom";

export default function AdminGuard() {
  // Mengecek apakah ada token admin yang tersimpan di Local Storage browser
  const token = localStorage.getItem("adminToken");

  // Jika tidak ada token (berarti belum login), langsung lempar ke halaman login
  if (!token) {
    return <Navigate to="/admin-login" replace />;
  }

  // Jika ada token, silakan masuk ke rute yang diminta (Outlet mewakili komponen anak)
  return <Outlet />;
}
