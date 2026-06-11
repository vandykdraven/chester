import { useState, useEffect } from "react";
import {
  Upload,
  Trash2,
  Image as ImageIcon,
  Search,
  Plus,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
} from "lucide-react";
import axios from "axios";

export default function GalleryList() {
  const [media, setMedia] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  // --- STATE CUSTOM DIALOG & NOTIFIKASI ---
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

  useEffect(() => {
    fetchGallery();
  }, []);

  // Ambil data gambar global dari API Backend
  const fetchGallery = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/gallery`,
      );
      if (response.data.success) {
        setMedia(response.data.data);
      }
    } catch (error) {
      console.error("Gagal memuat galeri:", error);
      showAlert("Gagal mengambil data galeri dari server.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Fungsi pembantu memunculkan alert toast kustom
  const showAlert = (message, type = "success") => {
    setCustomAlert({ show: true, message, type });
    setTimeout(
      () => setCustomAlert({ show: false, message: "", type: "success" }),
      3000,
    );
  };

  // --- LOGIKA UNGGAH FILE INSTAN ---
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validasi ukuran (Maksimal 7MB sesuai multer backend)
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
        showAlert(
          "Gambar baru berhasil ditambahkan ke pustaka media!",
          "success",
        );
        fetchGallery(); // Segera segarkan grid foto
      }
    } catch (error) {
      console.error("Gagal unggah foto:", error);
      showAlert("Terjadi kegagalan sistem saat mengunggah foto.", "error");
    } finally {
      setIsUploading(false);
    }
  };

  // --- LOGIKA HAPUS MEDIA PERMANEN VIA CUSTOM MODAL ---
  const handleDeleteClick = (id, filename) => {
    setDeleteModal({ show: true, id, filename });
  };

  const confirmDelete = async () => {
    try {
      const response = await axios.delete(
        `${import.meta.env.VITE_API_URL}/gallery/${deleteModal.id}`,
      );
      if (response.data.success) {
        showAlert(
          "Gambar berhasil dihapus dari penyimpanan server.",
          "success",
        );
        fetchGallery(); // Segera hapus foto dari grid visual
      }
    } catch (error) {
      console.error("Gagal hapus media:", error);
      showAlert("Server gagal menghapus file gambar fisik.", "error");
    } finally {
      setDeleteModal({ show: false, id: null, filename: "" });
    }
  };

  // Fungsi pembantu konversi biner ke ukuran KB/MB yang mudah dibaca admin
  const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  // Sistem Filter Pencarian Nama File Gambar
  const filteredMedia = media.filter((item) =>
    item.filename?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="max-w-6xl mx-auto pb-12 relative">
      {/* 1. TOAST ALERT NOTIFIKASI MELAYANG */}
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

      {/* 2. CUSTOM CONFIRMATION DELETE MODAL */}
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
              ? Tindakan ini akan menghapus file fisik dari server.
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

      {/* HEADER UTAMA */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-chester-text mb-1">
            Galeri Media Toko
          </h1>
          <p className="text-sm text-gray-500">
            Pusat unggah dan manajemen aset foto katalog Chester Collection.
          </p>
        </div>

        {/* INPUT UPLOAD SEMBUNYI DI DALAM TOMBOL INDAH */}
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

      {/* ACTION BAR: PENCARIAN */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 mb-6 shadow-sm">
        <div className="relative max-w-md">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari nama berkas foto..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-chester-pink transition"
          />
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
        </div>
      </div>

      {/* KOTAK GRID UTAMA KOLEKSI GAMBAR */}
      {isLoading ? (
        <div className="bg-white rounded-xl border border-gray-200 p-20 text-center text-gray-500">
          <div className="animate-pulse flex flex-col items-center gap-2">
            <div className="h-8 w-8 border-4 border-chester-pink border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm font-semibold">
              Membuka pustaka media server...
            </p>
          </div>
        </div>
      ) : filteredMedia.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-20 text-center text-gray-500">
          <div className="flex flex-col items-center gap-3">
            <ImageIcon size={56} className="text-gray-300" />
            <p className="text-sm">
              Media tidak ditemukan atau galeri Anda masih kosong.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredMedia.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm group hover:border-chester-pink transition-all flex flex-col relative"
            >
              {/* KOTAK FOTO PREVIEW */}
              <div className="w-full aspect-square bg-gray-50 overflow-hidden relative border-b border-gray-100 flex items-center justify-center">
                <img
                  src={`${BASE_URL}${item.file_path}`}
                  alt={item.filename}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                />

                {/* TOMBOL DELETE MELAYANG (MUNCUL HANYA SAAT HOVER) */}
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

              {/* INFORMASI FILE DI BAGIAN BAWAH */}
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
      )}
    </div>
  );
}
