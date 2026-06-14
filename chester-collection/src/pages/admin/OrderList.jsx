import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  Package,
  Clock,
  CreditCard,
  Truck,
  CheckCircle,
  XCircle,
} from "lucide-react";
import axios from "axios";

export default function OrderList() {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter & Pagination States
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState(""); // "" = Semua
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  useEffect(() => {
    fetchOrders();
  }, [currentPage, searchTerm, statusFilter]);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/orders`,
        {
          params: {
            page: currentPage,
            limit: limit,
            search: searchTerm,
            status: statusFilter,
          },
        },
      );
      if (response.data.success) {
        setOrders(response.data.data);
        setTotalPages(response.data.pagination.totalPages);
      }
    } catch (error) {
      console.error("Gagal memuat pesanan:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleFilterChange = (newStatus) => {
    setStatusFilter(newStatus);
    setCurrentPage(1);
  };

  // Helper Formatter
  const formatRupiah = (number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(number);
  };

  const formatDate = (dateString) => {
    const options = {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };
    return new Date(dateString).toLocaleDateString("id-ID", options);
  };

  // Konfigurasi Tampilan Status (Warna & Ikon)
  const statusConfig = {
    pending: {
      label: "Belum Bayar",
      color: "bg-orange-50 text-orange-600 border-orange-200",
      icon: <Clock size={12} />,
    },
    paid: {
      label: "Perlu Dikirim",
      color: "bg-blue-50 text-blue-600 border-blue-200",
      icon: <CreditCard size={12} />,
    },
    shipping: {
      label: "Sedang Dikirim",
      color: "bg-purple-50 text-purple-600 border-purple-200",
      icon: <Truck size={12} />,
    },
    completed: {
      label: "Selesai",
      color: "bg-emerald-50 text-emerald-600 border-emerald-200",
      icon: <CheckCircle size={12} />,
    },
    cancelled: {
      label: "Dibatalkan",
      color: "bg-rose-50 text-rose-600 border-rose-200",
      icon: <XCircle size={12} />,
    },
  };

  // Daftar Tab Status
  const tabs = [
    { value: "", label: "Semua Pesanan" },
    { value: "pending", label: "Belum Bayar" },
    { value: "paid", label: "Perlu Dikirim" },
    { value: "shipping", label: "Dikirim" },
    { value: "completed", label: "Selesai" },
    { value: "cancelled", label: "Dibatalkan" },
  ];

  return (
    <div className="max-w-6xl mx-auto pb-12 relative">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-chester-text mb-1 flex items-center gap-2">
            <Package size={24} className="text-chester-pink" /> Kelola Pesanan
          </h1>
          <p className="text-sm text-gray-500">
            Pantau dan kelola antrean pesanan masuk dari pelanggan.
          </p>
        </div>

        {/* KOTAK PENCARIAN */}
        <div className="relative w-full sm:max-w-xs">
          <Search
            className="absolute left-3.5 top-2.5 text-gray-400"
            size={18}
          />
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Cari No. Invoice atau Nama..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-chester-pink text-sm transition shadow-sm"
          />
        </div>
      </div>

      {/* FILTER TABS (Shopee/Tokopedia Style) */}
      <div className="flex overflow-x-auto hide-scrollbar gap-2 mb-6 pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => handleFilterChange(tab.value)}
            className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm font-semibold transition-all border ${
              statusFilter === tab.value
                ? "bg-chester-pink text-white border-chester-pink shadow-md"
                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TABEL PESANAN */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[850px]">
            <thead>
              <tr className="bg-gray-50/70 border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wider font-bold">
                <th className="p-4 w-40">No. Invoice</th>
                <th className="p-4">Tanggal</th>
                <th className="p-4">Pelanggan</th>
                <th className="p-4 text-right">Total Belanja</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-center w-24">Aksi</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-gray-50">
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="p-16 text-center text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <div className="h-6 w-6 border-2 border-chester-pink border-t-transparent rounded-full animate-spin"></div>
                      Memuat data pesanan...
                    </div>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-16 text-center text-gray-400">
                    <Package size={44} className="mx-auto mb-3 text-gray-300" />
                    <p className="font-medium">
                      Tidak ada pesanan yang ditemukan.
                    </p>
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-pink-50/10 transition-colors group"
                  >
                    <td className="p-4 align-middle">
                      <Link
                        to={`/admin/orders/${order.id}`}
                        className="font-bold text-chester-pink hover:underline"
                      >
                        {order.invoice_number}
                      </Link>
                    </td>
                    <td className="p-4 align-middle text-gray-500">
                      {formatDate(order.created_at)}
                    </td>
                    <td className="p-4 align-middle font-medium text-gray-700">
                      {order.fullname}
                    </td>
                    <td className="p-4 align-middle text-right font-bold text-chester-text">
                      {formatRupiah(order.total_amount)}
                    </td>
                    <td className="p-4 align-middle text-center">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${statusConfig[order.status].color}`}
                      >
                        {statusConfig[order.status].icon}
                        {statusConfig[order.status].label}
                      </span>
                    </td>
                    <td className="p-4 align-middle text-center">
                      <Link
                        to={`/admin/orders/${order.id}`}
                        title="Lihat Detail Pesanan"
                        className="w-8 h-8 mx-auto rounded bg-white text-gray-600 hover:text-chester-pink hover:bg-pink-50 flex items-center justify-center transition border border-gray-200 shadow-sm"
                      >
                        <Eye size={14} />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINASI */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">
              Halaman {currentPage} dari {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
