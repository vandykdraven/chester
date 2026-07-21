import { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import {
  User,
  ShoppingBag,
  MapPin,
  Ticket,
  Heart,
  LogOut,
  Trash2,
  ShoppingCart,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import axios from "axios";

export default function Wishlist() {
  const navigate = useNavigate();
  const location = useLocation();

  const [userData, setUserData] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [wishlists, setWishlists] = useState([]);
  const [loading, setLoading] = useState(true);

  // State untuk Notifikasi Kustom
  const [customAlert, setCustomAlert] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const BASE_URL = import.meta.env.VITE_API_URL.replace("/api", "");

  useEffect(() => {
    // Validasi sesi pengguna
    const storedUser = JSON.parse(
      localStorage.getItem("customerUser") ||
        sessionStorage.getItem("customerUser"),
    );
    if (!storedUser) {
      navigate("/login");
      return;
    }
    setUserData(storedUser);
    if (storedUser.avatar) setAvatarPreview(`${BASE_URL}${storedUser.avatar}`);

    fetchWishlists(storedUser.id);
  }, [navigate, BASE_URL]);

  const showAlert = (message, type = "success") => {
    setCustomAlert({ show: true, message, type });
    setTimeout(
      () => setCustomAlert({ show: false, message: "", type: "success" }),
      3000,
    );
  };

  const fetchWishlists = async (userId) => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/users/${userId}/wishlists`,
      );
      if (response.data.success) {
        setWishlists(response.data.data);
      }
    } catch (error) {
      console.error("Gagal memuat wishlist:", error);
    } finally {
      setLoading(false);
    }
  };

  const removeWishlist = async (wishlistId) => {
    try {
      const response = await axios.delete(
        `${import.meta.env.VITE_API_URL}/wishlists/${wishlistId}`,
      );
      if (response.data.success) {
        // Hapus item dari state lokal untuk kinerja yang lebih cepat tanpa harus memuat ulang data dari server
        setWishlists(
          wishlists.filter((item) => item.wishlist_id !== wishlistId),
        );
        showAlert("Produk dihapus dari Wishlist.", "success");
      }
    } catch (error) {
      showAlert("Gagal menghapus produk.", "error");
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    navigate("/login");
  };

  const formatRupiah = (number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(number);
  };

  if (!userData) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-10 font-lora relative">
      {/* AREA NOTIFIKASI */}
      {customAlert.show && (
        <div className="fixed top-6 right-6 z-50 animate-bounce">
          <div
            className={`flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-xl border text-sm font-semibold text-white ${customAlert.type === "success" ? "bg-emerald-500 border-emerald-400" : "bg-rose-500 border-rose-400"}`}
          >
            {customAlert.type === "success" ? (
              <CheckCircle size={20} />
            ) : (
              <AlertCircle size={20} />
            )}
            <span>{customAlert.message}</span>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* AREA SIDEBAR NAVIGASI */}
          <div className="md:col-span-3">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-6 text-center border-b border-gray-100 bg-gray-950 text-white">
                <div className="w-16 h-16 mx-auto rounded-full bg-gray-800 border-2 border-chester-pink overflow-hidden mb-3">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xl font-bold uppercase">
                      {userData.fullname.charAt(0)}
                    </div>
                  )}
                </div>
                <h3 className="font-bold text-sm truncate">
                  {userData.fullname}
                </h3>
              </div>

              <nav className="flex flex-col p-2 gap-1 text-sm font-semibold">
                <Link
                  to="/profile"
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${location.pathname === "/profile" ? "bg-pink-50 text-chester-pink" : "text-gray-600 hover:bg-gray-50"}`}
                >
                  <User size={18} /> Profil Saya
                </Link>
                <Link
                  to="/addresses"
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${location.pathname === "/addresses" ? "bg-pink-50 text-chester-pink" : "text-gray-600 hover:bg-gray-50"}`}
                >
                  <MapPin size={18} /> Buku Alamat
                </Link>
                <Link
                  to="/orders"
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${location.pathname === "/orders" ? "bg-pink-50 text-chester-pink" : "text-gray-600 hover:bg-gray-50"}`}
                >
                  <ShoppingBag size={18} /> Pesanan Saya
                </Link>
                <Link
                  to="/vouchers"
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${location.pathname === "/vouchers" ? "bg-pink-50 text-chester-pink" : "text-gray-600 hover:bg-gray-50"}`}
                >
                  <Ticket size={18} /> Voucher Saya
                </Link>
                <Link
                  to="/wishlist"
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${location.pathname === "/wishlist" ? "bg-pink-50 text-chester-pink" : "text-gray-600 hover:bg-gray-50"}`}
                >
                  <Heart size={18} /> Wishlist
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 transition-colors text-left mt-2 border-t border-gray-100"
                >
                  <LogOut size={18} /> Keluar Akun
                </button>
              </nav>
            </div>
          </div>

          {/* AREA KONTEN UTAMA */}
          <div className="md:col-span-9 space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-8 border-b border-gray-100 pb-4">
                <Heart className="text-chester-pink" size={28} />
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Daftar Keinginan Saya
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Koleksi produk mroblong yang Anda sukai dan simpan untuk
                    dibeli nanti.
                  </p>
                </div>
              </div>

              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-chester-pink"></div>
                </div>
              ) : wishlists.length === 0 ? (
                <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
                  <Heart size={48} className="mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-bold text-gray-800 mb-1">
                    Wishlist Anda Masih Kosong
                  </h3>
                  <p className="text-gray-500 text-sm mb-6">
                    Temukan produk favorit Anda dan klik tanda hati untuk
                    menyimpannya di sini.
                  </p>
                  <Link
                    to="/"
                    className="inline-block bg-gray-950 hover:bg-black text-white px-6 py-3 rounded-xl text-sm font-bold transition-colors"
                  >
                    Mulai Belanja
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {wishlists.map((item) => {
                    // DIPERBARUI: Kalkulasi harga seperti di Home/Catalog
                    const displayPrice =
                      item.has_variant === 1
                        ? Number(item.min_v_price || item.price || 0)
                        : Number(item.price || 0);

                    // DIPERBARUI: Fallback ke product_id jika slug kosong
                    const targetLink = item.slug
                      ? `/product/${item.slug}`
                      : `/product/${item.product_id}`;

                    return (
                      <div
                        key={item.wishlist_id}
                        className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group"
                      >
                        <div className="relative aspect-[4/5] bg-gray-100 overflow-hidden">
                          <img
                            src={
                              item.primary_image
                                ? `${BASE_URL}${item.primary_image}`
                                : "/placeholder.png"
                            }
                            alt={item.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <button
                            onClick={() => removeWishlist(item.wishlist_id)}
                            className="absolute top-3 right-3 bg-white/90 backdrop-blur p-2 rounded-full text-gray-400 hover:text-red-500 hover:bg-white shadow-sm transition-all"
                            title="Hapus dari Wishlist"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>

                        <div className="p-4 flex flex-col justify-between h-36">
                          <div>
                            <h4 className="font-bold text-gray-900 text-sm line-clamp-2">
                              {item.name}
                            </h4>
                            <p className="font-black text-chester-pink mt-1">
                              {/* DIPERBARUI: Memanggil displayPrice */}
                              {formatRupiah(displayPrice)}
                            </p>
                          </div>

                          <Link
                            to={targetLink}
                            className="w-full flex items-center justify-center gap-2 bg-pink-50 hover:bg-pink-100 text-chester-pink py-2.5 rounded-xl text-xs font-bold transition-colors mt-3"
                          >
                            <ShoppingCart size={14} /> Lihat Produk
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
