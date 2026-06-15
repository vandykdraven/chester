import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Calendar,
  ShoppingBag,
  DollarSign,
  Package,
  CheckCircle,
  Clock,
  Truck,
  XCircle,
  MapPin,
} from "lucide-react";
import axios from "axios";

export default function CustomerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCustomerDetail();
  }, [id]);

  const fetchCustomerDetail = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/customers/${id}`,
      );
      if (response.data.success) {
        setCustomer(response.data.data);
      }
    } catch (error) {
      console.error("Gagal memuat detail pelanggan:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatRupiah = (number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(number || 0);
  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  const statusConfig = {
    pending: {
      label: "Belum Bayar",
      color: "bg-orange-50 text-orange-600 border-orange-200",
      icon: <Clock size={12} />,
    },
    paid: {
      label: "Perlu Dikirim",
      color: "bg-blue-50 text-blue-600 border-blue-200",
      icon: <DollarSign size={12} />,
    },
    shipping: {
      label: "Dikirim",
      color: "bg-purple-50 text-purple-600 border-purple-200",
      icon: <Truck size={12} />,
    },
    completed: {
      label: "Selesai",
      color: "bg-emerald-50 text-emerald-600 border-emerald-200",
      icon: <CheckCircle size={12} />,
    },
    cancelled: {
      label: "Batal",
      color: "bg-rose-50 text-rose-600 border-rose-200",
      icon: <XCircle size={12} />,
    },
  };

  if (isLoading)
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="h-8 w-8 border-4 border-chester-pink border-t-transparent rounded-full animate-spin"></div>
      </div>
    );

  if (!customer)
    return (
      <div className="text-center py-20 text-gray-500 flex flex-col items-center">
        <User size={48} className="text-gray-300 mb-4" />
        <h2 className="text-xl font-bold">Pelanggan tidak ditemukan.</h2>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 text-chester-pink hover:underline"
        >
          Kembali ke Daftar
        </button>
      </div>
    );

  return (
    <div className="max-w-6xl mx-auto pb-12 relative animate-fade-in">
      {/* HEADER KEMBALI */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate(-1)}
          className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:text-chester-pink transition shadow-sm"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-chester-text mb-1">
            Profil Pelanggan
          </h1>
          <p className="text-sm text-gray-500">
            Informasi identitas, alamat, dan riwayat transaksi.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
        {/* KOLOM KIRI: KARTU PROFIL PELANGGAN */}
        <div className="xl:col-span-1 flex flex-col gap-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm text-center">
            <div className="w-24 h-24 bg-gray-900 text-white rounded-full flex items-center justify-center font-bold text-4xl mx-auto mb-4 shadow-md uppercase">
              {customer?.fullname?.charAt(0) || "U"}
            </div>
            <h2 className="text-xl font-bold text-gray-800">
              {customer?.fullname}
            </h2>
            <span
              className={`inline-block mt-2 px-3 py-1 rounded-full text-[10px] uppercase tracking-wider font-bold border ${customer?.status === "active" ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-red-50 text-red-600 border-red-200"}`}
            >
              {customer?.status === "active" ? "Akun Aktif" : "Akun Diblokir"}
            </span>

            <div className="mt-6 pt-6 border-t border-gray-100 flex flex-col gap-4 text-left">
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <Mail size={16} className="text-gray-400" /> {customer?.email}
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <Phone size={16} className="text-gray-400" />{" "}
                {customer?.phone || "Belum ada no. HP"}
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <Calendar size={16} className="text-gray-400" /> Bergabung{" "}
                {formatDate(customer?.created_at)}
              </div>
            </div>
          </div>

          {/* STATISTIK BELANJA */}
          <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800 shadow-md text-white">
            <div className="flex items-center gap-3 mb-4 text-gray-300">
              <ShoppingBag size={20} className="text-chester-pink" />
              <h3 className="font-bold text-sm uppercase tracking-wider">
                Total Kontribusi
              </h3>
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-3xl font-black text-white">
                {formatRupiah(customer?.total_spent)}
              </p>
              <p className="text-sm text-gray-400">
                Dari {customer?.total_orders || 0} Pesanan Selesai
              </p>
            </div>
          </div>
        </div>

        {/* KOLOM KANAN: ALAMAT & RIWAYAT PESANAN */}
        <div className="xl:col-span-2 flex flex-col gap-6">
          {/* BAGIAN ALAMAT TERSIMPAN */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-4 pb-4 border-b">
              <MapPin size={20} className="text-gray-400" /> Buku Alamat
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {!customer?.addresses || customer.addresses.length === 0 ? (
                <div className="col-span-full py-6 text-center text-sm text-gray-500 border-2 border-dashed border-gray-100 rounded-xl">
                  Pelanggan belum menyimpan alamat pengiriman.
                </div>
              ) : (
                customer.addresses.map((addr) => (
                  <div
                    key={addr.id}
                    className="relative p-4 border border-gray-200 rounded-xl bg-gray-50/50 flex flex-col gap-1.5 text-sm"
                  >
                    {addr.is_primary === 1 && (
                      <span className="absolute top-4 right-4 bg-chester-pink text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest">
                        Utama
                      </span>
                    )}
                    <p className="font-bold text-gray-800">
                      {addr.recipient_name}
                    </p>
                    <p className="text-gray-600 font-medium">{addr.phone}</p>
                    <p className="text-gray-500 mt-1 leading-relaxed">
                      {addr.full_address}, {addr.subdistrict_name},{" "}
                      {addr.city_name}, {addr.province_name} {addr.postal_code}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* BAGIAN RIWAYAT PESANAN */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden h-full flex flex-col">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Package size={20} className="text-gray-400" /> Riwayat
                Transaksi
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50/70 border-b border-gray-100 text-xs text-gray-500 uppercase font-bold">
                  <tr>
                    <th className="p-4">No. Invoice</th>
                    <th className="p-4">Tanggal</th>
                    <th className="p-4 text-right">Total</th>
                    <th className="p-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-gray-50">
                  {!customer?.order_history ||
                  customer.order_history.length === 0 ? (
                    <tr>
                      <td
                        colSpan="4"
                        className="p-10 text-center text-gray-400"
                      >
                        Belum ada riwayat pesanan.
                      </td>
                    </tr>
                  ) : (
                    customer.order_history.map((order) => (
                      <tr
                        key={order.id}
                        className="hover:bg-gray-50 transition-colors group"
                      >
                        <td className="p-4 font-bold text-chester-pink">
                          <Link
                            to={`/admin/orders/${order.id}`}
                            className="hover:underline"
                          >
                            {order.invoice_number}
                          </Link>
                        </td>
                        <td className="p-4 text-gray-500">
                          {formatDate(order.created_at)}
                        </td>
                        <td className="p-4 text-right font-bold text-gray-800">
                          {formatRupiah(order.total_amount)}
                        </td>
                        <td className="p-4 text-center">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] uppercase font-bold border ${statusConfig[order.status]?.color || "bg-gray-50 text-gray-600 border-gray-200"}`}
                          >
                            {statusConfig[order.status]?.icon}{" "}
                            {statusConfig[order.status]?.label || order.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
