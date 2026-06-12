import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  AlertTriangle,
  CheckCircle,
  AlertCircle,
  Ruler,
} from "lucide-react";
import axios from "axios";

export default function SizeGuideList() {
  const [guides, setGuides] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // --- STATE CUSTOM DIALOG & NOTIFIKASI ---
  const [deleteModal, setDeleteModal] = useState({
    show: false,
    id: null,
    name: "",
  });
  const [customAlert, setCustomAlert] = useState({
    show: false,
    message: "",
    type: "success",
  });

  useEffect(() => {
    fetchGuides();
  }, []);

  const fetchGuides = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/size-guides`,
      );
      if (response.data.success) {
        setGuides(response.data.data);
      }
    } catch (error) {
      console.error("Gagal memuat panduan ukuran:", error);
      showAlert("Gagal mengambil data panduan ukuran dari server.", "error");
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

  const handleDeleteClick = (id, name) => {
    setDeleteModal({ show: true, id, name });
  };

  const confirmDelete = async () => {
    try {
      const response = await axios.delete(
        `${import.meta.env.VITE_API_URL}/size-guides/${deleteModal.id}`,
      );
      if (response.data.success) {
        showAlert("Panduan ukuran berhasil dihapus!", "success");
        fetchGuides();
      }
    } catch (error) {
      console.error("Gagal hapus panduan:", error);
      showAlert("Server gagal menghapus data.", "error");
    } finally {
      setDeleteModal({ show: false, id: null, name: "" });
    }
  };

  // Logika Pencarian Client-Side
  const filteredGuides = guides.filter((guide) =>
    guide.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

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

      {/* CUSTOM DELETE MODAL */}
      {deleteModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden p-6 text-center">
            <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Hapus Panduan Ukuran?
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              Apakah Anda yakin ingin menghapus panduan{" "}
              <span className="font-bold text-gray-800">
                "{deleteModal.name}"
              </span>
              ? Produk yang menggunakan panduan ini tidak akan error, hanya saja
              panduannya akan hilang.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() =>
                  setDeleteModal({ show: false, id: null, name: "" })
                }
                className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-50 transition"
              >
                Batal
              </button>
              <button
                onClick={confirmDelete}
                className="px-5 py-2.5 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition shadow-sm"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER UTAMA */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-chester-text mb-1 flex items-center gap-2">
            <Ruler size={24} className="text-chester-pink" /> Panduan Ukuran
          </h1>
          <p className="text-sm text-gray-500">
            Kelola master data panduan ukuran untuk produk toko Anda.
          </p>
        </div>

        <Link
          to="/admin/size-guides/add"
          className="bg-chester-pink text-white px-5 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-gray-900 transition-colors shadow-sm"
        >
          <Plus size={18} /> Tambah Panduan Baru
        </Link>
      </div>

      {/* BOX TABEL */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {/* TOOLBAR SEARCH */}
        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div className="relative w-full max-w-md">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari nama panduan ukuran..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-chester-pink transition"
            />
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
          </div>
        </div>

        {/* DATA TABEL */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-white border-b border-gray-100 text-xs text-gray-400 uppercase tracking-wider">
                <th className="p-5 font-semibold w-16 text-center">No</th>
                <th className="p-5 font-semibold">Nama Panduan</th>
                <th className="p-5 font-semibold">Media Terlampir</th>
                <th className="p-5 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-gray-50">
              {isLoading ? (
                <tr>
                  <td colSpan="4" className="p-12 text-center text-gray-500">
                    <div className="animate-pulse flex flex-col items-center gap-2">
                      <div className="h-6 w-6 border-2 border-chester-pink border-t-transparent rounded-full animate-spin"></div>
                      Memuat data...
                    </div>
                  </td>
                </tr>
              ) : filteredGuides.length === 0 ? (
                <tr>
                  <td colSpan="4" className="p-12 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-3">
                      <Ruler size={48} className="text-gray-300" />
                      <p className="text-sm">
                        Belum ada panduan ukuran. Silakan tambah baru.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredGuides.map((guide, index) => (
                  <tr
                    key={guide.id}
                    className="hover:bg-pink-50/30 transition-colors group"
                  >
                    <td className="p-5 text-center align-middle font-medium text-gray-500">
                      {index + 1}
                    </td>
                    <td className="p-5 align-middle">
                      <p className="font-bold text-chester-text">
                        {guide.name}
                      </p>
                    </td>
                    <td className="p-5 align-middle text-gray-500">
                      {guide.image_url ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-green-50 text-green-600 text-xs font-semibold border border-green-200">
                          ✓ Ada Gambar
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-gray-50 text-gray-500 text-xs font-semibold border border-gray-200">
                          Teks Saja
                        </span>
                      )}
                    </td>
                    <td className="p-5 text-right align-middle">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link
                          to={`/admin/size-guides/edit/${guide.id}`}
                          className="w-8 h-8 rounded bg-gray-50 text-gray-600 hover:text-blue-600 hover:bg-blue-50 flex items-center justify-center transition border border-gray-200"
                        >
                          <Edit size={16} />
                        </Link>
                        <button
                          onClick={() =>
                            handleDeleteClick(guide.id, guide.name)
                          }
                          className="w-8 h-8 rounded bg-gray-50 text-gray-600 hover:text-red-600 hover:bg-red-50 flex items-center justify-center transition border border-gray-200"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
