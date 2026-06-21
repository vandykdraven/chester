import { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import {
  User,
  ShoppingBag,
  MapPin,
  Ticket,
  Heart,
  LogOut,
  Copy,
  CheckCircle,
  AlertCircle,
  Clock,
  Zap,
} from "lucide-react";
import axios from "axios";

export default function Vouchers() {
  const navigate = useNavigate();
  const location = useLocation();

  const [userData, setUserData] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  // State Data Voucher
  const [availablePromos, setAvailablePromos] = useState([]);
  const [myVouchers, setMyVouchers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("available"); // 'available' atau 'mine'
  const [copiedCode, setCopiedCode] = useState(null);
  const [isClaiming, setIsClaiming] = useState(null); // Menyimpan ID voucher yang sedang proses klaim

  // State Custom Alert
  const [customAlert, setCustomAlert] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const BASE_URL = import.meta.env.VITE_API_URL.replace("/api", "");

  useEffect(() => {
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

    fetchStorefrontVouchers(storedUser.id);
  }, [navigate, BASE_URL]);

  const showAlert = (message, type = "success") => {
    setCustomAlert({ show: true, message, type });
    setTimeout(
      () => setCustomAlert({ show: false, message: "", type: "success" }),
      4000,
    );
  };

  // Mengambil data dari endpoint baru yang sudah kita buat di server.js
  const fetchStorefrontVouchers = async (userId) => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/vouchers/storefront/${userId}`,
      );
      if (response.data.success) {
        setAvailablePromos(response.data.data.available_promos);
        setMyVouchers(response.data.data.my_vouchers);
      }
    } catch (error) {
      console.error("Gagal memuat voucher:", error);
      showAlert("Gagal memuat data promosi.", "error");
    } finally {
      setLoading(false);
    }
  };

  // Fungsi Eksekusi Klaim Voucher
  const handleClaimVoucher = async (voucherId) => {
    setIsClaiming(voucherId);
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/vouchers/claim`,
        {
          user_id: userData.id,
          voucher_id: voucherId,
        },
      );

      if (response.data.success) {
        showAlert("Voucher berhasil diklaim!", "success");
        // Pindah otomatis ke tab "Voucher Saya" dan refresh data
        setActiveTab("mine");
        fetchStorefrontVouchers(userData.id);
      }
    } catch (error) {
      const errorMsg =
        error.response?.data?.message || "Gagal mengklaim voucher.";
      showAlert(errorMsg, "error");
    } finally {
      setIsClaiming(null);
    }
  };

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
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
      {/* CUSTOM ALERTS */}
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
          {/* SIDEBAR NAVIGATION */}
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

          {/* MAIN CONTENT AREA */}
          <div className="md:col-span-9 space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-6 sm:p-8 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-pink-50 rounded-xl text-chester-pink">
                    <Ticket size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      Voucher & Promo
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                      Klaim promo menarik dan gunakan saat checkout untuk lebih
                      hemat!
                    </p>
                  </div>
                </div>
              </div>

              {/* TABS NAVIGATION */}
              <div className="flex border-b border-gray-100 bg-gray-50/50">
                <button
                  onClick={() => setActiveTab("available")}
                  className={`flex-1 py-4 text-sm font-bold border-b-2 transition-colors flex items-center justify-center gap-2 ${activeTab === "available" ? "border-chester-pink text-chester-pink bg-white" : "border-transparent text-gray-500 hover:text-gray-800"}`}
                >
                  <Zap size={16} /> Promo Tersedia
                  {availablePromos.length > 0 && (
                    <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">
                      {availablePromos.length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab("mine")}
                  className={`flex-1 py-4 text-sm font-bold border-b-2 transition-colors flex items-center justify-center gap-2 ${activeTab === "mine" ? "border-chester-pink text-chester-pink bg-white" : "border-transparent text-gray-500 hover:text-gray-800"}`}
                >
                  <Ticket size={16} /> Voucher Saya
                  {myVouchers.length > 0 && (
                    <span className="bg-gray-900 text-white text-[10px] px-2 py-0.5 rounded-full">
                      {myVouchers.length}
                    </span>
                  )}
                </button>
              </div>

              {/* KONTEN TAB */}
              <div className="p-6 sm:p-8">
                {loading ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-chester-pink"></div>
                  </div>
                ) : activeTab === "available" ? (
                  /* --- TAB 1: PROMO TERSEDIA --- */
                  availablePromos.length === 0 ? (
                    <div className="text-center py-16">
                      <Ticket
                        size={48}
                        className="mx-auto text-gray-300 mb-4"
                      />
                      <h3 className="text-lg font-bold text-gray-800 mb-1">
                        Yah, Promo Sedang Kosong
                      </h3>
                      <p className="text-gray-500 text-sm">
                        Nantikan promo menarik selanjutnya dari Chester.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {availablePromos.map((voucher) => (
                        <div
                          key={voucher.id}
                          className="relative flex border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow bg-white"
                        >
                          <div className="w-8 bg-gradient-to-b from-rose-400 to-chester-pink flex items-center justify-center border-r border-dashed border-white">
                            <div className="rotate-[-90deg] whitespace-nowrap text-white text-xs font-bold uppercase tracking-widest">
                              Klaim
                            </div>
                          </div>
                          <div className="p-4 flex-1 flex flex-col justify-between">
                            <div>
                              <h4 className="font-bold text-gray-900 text-base leading-tight mb-1">
                                {voucher.name}
                              </h4>
                              <p className="text-xs font-semibold text-chester-pink mb-3">
                                Potongan:{" "}
                                {voucher.discount_type === "percent"
                                  ? `${voucher.discount_value}%`
                                  : formatRupiah(voucher.discount_value)}
                              </p>
                              <div className="text-[11px] text-gray-500 space-y-1 mb-4">
                                <p>
                                  Min. Belanja:{" "}
                                  <strong className="text-gray-700">
                                    {formatRupiah(voucher.min_purchase)}
                                  </strong>
                                </p>
                                <p className="flex items-center gap-1 text-orange-600 bg-orange-50 w-max px-2 py-0.5 rounded text-[10px] font-bold">
                                  <Zap size={10} /> Sisa Kuota:{" "}
                                  {voucher.sisa_kuota}
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => handleClaimVoucher(voucher.id)}
                              disabled={isClaiming === voucher.id}
                              className="w-full bg-chester-pink hover:bg-pink-600 text-white py-2 rounded-xl text-xs font-bold transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                              {isClaiming === voucher.id
                                ? "Mengklaim..."
                                : "Klaim Voucher"}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                ) : /* --- TAB 2: VOUCHER SAYA --- */
                myVouchers.length === 0 ? (
                  <div className="text-center py-16">
                    <ShoppingBag
                      size={48}
                      className="mx-auto text-gray-300 mb-4"
                    />
                    <h3 className="text-lg font-bold text-gray-800 mb-1">
                      Dompet Voucher Kosong
                    </h3>
                    <p className="text-gray-500 text-sm">
                      Cek tab Promo Tersedia untuk mengklaim voucher baru.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {myVouchers.map((voucher) => (
                      <div
                        key={voucher.id}
                        className="relative flex border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow bg-white"
                      >
                        <div className="w-8 bg-gray-900 flex items-center justify-center border-r border-dashed border-white">
                          <div className="rotate-[-90deg] whitespace-nowrap text-white text-xs font-bold uppercase tracking-widest">
                            Milikmu
                          </div>
                        </div>
                        <div className="p-4 flex-1">
                          <h4 className="font-bold text-gray-900 text-base leading-tight mb-1">
                            {voucher.name}
                          </h4>
                          <p className="text-xs font-semibold text-chester-pink mb-3">
                            Diskon:{" "}
                            {voucher.discount_type === "percent"
                              ? `${voucher.discount_value}%`
                              : formatRupiah(voucher.discount_value)}
                          </p>
                          <div className="text-[11px] text-gray-500 space-y-1 mb-4">
                            <p>
                              Min. Belanja:{" "}
                              <strong className="text-gray-700">
                                {formatRupiah(voucher.min_purchase)}
                              </strong>
                            </p>
                            <p className="flex items-center gap-1 text-gray-600">
                              <Clock size={10} /> Berlaku s/d:{" "}
                              <strong className="text-gray-800">
                                {new Date(voucher.end_date).toLocaleDateString(
                                  "id-ID",
                                )}
                              </strong>
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="bg-gray-50 border border-gray-200 px-3 py-2 rounded-xl text-sm font-mono font-bold text-gray-600 flex-1 text-center truncate">
                              {voucher.code}
                            </div>
                            <button
                              onClick={() => handleCopyCode(voucher.code)}
                              className="bg-gray-900 hover:bg-black text-white p-2.5 rounded-xl transition-colors flex-shrink-0 shadow-sm"
                              title="Salin Kode"
                            >
                              {copiedCode === voucher.code ? (
                                <CheckCircle
                                  size={18}
                                  className="text-emerald-400"
                                />
                              ) : (
                                <Copy size={18} />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
