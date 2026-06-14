import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  UserX,
  UserCheck,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import axios from "axios";

export default function CustomerList() {
  const [customers, setCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // State Paginasi
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10; // Menampilkan 10 pelanggan per halaman

  const [customAlert, setCustomAlert] = useState({
    show: false,
    message: "",
    type: "success",
  });

  useEffect(() => {
    fetchCustomers();
  }, [currentPage, searchTerm]);

  const fetchCustomers = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/customers`,
        {
          params: {
            page: currentPage,
            limit: limit,
            search: searchTerm,
          },
        },
      );
      if (response.data.success) {
        setCustomers(response.data.data);
        setTotalPages(response.data.pagination.totalPages);
      }
    } catch (error) {
      showAlert("Gagal memuat data pelanggan.", "error");
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

  // LOGIKA SAKELAR BLOKIR / AKTIFKAN AKUN
  const toggleStatus = async (id, currentStatus) => {
    const nextStatus = currentStatus === "active" ? "suspended" : "active";
    try {
      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/customers/${id}/status`,
        {
          status: nextStatus,
        },
      );
      if (response.data.success) {
        showAlert(response.data.message, "success");
        // Update status di state lokal secara instan tanpa reload halaman
        setCustomers(
          customers.map((c) =>
            c.id === id ? { ...c, status: nextStatus } : c,
          ),
        );
      }
    } catch (error) {
      showAlert("Gagal mengubah status akun pelanggan.", "error");
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Kembalikan ke halaman 1 saat mengetik pencarian baru
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="max-w-6xl mx-auto pb-12 relative">
      {/* TOAST ALERT */}
      {customAlert.show && (
        <div className="fixed top-6 right-6 z-50 animate-bounce">
          <div
            className={`flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-xl border text-sm font-semibold text-white ${
              customAlert.type === "success"
                ? "bg-emerald-500 border-emerald-400"
                : "bg-rose-500 border-rose-400"
            }`}
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

      {/* HEADER UTAMA */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-chester-text mb-1 flex items-center gap-2">
            <Users size={24} className="text-chester-pink" /> Daftar Pelanggan
          </h1>
          <p className="text-sm text-gray-500">
            Kelola dan lihat informasi profil pembeli di toko Anda.
          </p>
        </div>

        {/* KOTAK PENCARIAN PINTAR */}
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3.5 top-3 text-gray-400" size={18} />
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Cari nama atau email..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-chester-pink text-sm transition shadow-sm"
          />
        </div>
      </div>

      {/* AREA TABEL UTAMA */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-gray-50/70 border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wider font-bold">
                <th className="p-4">Nama Lengkap</th>
                <th className="p-4">Kontak Email / HP</th>
                <th className="p-4">Tanggal Gabung</th>
                <th className="p-4 text-center w-32">Status Akun</th>
                <th className="p-4 text-center w-28">Aksi</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-gray-50">
              {isLoading ? (
                <tr>
                  <td colSpan="5" className="p-16 text-center text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <div className="h-6 w-6 border-2 border-chester-pink border-t-transparent rounded-full animate-spin"></div>
                      Memuat data pelanggan...
                    </div>
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-16 text-center text-gray-400">
                    <Users size={44} className="mx-auto mb-3 text-gray-300" />
                    <p className="font-medium">
                      Tidak ada pelanggan yang ditemukan.
                    </p>
                  </td>
                </tr>
              ) : (
                customers.map((customer) => (
                  <tr
                    key={customer.id}
                    className="hover:bg-pink-50/10 transition-colors group"
                  >
                    <td className="p-4 align-middle">
                      <p className="font-bold text-chester-text group-hover:text-chester-pink transition-colors">
                        {customer.fullname}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        ID Pelanggan: #{customer.id}
                      </p>
                    </td>
                    <td className="p-4 align-middle">
                      <p className="text-gray-700">{customer.email}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {customer.phone || "Belum isi No. HP"}
                      </p>
                    </td>
                    <td className="p-4 align-middle text-gray-600">
                      {formatDate(customer.created_at)}
                    </td>
                    <td className="p-4 align-middle text-center">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-bold border inline-block ${
                          customer.status === "active"
                            ? "bg-emerald-50 border-emerald-200 text-emerald-600"
                            : "bg-rose-50 border-rose-200 text-rose-600"
                        }`}
                      >
                        {customer.status === "active" ? "Aktif" : "Diblokir"}
                      </span>
                    </td>
                    <td className="p-4 align-middle">
                      <div className="flex items-center justify-center gap-2">
                        {/* Tombol Detail Profil */}
                        <Link
                          to={`/admin/customers/${customer.id}`}
                          title="Lihat Detail Profil & Alamat"
                          className="w-8 h-8 rounded bg-white text-gray-600 hover:text-chester-pink hover:bg-pink-50 flex items-center justify-center transition border border-gray-200 shadow-sm"
                        >
                          <Eye size={14} />
                        </Link>

                        {/* Tombol Sakelar Blokir */}
                        <button
                          onClick={() =>
                            toggleStatus(customer.id, customer.status)
                          }
                          title={
                            customer.status === "active"
                              ? "Blokir Akun Pelanggan"
                              : "Buka Blokir Akun"
                          }
                          className={`w-8 h-8 rounded bg-white border shadow-sm flex items-center justify-center transition ${
                            customer.status === "active"
                              ? "text-gray-400 hover:text-red-600 hover:bg-red-50 border-gray-200"
                              : "text-red-600 hover:text-emerald-600 hover:bg-emerald-50 border-red-100"
                          }`}
                        >
                          {customer.status === "active" ? (
                            <UserX size={14} />
                          ) : (
                            <UserCheck size={14} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* CONTROLLER PAGINASI */}
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
