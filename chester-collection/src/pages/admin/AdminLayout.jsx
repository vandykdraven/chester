import { useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  ExternalLink,
  ChevronDown,
} from "lucide-react";
import logo from "../../assets/logo.png"; // Pastikan path logo sesuai

export default function AdminLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProductMenuOpen, setIsProductMenuOpen] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  // Fungsi untuk Keluar (Hapus memori keamanan, lalu arahkan ke halaman login)
  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminData");
    navigate("/admin-login");
  };

  // Menu statis selain Dashboard dan Produk
  const menuItems = [
    {
      name: "Pesanan",
      icon: <ShoppingCart size={20} />,
      path: "/admin/orders",
    },
    { name: "Pelanggan", icon: <Users size={20} />, path: "/admin/customers" },
    {
      name: "Pengaturan",
      icon: <Settings size={20} />,
      path: "/admin/settings",
    },
  ];

  return (
    <div className="flex h-screen bg-gray-50 font-lora overflow-hidden">
      {/* ========================================== */}
      {/* SIDEBAR KIRI */}
      {/* ========================================== */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 flex flex-col ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* LOGO: Rata Kiri di Mobile, Rata Tengah & Besar di PC */}
        <div className="flex items-center justify-between h-24 px-6 border-b border-gray-100 flex-shrink-0">
          <img
            src={logo}
            alt="Chester Admin"
            className="h-10 lg:h-16 w-auto object-contain lg:mx-auto transition-all duration-300"
          />
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden text-gray-500 hover:text-chester-pink transition"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex flex-col justify-between flex-1 p-4 overflow-y-auto custom-scrollbar">
          <nav className="flex flex-col gap-2">
            {/* 1. Menu Dashboard */}
            <Link
              to="/admin"
              onClick={() => setIsSidebarOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${location.pathname === "/admin" ? "bg-chester-pink text-white font-bold" : "text-gray-600 hover:bg-gray-100 hover:text-chester-text font-medium"}`}
            >
              <LayoutDashboard size={20} /> Dashboard
            </Link>

            {/* 2. Menu Dropdown Produk Bersarang */}
            <div>
              <button
                onClick={() => setIsProductMenuOpen(!isProductMenuOpen)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors font-medium ${location.pathname.includes("/admin/product") ? "text-chester-pink bg-pink-50" : "text-gray-600 hover:bg-gray-100 hover:text-chester-text"}`}
              >
                <div className="flex items-center gap-3">
                  <Package size={20} /> Produk
                </div>
                <ChevronDown
                  size={16}
                  className={`transition-transform duration-300 ${isProductMenuOpen ? "rotate-180" : ""}`}
                />
              </button>

              {/* Sub-menu Produk (Animasi Buka/Tutup) */}
              <div
                className={`overflow-hidden transition-all duration-300 flex flex-col gap-1 ${isProductMenuOpen ? "max-h-64 mt-1 opacity-100" : "max-h-0 opacity-0 pointer-events-none"}`}
              >
                <Link
                  to="/admin/products"
                  onClick={() => setIsSidebarOpen(false)}
                  className="pl-11 pr-4 py-2 text-sm text-gray-500 hover:text-chester-pink hover:bg-pink-50/50 rounded-lg transition-colors font-medium"
                >
                  Daftar Produk
                </Link>
                <Link
                  to="/admin/product-categories"
                  onClick={() => setIsSidebarOpen(false)}
                  className="pl-11 pr-4 py-2 text-sm text-gray-500 hover:text-chester-pink hover:bg-pink-50/50 rounded-lg transition-colors font-medium"
                >
                  Kategori Produk
                </Link>
                <Link
                  to="/admin/product-tags"
                  onClick={() => setIsSidebarOpen(false)}
                  className="pl-11 pr-4 py-2 text-sm text-gray-500 hover:text-chester-pink hover:bg-pink-50/50 rounded-lg transition-colors font-medium"
                >
                  Tag & Label
                </Link>
                <Link
                  to="/admin/product-vouchers"
                  onClick={() => setIsSidebarOpen(false)}
                  className="pl-11 pr-4 py-2 text-sm text-gray-500 hover:text-chester-pink hover:bg-pink-50/50 rounded-lg transition-colors font-medium"
                >
                  Voucher Diskon
                </Link>
                <Link
                  to="/admin/product-shipping"
                  onClick={() => setIsSidebarOpen(false)}
                  className="pl-11 pr-4 py-2 text-sm text-gray-500 hover:text-chester-pink hover:bg-pink-50/50 rounded-lg transition-colors font-medium"
                >
                  Pengaturan Ongkir
                </Link>
              </div>
            </div>

            {/* 3. Menu Sisanya (Pesanan, Pelanggan, Pengaturan) */}
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive ? "bg-chester-pink text-white font-bold" : "text-gray-600 hover:bg-gray-100 hover:text-chester-text font-medium"}`}
                >
                  {item.icon}
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Area Bawah Sidebar (Keluar & Kredit) */}
          <div className="mt-8">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-lg transition-colors font-medium cursor-pointer"
            >
              <LogOut size={20} />
              Keluar Admin
            </button>

            <div className="mt-6 pt-4 border-t border-gray-100 text-center">
              <p className="text-xs text-gray-500">
                Developed By{" "}
                <a
                  href="https://servermaya.web.id"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-chester-pink hover:underline font-bold transition-colors"
                >
                  servermaya
                </a>
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* OVERLAY MOBILE (Latar Hitam Redup Saat Sidebar Terbuka) */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* ========================================== */}
      {/* KONTEN UTAMA (KANAN) */}
      {/* ========================================== */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* TOPBAR ADMIN */}
        <header className="h-20 flex-shrink-0 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-8">
          {/* Tombol Hamburger Mobile */}
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="lg:hidden text-gray-500 hover:text-chester-text transition"
          >
            <Menu size={24} />
          </button>

          <div className="flex-1 lg:flex-none"></div>

          {/* Bagian Kanan Topbar */}
          <div className="flex items-center gap-6">
            {/* Tombol Lihat Website */}
            <Link
              to="/"
              className="flex items-center gap-2 text-xs md:text-sm font-semibold text-gray-600 hover:text-chester-pink border border-gray-200 hover:border-chester-pink px-4 py-2 rounded-lg bg-gray-50 hover:bg-white shadow-sm transition-all duration-300"
            >
              <ExternalLink size={16} />
              <span className="hidden sm:inline">Lihat Website</span>
            </Link>
            <div className="h-8 w-px bg-gray-200 hidden md:block"></div>{" "}
            {/* Garis Pembatas */}
            {/* Profil Admin */}
            <div className="flex items-center gap-3">
              <div className="text-right hidden md:block">
                <p className="text-sm font-bold text-chester-text">
                  Administrator
                </p>
                <p className="text-xs text-gray-500">admin@chester.com</p>
              </div>
              <div className="h-10 w-10 bg-chester-text text-white rounded-full flex items-center justify-center font-bold shadow-sm">
                A
              </div>
            </div>
          </div>
        </header>

        {/* AREA RENDER HALAMAN ANAK (Dashboard, Daftar Produk, dll) */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 bg-gray-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
