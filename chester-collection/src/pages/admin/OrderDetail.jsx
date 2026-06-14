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
} from "lucide-react";
import axios from "axios";

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  // State untuk form update status manual
  const [newStatus, setNewStatus] = useState("");
  const [newResi, setNewResi] = useState("");

  const [customAlert, setCustomAlert] = useState({
    show: false,
    message: "",
    type: "success",
  });

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
                  className="flex items-center gap-4 py-4 border-b border-gray-50 last:border-0 last:pb-0"
                >
                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center border">
                    <Package size={24} className="text-gray-300" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-800">
                      {item.product_name}
                    </h3>
                    <div className="flex gap-3 text-xs text-gray-500 mt-1">
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
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-800">
                      {formatRupiah(item.price)}
                    </p>
                    <p className="text-sm text-gray-500">x {item.quantity}</p>
                  </div>
                  <div className="w-28 text-right font-bold text-chester-pink">
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

          {/* Panel Kontrol Status (Persiapan KiriminAja) */}
          <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-sm text-white">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Truck size={20} className="text-chester-pink" /> Proses
              Pengiriman
            </h2>

            <form onSubmit={handleUpdateStatus} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">
                  Status Pesanan
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

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">
                  Nomor Resi (AWB)
                </label>
                <input
                  type="text"
                  value={newResi}
                  onChange={(e) => setNewResi(e.target.value)}
                  placeholder="Input resi jika ada..."
                  className="w-full border border-gray-600 bg-gray-700 text-white px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:border-chester-pink placeholder-gray-500"
                />
                <p className="text-[10px] text-gray-400 mt-1.5">
                  Nantinya, resi akan terisi otomatis oleh KiriminAja saat
                  Request Pickup dilakukan.
                </p>
              </div>

              <button
                type="submit"
                disabled={isUpdating}
                className="mt-2 bg-chester-pink hover:bg-pink-600 text-white px-4 py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition disabled:opacity-70"
              >
                <Save size={16} />{" "}
                {isUpdating ? "Menyimpan..." : "Simpan Perubahan"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
