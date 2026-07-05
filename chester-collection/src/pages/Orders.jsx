import { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import {
  User,
  ShoppingBag,
  MapPin,
  Ticket,
  Heart,
  LogOut,
  ChevronRight,
  Package,
  Clock,
  CheckCircle,
  AlertCircle,
  X,
  Star,
  CreditCard,
} from "lucide-react";
import axios from "axios";

export default function Orders() {
  const navigate = useNavigate();
  const location = useLocation();

  const [userData, setUserData] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  // State untuk Modal Detail Pesanan
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // State untuk Modal Ulasan (Review)
  const [reviewModal, setReviewModal] = useState({
    show: false,
    order_id: null,
    product_id: null,
    product_name: "",
  });
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

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

    fetchOrderHistory(storedUser.id);
  }, [navigate, BASE_URL]);

  const showAlert = (message, type = "success") => {
    setCustomAlert({ show: true, message, type });
    setTimeout(
      () => setCustomAlert({ show: false, message: "", type: "success" }),
      4000,
    );
  };

  const fetchOrderHistory = async (userId) => {
    setLoading(true);
    try {
      // Menggunakan endpoint customer untuk mengambil riwayat ringkas
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/customers/${userId}`,
      );
      if (response.data.success && response.data.data.order_history) {
        setOrders(response.data.data.order_history);
      }
    } catch (error) {
      console.error("Gagal mengambil riwayat pesanan");
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderDetail = async (orderId) => {
    setLoadingDetail(true);
    setSelectedOrder(null); // Reset detail sebelumnya
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/orders/${orderId}`,
      );
      if (response.data.success) {
        setSelectedOrder(response.data.data);
      }
    } catch (error) {
      showAlert("Gagal memuat detail pesanan.", "error");
    } finally {
      setLoadingDetail(false);
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

  const translateStatus = (status) => {
    switch (status) {
      case "pending":
        return { text: "Belum Bayar", color: "bg-amber-100 text-amber-700" };
      case "paid":
        return { text: "Dikemas", color: "bg-blue-100 text-blue-700" };
      case "shipping":
        return { text: "Dikirim", color: "bg-indigo-100 text-indigo-700" };
      case "completed":
        return { text: "Selesai", color: "bg-emerald-100 text-emerald-700" };
      case "cancelled":
        return { text: "Dibatalkan", color: "bg-rose-100 text-rose-700" };
      default:
        return { text: status, color: "bg-gray-100 text-gray-700" };
    }
  };

  // Logika Filter Tab
  const filteredOrders =
    activeTab === "all" ? orders : orders.filter((o) => o.status === activeTab);

  // Fungsi Kirim Ulasan
  const submitReview = async (e) => {
    e.preventDefault();
    setIsSubmittingReview(true);
    try {
      const payload = {
        order_id: reviewModal.order_id,
        product_id: reviewModal.product_id,
        user_id: userData.id,
        rating: reviewForm.rating,
        comment: reviewForm.comment,
      };

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/reviews`,
        payload,
      );
      showAlert(response.data.message, "success");

      // Tutup modal review dan reset form
      setReviewModal({
        show: false,
        order_id: null,
        product_id: null,
        product_name: "",
      });
      setReviewForm({ rating: 5, comment: "" });
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Gagal menyimpan ulasan.";
      showAlert(errorMessage, "error");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (!userData) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-10 font-lora relative">
      {/* CUSTOM ALERTS */}
      {customAlert.show && (
        <div className="fixed top-6 right-6 z-[100] animate-bounce">
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

      {/* MODAL REVIEW (ULASAN) */}
      {reviewModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="flex justify-between items-center p-5 border-b">
              <h3 className="font-bold text-lg text-gray-900">
                Beri Ulasan Produk
              </h3>
              <button
                onClick={() =>
                  setReviewModal({
                    show: false,
                    order_id: null,
                    product_id: null,
                    product_name: "",
                  })
                }
                className="text-gray-400 hover:text-gray-800 transition"
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={submitReview} className="p-5">
              <p className="text-sm text-gray-500 mb-4">
                Bagaimana kepuasan Anda terhadap produk{" "}
                <strong className="text-gray-900">
                  {reviewModal.product_name}
                </strong>
                ?
              </p>

              {/* Star Rating Interactive */}
              <div className="flex justify-center gap-2 mb-6">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    onClick={() =>
                      setReviewForm({ ...reviewForm, rating: star })
                    }
                    className={`transition-colors ${reviewForm.rating >= star ? "text-amber-400" : "text-gray-200 hover:text-amber-200"}`}
                  >
                    <Star
                      size={40}
                      fill={reviewForm.rating >= star ? "currentColor" : "none"}
                    />
                  </button>
                ))}
              </div>

              <div className="mb-6">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                  Komentar / Masukan Anda
                </label>
                <textarea
                  required
                  rows="4"
                  value={reviewForm.comment}
                  onChange={(e) =>
                    setReviewForm({ ...reviewForm, comment: e.target.value })
                  }
                  placeholder="Ceritakan pengalaman Anda menggunakan produk ini..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm outline-none focus:border-chester-pink"
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={isSubmittingReview}
                className="w-full bg-gray-950 text-white font-bold py-3 rounded-xl hover:bg-black transition-colors disabled:opacity-70"
              >
                {isSubmittingReview ? "Mengirim..." : "Kirim Ulasan"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DETAIL PESANAN */}
      {selectedOrder && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 py-10 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-full flex flex-col shadow-2xl">
            <div className="flex justify-between items-center p-5 border-b">
              <div>
                <h3 className="font-bold text-lg text-gray-900">
                  Detail Pesanan
                </h3>
                <p className="text-xs text-gray-500">
                  {selectedOrder.invoice_number}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-gray-400 hover:text-gray-800 transition bg-gray-100 p-2 rounded-full"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1 bg-gray-50/50">
              {/* TOMBOL PANDUAN PEMBAYARAN JIKA PENDING */}
              {selectedOrder.status === "pending" && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4 flex justify-between items-center">
                  <div>
                    <h4 className="text-sm font-bold text-amber-800">
                      Menunggu Pembayaran
                    </h4>
                    <p className="text-xs text-amber-700 mt-1">
                      Silakan selesaikan pembayaran agar pesanan dapat diproses.
                    </p>
                  </div>
                  <Link
                    to={`/payment-confirmation/${selectedOrder.id}`}
                    className="bg-amber-600 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-amber-700 transition shadow-sm"
                  >
                    <CreditCard size={14} /> Cara Bayar
                  </Link>
                </div>
              )}

              <div className="bg-white border rounded-xl p-4 mb-4">
                <h4 className="text-xs font-bold uppercase text-gray-400 mb-3 border-b pb-2">
                  Status Logistik
                </h4>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-semibold text-gray-700">
                    Kurir:
                  </span>
                  <span className="text-sm font-bold uppercase">
                    {selectedOrder.courier_name || "Belum ditentukan"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-gray-700">
                    No. Resi:
                  </span>
                  <span className="text-sm font-bold text-chester-pink">
                    {selectedOrder.airway_bill || "Menunggu pengiriman"}
                  </span>
                </div>
              </div>

              <h4 className="text-xs font-bold uppercase text-gray-400 mb-3 mt-6">
                Daftar Produk Dibeli
              </h4>
              <div className="space-y-3">
                {selectedOrder.items?.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white border rounded-xl p-4 flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center"
                  >
                    <div>
                      <h5 className="font-bold text-sm text-gray-900">
                        {item.product_name}
                      </h5>
                      <p className="text-xs text-gray-500 mt-1">
                        Variasi: {item.variant_key || "Standard"} | Qty:{" "}
                        {item.quantity}
                      </p>
                      <p className="text-sm font-bold text-chester-pink mt-1">
                        {formatRupiah(item.price)}
                      </p>
                    </div>

                    {/* TOMBOL REVIEW MUNCUL JIKA STATUS SELESAI */}
                    {selectedOrder.status === "completed" && (
                      <button
                        onClick={() =>
                          setReviewModal({
                            show: true,
                            order_id: selectedOrder.id,
                            product_id: item.product_id,
                            product_name: item.product_name,
                          })
                        }
                        className="bg-amber-100 text-amber-700 hover:bg-amber-200 border border-amber-200 px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1 transition"
                      >
                        <Star size={14} fill="currentColor" /> Beri Ulasan
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="p-5 border-t bg-white flex justify-between items-center rounded-b-2xl">
              <span className="font-semibold text-gray-500">
                Total Pembayaran:
              </span>
              <span className="text-xl font-black text-gray-900">
                {formatRupiah(selectedOrder.total_amount)}
              </span>
            </div>
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
                <h2 className="text-xl font-bold text-gray-900">
                  Riwayat Pesanan Saya
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Pantau status pesanan dan berikan ulasan untuk produk yang
                  telah Anda terima.
                </p>
              </div>

              {/* TABS FILTER */}
              <div className="flex overflow-x-auto border-b border-gray-100 hide-scrollbar bg-gray-50/50">
                {[
                  { id: "all", label: "Semua" },
                  { id: "pending", label: "Belum Bayar" },
                  { id: "paid", label: "Dikemas" },
                  { id: "shipping", label: "Dikirim" },
                  { id: "completed", label: "Selesai" },
                  { id: "cancelled", label: "Dibatalkan" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-6 py-4 text-sm font-bold whitespace-nowrap transition-colors border-b-2 ${activeTab === tab.id ? "border-chester-pink text-chester-pink bg-white" : "border-transparent text-gray-500 hover:text-gray-800"}`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="p-6 sm:p-8">
                {loading ? (
                  <div className="flex justify-center py-10">
                    <div className="animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-chester-pink"></div>
                  </div>
                ) : filteredOrders.length === 0 ? (
                  <div className="text-center py-16">
                    <Package size={48} className="mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-bold text-gray-800 mb-1">
                      Belum Ada Pesanan
                    </h3>
                    <p className="text-gray-500 text-sm">
                      Anda belum memiliki pesanan dengan status ini.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredOrders.map((order) => {
                      const statusInfo = translateStatus(order.status);
                      const orderDate = new Date(
                        order.created_at,
                      ).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      });

                      return (
                        <div
                          key={order.id}
                          className="border border-gray-100 rounded-2xl p-5 hover:border-gray-200 hover:shadow-sm transition-all bg-white"
                        >
                          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4 pb-4 border-b border-gray-50">
                            <div className="flex items-center gap-3">
                              <div className="bg-gray-100 p-2.5 rounded-xl">
                                <ShoppingBag
                                  size={20}
                                  className="text-gray-600"
                                />
                              </div>
                              <div>
                                <h4 className="font-bold text-gray-900 text-sm">
                                  {order.invoice_number}
                                </h4>
                                <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                                  <Clock size={12} /> {orderDate}
                                </div>
                              </div>
                            </div>
                            <span
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold w-max ${statusInfo.color}`}
                            >
                              {statusInfo.text}
                            </span>
                          </div>

                          <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4">
                            <div>
                              <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">
                                Total Belanja
                              </p>
                              <p className="text-lg font-black text-gray-900">
                                {formatRupiah(order.total_amount)}
                              </p>
                            </div>

                            <div className="flex gap-2">
                              {/* TAUTAN LANGSUNG KE PEMBAYARAN JIKA PENDING */}
                              {order.status === "pending" && (
                                <Link
                                  to={`/payment-confirmation/${order.id}`}
                                  className="text-sm font-bold text-white bg-amber-500 hover:bg-amber-600 px-5 py-2.5 rounded-xl flex items-center justify-center gap-1 transition shadow-sm"
                                >
                                  <CreditCard size={16} /> Cara Bayar
                                </Link>
                              )}

                              <button
                                onClick={() => fetchOrderDetail(order.id)}
                                disabled={loadingDetail}
                                className="text-sm font-bold text-chester-pink bg-pink-50 hover:bg-pink-100 px-5 py-2.5 rounded-xl flex items-center justify-center gap-1 transition"
                              >
                                Lihat Detail <ChevronRight size={16} />
                              </button>
                            </div>
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
    </div>
  );
}
