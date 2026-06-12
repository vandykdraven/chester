import { useState, useEffect } from "react";
import {
  Upload,
  Trash2,
  Image as ImageIcon,
  Search,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
} from "lucide-react";
import axios from "axios";

export default function GalleryList() {
  const [media, setMedia] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  // --- STATE SERVER-SIDE PAGING & SEARCH ---
  const [searchTerm, setSearchTerm] = useState("");
  const [searchInput, setSearchInput] = useState(""); // Untuk menampung ketikan sebelum di-Enter
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    totalItems: 0,
    totalPages: 1,
    limit: 15,
  });

  const [deleteModal, setDeleteModal] = useState({
    show: false,
    id: null,
    filename: "",
  });
  const [customAlert, setCustomAlert] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const BASE_URL = import.meta.env.VITE_API_URL.replace("/api", "");

  // Fetch data setiap kali currentPage atau searchTerm (kata kunci final) berubah
  useEffect(() => {
    fetchGallery(currentPage, searchTerm);
  }, [currentPage, searchTerm]);

  const fetchGallery = async (page = 1, search = "") => {
    setIsLoading(true);
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/gallery`,
        {
          params: { page, limit: 15, search },
        },
      );

      if (response.data.success) {
        setMedia(response.data.data);
        // PERBAIKAN: Beri jaring pengaman. Hanya set pagination jika backend mengirimkannya.
        if (response.data.pagination) {
          setPagination(response.data.pagination);
        }
      }
    } catch (error) {
      console.error("Gagal memuat galeri:", error);
      showAlert("Gagal mengambil data galeri dari server.", "error");
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

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 7 * 1024 * 1024) {
      showAlert(
        "Ukuran file terlalu besar! Maksimal batasan adalah 7MB.",
        "error",
      );
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("galleryFile", file);

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/gallery/upload`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );

      if (response.data.success) {
        showAlert("Gambar baru berhasil ditambahkan!", "success");
        // Jika upload berhasil, kembalikan ke halaman 1 agar foto terbaru langsung terlihat
        if (currentPage === 1) {
          fetchGallery(1, searchTerm);
        } else {
          setCurrentPage(1);
        }
      }
    } catch (error) {
      console.error("Gagal unggah foto:", error);
      showAlert("Terjadi kegagalan sistem saat mengunggah foto.", "error");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteClick = (id, filename) => {
    setDeleteModal({ show: true, id, filename });
  };

  const confirmDelete = async () => {
    try {
      const response = await axios.delete(
        `${import.meta.env.VITE_API_URL}/gallery/${deleteModal.id}`,
      );
      if (response.data.success) {
        showAlert("Gambar berhasil dihapus dari server.", "success");
        fetchGallery(currentPage, searchTerm);
      }
    } catch (error) {
      console.error("Gagal hapus media:", error);
      showAlert("Server gagal menghapus file gambar fisik.", "error");
    } finally {
      setDeleteModal({ show: false, id: null, filename: "" });
    }
  };

  const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  // Memicu pencarian hanya saat tombol Enter ditekan atau tombol Cari diklik
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1); // Reset ke halaman 1 setiap kali mencari kata baru
    setSearchTerm(searchInput);
  };

  return (
    <div className="max-w-6xl mx-auto pb-12 relative">
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

      {deleteModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden p-6 text-center">
            <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Hapus Media Permanen?
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              Apakah Anda yakin ingin menghapus file{" "}
              <span className="font-bold text-gray-800">
                "{deleteModal.filename}"
              </span>
              ?
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() =>
                  setDeleteModal({ show: false, id: null, filename: "" })
                }
                className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-50 transition"
              >
                Batal
              </button>
              <button
                onClick={confirmDelete}
                className="px-5 py-2.5 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition shadow-sm"
              >
                Ya, Hapus Media
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-chester-text mb-1">
            Galeri Media Toko
          </h1>
          <p className="text-sm text-gray-500">
            Pusat unggah dan manajemen aset foto (Menampilkan{" "}
            {pagination?.limit || 15} foto/halaman).
          </p>
        </div>

        <label
          className={`bg-chester-pink text-white px-5 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-gray-900 transition-colors shadow-sm cursor-pointer ${isUploading ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          <input
            type="file"
            accept="image/*"
            disabled={isUploading}
            onChange={handleFileUpload}
            className="hidden"
          />
          <Upload size={18} />
          {isUploading ? "Mengunggah..." : "Unggah Foto Baru"}
        </label>
      </div>

      {/* ACTION BAR: PENCARIAN (FORM SUBMIT) */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 mb-6 shadow-sm">
        <form
          onSubmit={handleSearchSubmit}
          className="relative w-full max-w-md flex gap-2"
        >
          <div className="relative flex-1">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Cari nama berkas foto..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-chester-pink transition"
            />
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
          </div>
          <button
            type="submit"
            className="bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-black transition"
          >
            Cari
          </button>
        </form>
      </div>

      {/* KOTAK GRID UTAMA KOLEKSI GAMBAR */}
      {isLoading ? (
        <div className="bg-white rounded-xl border border-gray-200 p-20 text-center text-gray-500">
          <div className="animate-pulse flex flex-col items-center gap-2">
            <div className="h-8 w-8 border-4 border-chester-pink border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm font-semibold">
              Mengambil data dari server...
            </p>
          </div>
        </div>
      ) : media.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-20 text-center text-gray-500">
          <div className="flex flex-col items-center gap-3">
            <ImageIcon size={56} className="text-gray-300" />
            <p className="text-sm">Media tidak ditemukan di halaman ini.</p>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {media.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm group hover:border-chester-pink transition-all flex flex-col relative"
              >
                <div className="w-full aspect-square bg-gray-50 overflow-hidden relative border-b border-gray-100 flex items-center justify-center">
                  <img
                    src={`${BASE_URL}${item.file_path}`}
                    alt={item.filename}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />

                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2 z-10">
                    <button
                      onClick={() => handleDeleteClick(item.id, item.filename)}
                      className="p-2.5 bg-white text-gray-700 hover:text-red-600 rounded-xl shadow-lg transition transform hover:scale-110"
                      title="Hapus Permanen"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                <div className="p-3 flex-1 flex flex-col justify-between">
                  <p
                    className="text-xs font-bold text-gray-700 truncate mb-0.5"
                    title={item.filename}
                  >
                    {item.filename}
                  </p>
                  <p className="text-[10px] text-gray-400 font-medium">
                    {item.file_size
                      ? formatBytes(item.file_size)
                      : "Galeri Riwayat"}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* SERVER-SIDE PAGINATION CONTROLS */}
          {pagination.totalPages > 1 && (
            <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-5 rounded-xl border border-gray-200 mt-6 shadow-sm gap-4">
              <p className="text-sm text-gray-500">
                Menampilkan halaman{" "}
                <span className="font-bold text-chester-text">
                  {currentPage}
                </span>{" "}
                dari{" "}
                <span className="font-bold text-chester-text">
                  {pagination?.totalPages || 1}
                </span>{" "}
                (Total: {pagination?.totalItems || 0} foto)
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Mundur
                </button>
                <button
                  onClick={() =>
                    setCurrentPage((prev) =>
                      Math.min(prev + 1, pagination.totalPages),
                    )
                  }
                  disabled={currentPage === pagination.totalPages}
                  className="px-4 py-2 bg-gray-800 text-white border border-gray-800 rounded-lg text-sm font-semibold hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Maju
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
