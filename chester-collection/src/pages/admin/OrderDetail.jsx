import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  MapPin,
  User,
  Package,
  Truck,
  CreditCard,
  CheckCircle,
  AlertCircle,
  Clock,
  XCircle,
  Save,
  Star,
} from "lucide-react";
import axios from "axios";

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [showConfirmPickup, setShowConfirmPickup] = useState(false);

  // --- State Baru untuk Tanggal & Jam Pickup ---
  const [pickupDate, setPickupDate] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [newResi, setNewResi] = useState("");

  const [customAlert, setCustomAlert] = useState({
    show: false,
    message: "",
    type: "success",
  });

  // --- State Khusus untuk Ulasan (Review) ---
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });

  // --- Kalkulasi Hari Ini dan Besok untuk Dropdown ---
  const todayObj = new Date();
  const tomorrowObj = new Date(todayObj);
  tomorrowObj.setDate(tomorrowObj.getDate() + 1);
  const formatDateForInput = (date) => date.toISOString().split("T")[0]; // YYYY-MM-DD

  useEffect(() => {
    fetchOrderDetail();
  }, [id]);

  const fetchOrderDetail = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/orders/${id}`,
      );
      if (response.data.success) {
        setOrder(response.data.data);
        setNewStatus(response.data.data.status);
        setNewResi(response.data.data.airway_bill || "");
      }
    } catch (error) {
      console.error("Gagal memuat detail pesanan:", error);
      showAlert("Gagal memuat data pesanan.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const showAlert = (message, type = "success") => {
    setCustomAlert({ show: true, message, type });
    setTimeout(
      () => setCustomAlert({ show: false, message: "", type: "success" }),
      3000,
    );
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/orders/${id}/status`,
        {
          status: newStatus,
          airway_bill: newResi,
        },
      );
      if (response.data.success) {
        showAlert("Status pesanan berhasil diperbarui!", "success");
        fetchOrderDetail(); // Refresh data
      }
    } catch (error) {
      showAlert("Gagal memperbarui status.", "error");
    } finally {
      setIsLoading(false);
      setIsUpdating(false);
    }
  };

  const handleBookShipping = async () => {
    if (!pickupDate || !pickupTime) {
      showAlert("Pilih tanggal dan jam pickup terlebih dahulu!", "error");
      return;
    }

    setShowConfirmPickup(false);
    setIsBooking(true);
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/orders/${id}/book-shipping`,
        {
          delivery_date: pickupDate,
          delivery_time: pickupTime,
        },
      );
      if (response.data.success) {
        showAlert(
          "Berhasil request pickup! Resi otomatis diterbitkan.",
          "success",
        );
        fetchOrderDetail();
      }
    } catch (error) {
      showAlert(
        error.response?.data?.message || "Gagal melakukan booking logistik.",
        "error",
      );
    } finally {
      setIsBooking(false);
    }
  };

  // --- FUNGSI UNTUK ULASAN PRODUK ---
  const openReviewModal = (item) => {
    setSelectedItem(item);
    setReviewForm({ rating: 5, comment: "" });
    setShowReviewModal(true);
  };

  const submitReview = async (e) => {
    e.preventDefault();

    const customerUser = JSON.parse(
      localStorage.getItem("customerUser") ||
        sessionStorage.getItem("customerUser"),
    );

    if (!customerUser) {
      showAlert("Anda harus login untuk memberikan ulasan.", "error");
      return;
    }

    try {
      const namaVariasi =
        selectedItem.variant_key || selectedItem.variant_name || null;
      const payload = {
        order_id: order.id,
        product_id: selectedItem.product_id,
        user_id: customerUser.id,
        rating: reviewForm.rating,
        comment: reviewForm.comment,
        // Ini kunci utamanya: mengirim variasi ke database
        variant_name: namaVariasi,
      };

      console.log("Data Ulasan yang akan dikirim:", payload);

      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/reviews`,
        payload,
      );

      if (res.data.success) {
        showAlert("Ulasan berhasil dikirim!", "success");
        setShowReviewModal(false);
      }
    } catch (error) {
      showAlert(
        error.response?.data?.message || "Gagal mengirim ulasan.",
        "error",
      );
    }
  };
  // ----------------------------------

  const formatRupiah = (number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(number);
  };

  const formatDate = (dateString) => {
    const options = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };
    return new Date(dateString).toLocaleDateString("id-ID", options);
  };

  const statusConfig = {
    pending: {
      label: "Belum Bayar",
      color: "bg-orange-50 text-orange-600 border-orange-200",
      icon: <Clock size={16} />,
    },
    paid: {
      label: "Perlu Dikirim",
      color: "bg-blue-50 text-blue-600 border-blue-200",
      icon: <CreditCard size={16} />,
    },
    shipping: {
      label: "Sedang Dikirim",
      color: "bg-purple-50 text-purple-600 border-purple-200",
      icon: <Truck size={16} />,
    },
    completed: {
      label: "Selesai",
      color: "bg-emerald-50 text-emerald-600 border-emerald-200",
      icon: <CheckCircle size={16} />,
    },
    cancelled: {
      label: "Dibatalkan",
      color: "bg-rose-50 text-rose-600 border-rose-200",
      icon: <XCircle size={16} />,
    },
  };

  if (isLoading)
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3 text-gray-500">
        <div className="h-8 w-8 border-4 border-chester-pink border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-semibold">Memuat rincian pesanan...</p>
      </div>
    );

  if (!order)
    return (
      <div className="text-center py-20 text-gray-500 font-bold">
        Pesanan tidak ditemukan.
      </div>
    );

  return (
    <div className="max-w-6xl mx-auto pb-12 relative">
      {/* TOAST ALERT */}
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

      {/* HEADER */}
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 bg-white border rounded-lg hover:bg-gray-50"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-chester-text flex items-center gap-3">
              {order.invoice_number}
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${statusConfig[order.status].color}`}
              >
                {statusConfig[order.status].icon}{" "}
                {statusConfig[order.status].label}
              </span>
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {formatDate(order.created_at)}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* KOLOM KIRI: Daftar Produk & Rincian Harga */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h2 className="text-lg font-bold text-chester-text mb-4 flex items-center gap-2">
              <Package size={20} className="text-gray-400" /> Rincian Produk
            </h2>
            <div className="flex flex-col gap-4">
              {order.items?.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col sm:flex-row sm:items-center gap-4 py-4 border-b border-gray-50 last:border-0 last:pb-0"
                >
                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center border shrink-0">
                    <Package size={24} className="text-gray-300" />
                  </div>

                  <div className="flex-1">
                    <h3 className="font-bold text-gray-800">
                      {item.product_name}
                    </h3>
                    <div className="flex gap-3 text-xs text-gray-500 mt-1 mb-2">
                      {item.variant_key && (
                        <span>
                          Variasi:{" "}
                          <span className="font-semibold text-gray-700">
                            {item.variant_key}
                          </span>
                        </span>
                      )}
                      <span>
                        SKU:{" "}
                        <span className="font-semibold text-gray-700">
                          {item.product_sku || "-"}
                        </span>
                      </span>
                      <span>
                        Berat:{" "}
                        <span className="font-semibold text-gray-700">
                          {item.weight} gr
                        </span>
                      </span>
                    </div>

                    {/* TOMBOL BERI ULASAN DISISIPKAN DI SINI */}
                    {order.status === "completed" && (
                      <button
                        onClick={() => openReviewModal(item)}
                        className="text-xs font-bold bg-white text-chester-pink border border-chester-pink px-3 py-1.5 rounded-lg hover:bg-pink-50 transition w-max flex items-center"
                      >
                        <Star size={12} className="inline mr-1" /> Beri Ulasan
                      </button>
                    )}
                  </div>

                  <div className="sm:text-right mt-2 sm:mt-0">
                    <p className="font-bold text-gray-800">
                      {formatRupiah(item.price)}
                    </p>
                    <p className="text-sm text-gray-500">x {item.quantity}</p>
                  </div>
                  <div className="sm:w-28 sm:text-right font-bold text-chester-pink mt-1 sm:mt-0">
                    {formatRupiah(item.price * item.quantity)}
                  </div>
                </div>
              ))}
            </div>

            {/* Rincian Biaya */}
            <div className="mt-6 pt-6 border-t border-gray-100 flex flex-col gap-3">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal Produk</span>
                <span className="font-semibold">
                  {formatRupiah(order.subtotal_products)}
                </span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>
                  Ongkos Kirim ({order.courier_name.toUpperCase()} -{" "}
                  {order.courier_service})
                </span>
                <span className="font-semibold">
                  {formatRupiah(order.shipping_cost)}
                </span>
              </div>
              <div className="flex justify-between text-lg font-bold text-gray-800 mt-2 pt-4 border-t border-dashed">
                <span>Total Belanja</span>
                <span className="text-chester-pink">
                  {formatRupiah(order.total_amount)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* KOLOM KANAN: Pelanggan, Alamat, & Aksi Admin */}
        <div className="flex flex-col gap-6">
          {/* Info Pelanggan */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h2 className="text-lg font-bold text-chester-text mb-4 flex items-center gap-2">
              <User size={20} className="text-gray-400" /> Info Pelanggan
            </h2>
            <div className="flex flex-col gap-3 text-sm">
              <div>
                <p className="text-gray-500 text-xs">Nama Akun</p>
                <p className="font-semibold text-gray-800">
                  {order.customer_name}
                </p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Email</p>
                <p className="font-semibold text-gray-800">
                  {order.customer_email}
                </p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">No. Telepon / WA</p>
                <p className="font-semibold text-gray-800">{order.phone}</p>
              </div>
            </div>
          </div>

          {/* Info Pengiriman */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h2 className="text-lg font-bold text-chester-text mb-4 flex items-center gap-2">
              <MapPin size={20} className="text-gray-400" /> Alamat Tujuan
            </h2>
            <div className="flex flex-col gap-3 text-sm">
              <div>
                <p className="text-gray-500 text-xs">Nama Penerima</p>
                <p className="font-semibold text-gray-800">
                  {order.recipient_name}
                </p>
              </div>
              <div>
                <p className="text-gray-500 text-xs mb-1">Alamat Lengkap</p>
                <p className="text-gray-800 leading-relaxed bg-gray-50 p-3 rounded-lg border">
                  {order.full_address}, {order.subdistrict_name},{" "}
                  {order.city_name}, {order.province_name} {order.postal_code}
                </p>
              </div>
            </div>
          </div>

          {/* Panel Kontrol Status (Biteship Terintegrasi) */}
          <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-sm text-white">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Truck size={20} className="text-chester-pink" /> Proses
              Pengiriman
            </h2>

            {/* AREA TOMBOL BITESHIP */}
            <div className="mb-6 p-4 bg-gray-900 rounded-xl border border-gray-700">
              <h3 className="text-sm font-bold mb-2">
                Automasi Logistik Biteship
              </h3>

              {!order.biteship_order_id ? (
                <div>
                  <p className="text-xs text-gray-400 mb-3">
                    Klik tombol di bawah untuk otomatis mendapatkan nomor resi
                    dan memanggil kurir penjemput.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowConfirmPickup(true)}
                    disabled={isBooking || order.status === "cancelled"}
                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2.5 rounded-lg text-sm font-bold transition disabled:opacity-50"
                  >
                    {isBooking
                      ? "Memproses Booking..."
                      : "Request Pickup Kurir"}
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <div className="bg-gray-800 p-3 rounded-lg border border-gray-700 flex justify-between items-center">
                    <span className="text-xs text-gray-400">
                      Nomor Resi (AWB)
                    </span>
                    <span className="font-bold text-chester-pink">
                      {order.airway_bill}
                    </span>
                  </div>
                  {order.waybill_url && (
                    <a
                      href={order.waybill_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-bold transition text-center flex items-center justify-center gap-2"
                    >
                      🖨️ Cetak Label Pengiriman
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* UPDATE STATUS MANUAL */}
            <form
              onSubmit={handleUpdateStatus}
              className="flex flex-col gap-4 border-t border-gray-700 pt-4"
            >
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">
                  Update Status Manual
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full border border-gray-600 bg-gray-700 text-white px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:border-chester-pink"
                >
                  <option value="pending">Belum Bayar</option>
                  <option value="paid">Sudah Bayar (Perlu Dikirim)</option>
                  <option value="shipping">Sedang Dikirim</option>
                  <option value="completed">Selesai</option>
                  <option value="cancelled">Dibatalkan</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isUpdating}
                className="bg-gray-700 hover:bg-gray-600 border border-gray-600 text-white px-4 py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition disabled:opacity-70"
              >
                <Save size={16} />{" "}
                {isUpdating ? "Menyimpan..." : "Simpan Status Manual"}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* MODAL KONFIRMASI PICKUP DENGAN DROPDOWN */}
      {showConfirmPickup && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in backdrop-blur-sm">
          <div className="bg-white p-6 rounded-2xl w-full max-w-sm shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center">
                <Truck size={20} />
              </div>
              <h3 className="font-bold text-lg text-gray-900">
                Jadwal Pickup Kurir
              </h3>
            </div>

            <p className="text-sm text-gray-500 mb-5 leading-relaxed">
              Tentukan hari dan jam agar kurir mengetahui kapan paket Anda siap
              untuk dijemput.
            </p>

            <div className="flex flex-col gap-4 mb-6">
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-2">
                  Hari Penjemputan
                </label>
                <select
                  value={pickupDate}
                  onChange={(e) => setPickupDate(e.target.value)}
                  className="w-full border border-gray-200 text-gray-700 px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="" disabled>
                    -- Pilih Hari --
                  </option>
                  <option value={formatDateForInput(todayObj)}>
                    Hari Ini ({formatDateForInput(todayObj)})
                  </option>
                  <option value={formatDateForInput(tomorrowObj)}>
                    Besok ({formatDateForInput(tomorrowObj)})
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-2">
                  Jam Penjemputan
                </label>
                <select
                  value={pickupTime}
                  onChange={(e) => setPickupTime(e.target.value)}
                  className="w-full border border-gray-200 text-gray-700 px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="" disabled>
                    -- Pilih Jam --
                  </option>
                  <option value="09:00">09:00 Pagi</option>
                  <option value="12:00">12:00 Siang</option>
                  <option value="15:00">15:00 Sore</option>
                  <option value="18:00">18:00 Petang</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 pt-2 border-t border-gray-100">
              <button
                onClick={() => setShowConfirmPickup(false)}
                className="flex-1 py-2.5 bg-gray-50 text-gray-600 border border-gray-200 rounded-xl text-sm font-bold hover:bg-gray-100 transition"
              >
                Batal
              </button>
              <button
                onClick={handleBookShipping}
                className="flex-1 py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-bold hover:bg-emerald-600 transition"
              >
                Booking Kurir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL / POP-UP FORMULIR ULASAN */}
      {showReviewModal && selectedItem && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in backdrop-blur-sm">
          <div className="bg-white p-6 rounded-2xl w-full max-w-md shadow-2xl">
            <h3 className="font-bold text-lg text-gray-900 mb-1">
              Nilai Produk Ini
            </h3>
            <p className="text-sm text-gray-500 mb-4 line-clamp-1">
              {selectedItem.product_name}{" "}
              {selectedItem.variant_key ? `(${selectedItem.variant_key})` : ""}
            </p>

            <form onSubmit={submitReview} className="flex flex-col gap-4">
              {/* Pilihan Bintang */}
              <div className="flex flex-col items-center gap-2 mb-2">
                <span className="text-xs font-bold text-gray-400 uppercase">
                  Kualitas Produk
                </span>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() =>
                        setReviewForm({ ...reviewForm, rating: star })
                      }
                      className="focus:outline-none transition-transform hover:scale-110"
                    >
                      <Star
                        size={32}
                        fill={
                          star <= reviewForm.rating ? "#FBBF24" : "transparent"
                        }
                        className={
                          star <= reviewForm.rating
                            ? "text-yellow-400"
                            : "text-gray-300"
                        }
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Input Komentar */}
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-2">
                  Ceritakan Pengalaman Anda
                </label>
                <textarea
                  rows="4"
                  placeholder="Bagaimana kualitas bahan dan jahitannya? Beritahu pembeli lain!"
                  value={reviewForm.comment}
                  onChange={(e) =>
                    setReviewForm({ ...reviewForm, comment: e.target.value })
                  }
                  className="w-full border border-gray-200 text-gray-700 px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:border-chester-pink resize-none"
                ></textarea>
              </div>

              {/* Tombol Aksi */}
              <div className="flex gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="flex-1 py-2.5 bg-gray-50 text-gray-600 border border-gray-200 rounded-xl text-sm font-bold hover:bg-gray-100 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-chester-pink text-white rounded-xl text-sm font-bold hover:bg-pink-600 transition"
                >
                  Kirim Ulasan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
