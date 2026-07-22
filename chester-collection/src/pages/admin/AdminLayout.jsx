import { useState, useEffect } from "react";
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
  Image as ImageIcon,
  FileText,
  Bell,
  MessageSquare,
} from "lucide-react";
import axios from "axios"; // ---> TAMBAHAN: Import Axios
import logo from "../../assets/logo.png";

export default function AdminLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProductMenuOpen, setIsProductMenuOpen] = useState(false);
  const [isStaticMenuOpen, setIsStaticMenuOpen] = useState(false);
  const [adminUser, setAdminUser] = useState({ fullname: "Admin", email: "" });

  // ---> TAMBAHAN: State untuk Notifikasi
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  // Ambil data admin
  useEffect(() => {
    const fetchAdminData = () => {
      const savedAdmin = JSON.parse(localStorage.getItem("admin"));
      if (savedAdmin) {
        setAdminUser(savedAdmin);
      }
    };
    fetchAdminData();
    window.addEventListener("storage", fetchAdminData);
    return () => window.removeEventListener("storage", fetchAdminData);
  }, [location.pathname]);

  // ---> TAMBAHAN: Fungsi mengambil notifikasi dari backend
  useEffect(() => {
    fetchNotifications();
    // Opsional: Refresh notifikasi setiap 60 detik secara otomatis
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/admin/notifications`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (response.data.success) {
        setNotifications(response.data.data);
        setUnreadCount(response.data.unread_count);
      }
    } catch (error) {
      console.error("Gagal memuat notifikasi", error);
    }
  };

  // ---> TAMBAHAN: Fungsi menandai notifikasi telah dibaca
  const markAsRead = async (id, isRead) => {
    if (isRead) return; // Jika sudah dibaca, abaikan
    try {
      const token = localStorage.getItem("adminToken");
      await axios.put(
        `${import.meta.env.VITE_API_URL}/admin/notifications/${id}/read`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      // Perbarui tampilan secara lokal tanpa memanggil ulang API
      setNotifications(
        notifications.map((notif) =>
          notif.id === id ? { ...notif, is_read: 1 } : notif,
        ),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Gagal menandai notifikasi", error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminData");
    localStorage.removeItem("admin");
    navigate("/admin-login");
  };

  const getInitial = (name) => {
    return name ? name.charAt(0).toUpperCase() : "A";
  };

  const menuItems = [
    {
      name: "Pesanan",
      icon: <ShoppingCart size={20} />,
      path: "/admin/orders",
    },
    { name: "Pelanggan", icon: <Users size={20} />, path: "/admin/customers" },
    {
      name: "Ulasan",
      icon: <MessageSquare size={20} />,
      path: "/admin/reviews",
    },
    {
      name: "Galeri Media",
      icon: <ImageIcon size={20} />,
      path: "/admin/products/gallery",
    },
    {
      name: "Halaman Depan",
      icon: <LayoutDashboard size={20} />,
      path: "/admin/homepage-settings",
    },
    {
      name: "Pengaturan",
      icon: <Settings size={20} />,
      path: "/admin/settings",
    },
  ];

  return (
    <div className="flex h-screen bg-gray-50 font-lora overflow-hidden">
      {/* SIDEBAR KIRI */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 flex flex-col ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
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
            <Link
              to="/admin"
              onClick={() => setIsSidebarOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${location.pathname === "/admin" ? "bg-chester-pink text-white font-bold" : "text-gray-600 hover:bg-gray-100 hover:text-chester-text font-medium"}`}
            >
              <LayoutDashboard size={20} /> Dashboard
            </Link>

            {/* Menu Produk */}
            <div>
              <button
                onClick={() => setIsProductMenuOpen(!isProductMenuOpen)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors font-medium ${location.pathname.includes("/admin/product") || location.pathname.includes("/admin/size-guides") ? "text-chester-pink bg-pink-50" : "text-gray-600 hover:bg-gray-100 hover:text-chester-text"}`}
              >
                <div className="flex items-center gap-3">
                  <Package size={20} /> Produk
                </div>
                <ChevronDown
                  size={16}
                  className={`transition-transform duration-300 ${isProductMenuOpen ? "rotate-180" : ""}`}
                />
              </button>
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
                  to="/admin/size-guides"
                  onClick={() => setIsSidebarOpen(false)}
                  className="pl-11 pr-4 py-2 text-sm text-gray-500 hover:text-chester-pink hover:bg-pink-50/50 rounded-lg transition-colors font-medium"
                >
                  Panduan Ukuran
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

            {/* Menu Halaman Statis */}
            <div>
              <button
                onClick={() => setIsStaticMenuOpen(!isStaticMenuOpen)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors font-medium ${location.pathname.includes("/admin/pages") ? "text-chester-pink bg-pink-50" : "text-gray-600 hover:bg-gray-100 hover:text-chester-text"}`}
              >
                <div className="flex items-center gap-3">
                  <FileText size={20} /> Halaman Statis
                </div>
                <ChevronDown
                  size={16}
                  className={`transition-transform duration-300 ${isStaticMenuOpen ? "rotate-180" : ""}`}
                />
              </button>
              <div
                className={`overflow-hidden transition-all duration-300 flex flex-col gap-1 ${isStaticMenuOpen ? "max-h-48 mt-1 opacity-100" : "max-h-0 opacity-0 pointer-events-none"}`}
              >
                <Link
                  to="/admin/pages/privacy"
                  onClick={() => setIsSidebarOpen(false)}
                  className="pl-11 pr-4 py-2 text-sm text-gray-500 hover:text-chester-pink hover:bg-pink-50/50 rounded-lg transition-colors font-medium"
                >
                  Kebijakan Privasi
                </Link>
                <Link
                  to="/admin/pages/faq"
                  onClick={() => setIsSidebarOpen(false)}
                  className="pl-11 pr-4 py-2 text-sm text-gray-500 hover:text-chester-pink hover:bg-pink-50/50 rounded-lg transition-colors font-medium"
                >
                  Tanya Jawab (FAQ)
                </Link>
                <Link
                  to="/admin/pages/terms"
                  onClick={() => setIsSidebarOpen(false)}
                  className="pl-11 pr-4 py-2 text-sm text-gray-500 hover:text-chester-pink hover:bg-pink-50/50 rounded-lg transition-colors font-medium"
                >
                  Syarat & Ketentuan
                </Link>
              </div>
            </div>

            {menuItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => setIsSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${location.pathname === item.path ? "bg-chester-pink text-white font-bold" : "text-gray-600 hover:bg-gray-100 hover:text-chester-text font-medium"}`}
              >
                {item.icon} {item.name}
              </Link>
            ))}
          </nav>

          <div className="mt-8">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-lg transition-colors font-medium cursor-pointer"
            >
              <LogOut size={20} /> Keluar Admin
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

      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* KONTEN UTAMA (KANAN) */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-20 flex-shrink-0 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-8">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="lg:hidden text-gray-500 hover:text-chester-text transition"
          >
            <Menu size={24} />
          </button>

          <div className="flex-1 lg:flex-none"></div>

          <div className="flex items-center gap-4 sm:gap-6">
            <Link
              to="/"
              className="hidden sm:flex items-center gap-2 text-xs md:text-sm font-semibold text-gray-600 hover:text-chester-pink border border-gray-200 hover:border-chester-pink px-4 py-2 rounded-lg bg-gray-50 hover:bg-white shadow-sm transition-all duration-300"
            >
              <ExternalLink size={16} /> Lihat Website
            </Link>

            {/* ---> TAMBAHAN: Komponen Lonceng Notifikasi */}
            <div className="relative">
              <button
                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                className="relative p-2 text-gray-500 hover:text-chester-pink transition bg-gray-50 hover:bg-pink-50 rounded-full border border-gray-100"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 h-3 w-3 bg-red-500 rounded-full border-2 border-white"></span>
                )}
              </button>

              {/* Kotak Dropdown Notifikasi */}
              {isNotificationOpen && (
                <div className="absolute right-0 mt-3 w-80 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden">
                  <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                    <h4 className="font-bold text-gray-900 text-sm">
                      Notifikasi
                    </h4>
                    {unreadCount > 0 && (
                      <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full font-bold">
                        {unreadCount} Baru
                      </span>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto custom-scrollbar">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-gray-500 text-sm">
                        Belum ada notifikasi baru.
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif.id}
                          onClick={() => markAsRead(notif.id, notif.is_read)}
                          className={`p-4 border-b border-gray-50 cursor-pointer transition-colors hover:bg-gray-50 flex gap-3 ${notif.is_read ? "opacity-60" : "bg-blue-50/30"}`}
                        >
                          <div
                            className={`w-2 h-2 mt-1.5 rounded-full flex-shrink-0 ${notif.is_read ? "bg-transparent" : "bg-chester-pink"}`}
                          ></div>
                          <div>
                            <p
                              className={`text-sm ${notif.is_read ? "text-gray-600" : "text-gray-900 font-medium"}`}
                            >
                              {notif.message}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {new Date(notif.created_at).toLocaleDateString(
                                "id-ID",
                                { hour: "2-digit", minute: "2-digit" },
                              )}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="h-8 w-px bg-gray-200 hidden md:block"></div>

            {/* PROFIL ADMIN DINAMIS */}
            <div className="flex items-center gap-3">
              <div className="text-right hidden md:block">
                <p className="text-sm font-bold text-chester-text">
                  {adminUser.fullname}
                </p>
                <p className="text-xs text-gray-500">{adminUser.email}</p>
              </div>
              <div className="h-10 w-10 bg-gray-900 text-white rounded-full flex items-center justify-center font-bold shadow-sm text-lg">
                {getInitial(adminUser.fullname)}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-8 bg-gray-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
