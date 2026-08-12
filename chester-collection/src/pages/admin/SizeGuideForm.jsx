import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Save,
  Image as ImageIcon,
  CheckCircle,
  AlertCircle,
  Trash2,
  X,
  UploadCloud,
  Database,
} from "lucide-react";
import Quill from "quill";
import "quill/dist/quill.snow.css";
import { quillModules } from "../../utils/quillConfig";

// KOREKSI: Impor master API dan Image Helper
import api from "../../api";
import { getImageUrl } from "../../utils/imageHelper";

export default function SizeGuideForm() {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(isEditMode);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirectUploading, setIsDirectUploading] = useState(false);

  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: "",
    content: "",
    image_url: "",
  });

  const editorRef = useRef(null);
  const quillInstance = useRef(null);

  const [showGallery, setShowGallery] = useState(false);
  const [galleryMedia, setGalleryMedia] = useState([]);
  const [isGalleryLoading, setIsGalleryLoading] = useState(false);

  const [customAlert, setCustomAlert] = useState({
    show: false,
    message: "",
    type: "success",
  });

  // --- AMBIL DATA JIKA MODE EDIT ---
  useEffect(() => {
    if (isEditMode) {
      const fetchGuide = async () => {
        try {
          // KOREKSI: Gunakan master API terpusat
          const response = await api.get(`/size-guides/${id}`);
          if (response.data.success) {
            setFormData(response.data.data);
            if (quillInstance.current) {
              quillInstance.current.root.innerHTML =
                response.data.data.content || "";
            }
          }
        } catch (error) {
          console.error("Gagal mengambil data:", error);
          showAlert("Gagal memuat data panduan ukuran.", "error");
        } finally {
          setIsLoading(false);
        }
      };
      fetchGuide();
    }
  }, [id, isEditMode]);

  // --- INISIALISASI QUILL EDITOR ---
  useEffect(() => {
    if (!editorRef.current || quillInstance.current) return;

    quillInstance.current = new Quill(editorRef.current, {
      theme: "snow",
      placeholder: "Tuliskan detail panduan ukuran di sini (opsional)...",
      modules: quillModules,
    });

    quillInstance.current.on("text-change", () => {
      setFormData((prev) => ({
        ...prev,
        content: quillInstance.current.root.innerHTML,
      }));
    });

    if (formData.content) {
      quillInstance.current.root.innerHTML = formData.content;
    }
  }, [isLoading]);

  const showAlert = (message, type = "success") => {
    setCustomAlert({ show: true, message, type });
    if (type === "error") {
      setTimeout(
        () => setCustomAlert({ show: false, message: "", type: "success" }),
        4000,
      );
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // =======================================================================
  // LOGIKA BARU: UNGGAH LANGSUNG DARI PC (JALUR 1)
  // =======================================================================
  const handlePCUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 7 * 1024 * 1024) {
      showAlert("Ukuran file terlalu besar! Maksimal 7MB.", "error");
      return;
    }

    setIsDirectUploading(true);

    const directUploadData = new FormData();
    directUploadData.append("galleryFile", file);

    try {
      // KOREKSI: Gunakan master API terpusat
      const response = await api.post(`/gallery/upload`, directUploadData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.data.success) {
        const uploadedFilePath = response.data.data.file_path;
        setFormData((prev) => ({ ...prev, image_url: uploadedFilePath }));
        showAlert(
          "Gambar berhasil diunggah ke server dan dilampirkan!",
          "success",
        );
      }
    } catch (error) {
      console.error("Gagal unggah PC:", error);
      showAlert("Gagal mengunggah gambar dari PC ke server.", "error");
    } finally {
      setIsDirectUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // --- LOGIKA SIMPAN (POST / PUT) ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showAlert("Nama panduan wajib diisi!", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      let response;
      if (isEditMode) {
        // KOREKSI: Gunakan master API terpusat
        response = await api.put(`/size-guides/${id}`, formData);
      } else {
        // KOREKSI: Gunakan master API terpusat
        response = await api.post(`/size-guides`, formData);
      }

      if (response.data.success) {
        showAlert(
          `Panduan berhasil ${isEditMode ? "diperbarui" : "ditambahkan"}!`,
          "success",
        );
        setTimeout(() => navigate("/admin/size-guides"), 1500);
      }
    } catch (error) {
      console.error("Gagal menyimpan:", error);
      showAlert("Terjadi kesalahan saat menyimpan data.", "error");
      setIsSubmitting(false);
    }
  };

  // =======================================================================
  // LOGIKA: PILIH DARI SERVER / GALERI (JALUR 2)
  // =======================================================================
  const openGalleryModal = async () => {
    setShowGallery(true);
    if (galleryMedia.length === 0) {
      setIsGalleryLoading(true);
      try {
        // KOREKSI: Gunakan master API terpusat
        const response = await api.get(`/gallery?limit=50`);
        if (response.data.success) {
          setGalleryMedia(response.data.data);
        }
      } catch (error) {
        console.error("Gagal load galeri:", error);
      } finally {
        setIsGalleryLoading(false);
      }
    }
  };

  const selectImage = (filePath) => {
    setFormData({ ...formData, image_url: filePath });
    setShowGallery(false);
  };

  const removeSelectedImage = () => {
    setFormData({ ...formData, image_url: "" });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3 text-gray-500">
        <div className="h-8 w-8 border-4 border-chester-pink border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-semibold">Memuat data...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto pb-12 relative">
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        onChange={handlePCUpload}
        className="hidden"
      />

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

      {/* MODAL PILIH GAMBAR DARI GALERI SERVER */}
      {showGallery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden animate-scale-up">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                <Database size={20} className="text-chester-pink" /> Pilih Media
                di Server
              </h3>
              <button
                onClick={() => setShowGallery(false)}
                className="p-2 text-gray-400 hover:text-red-500 transition rounded-lg hover:bg-red-50"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 bg-gray-50/50">
              {isGalleryLoading ? (
                <div className="flex flex-col items-center justify-center h-40 gap-3 text-gray-500">
                  <div className="h-8 w-8 border-4 border-chester-pink border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-sm font-semibold">
                    Memuat pustaka media...
                  </p>
                </div>
              ) : galleryMedia.length === 0 ? (
                <div className="text-center text-gray-500 py-10">
                  <ImageIcon size={48} className="mx-auto mb-3 text-gray-300" />
                  <p>Galeri server masih kosong.</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                  {galleryMedia.map((media) => (
                    <div
                      key={media.id}
                      onClick={() => selectImage(media.file_path)}
                      className="cursor-pointer group relative aspect-square rounded-xl overflow-hidden border-2 border-transparent hover:border-chester-pink shadow-sm hover:shadow-md transition-all"
                    >
                      {/* KOREKSI: Penggunaan getImageUrl & penambahan onError */}
                      <img
                        src={getImageUrl(media.file_path)}
                        alt="Galeri"
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = "/placeholder.png";
                        }}
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                        <CheckCircle className="text-white" size={24} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-100 bg-white flex justify-end">
              <button
                onClick={() => setShowGallery(false)}
                className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-lg transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER FORM */}
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Link
            to="/admin/size-guides"
            className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600"
          >
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-bold text-chester-text">
            {isEditMode ? "Edit Panduan Ukuran" : "Tambah Panduan Ukuran"}
          </h1>
        </div>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || isDirectUploading}
          className="bg-chester-pink text-white px-6 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-gray-900 transition shadow-sm disabled:opacity-50"
        >
          <Save size={18} /> {isSubmitting ? "Menyimpan..." : "Simpan Panduan"}
        </button>
      </div>

      <form className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 flex flex-col gap-8">
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <h2 className="text-lg font-bold text-chester-text mb-6">
              Informasi Panduan
            </h2>
            <div className="flex flex-col gap-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Nama Panduan *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Contoh: Panduan Kemeja Pria"
                  className="w-full border border-gray-300 px-4 py-2.5 rounded-lg focus:outline-none focus:border-chester-pink"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Keterangan / Tabel Ukuran (Teks)
                </label>
                <div
                  ref={editorRef}
                  className="bg-white min-h-[200px] border rounded-lg"
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* ======================================================================= */}
        {/* KOLOM KANAN: AREA PILIH GAMBAR (2 JALUR) */}
        {/* ======================================================================= */}
        <div className="flex flex-col gap-8">
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <h2 className="text-lg font-bold text-chester-text mb-5">
              Gambar Panduan
            </h2>

            {isDirectUploading ? (
              <div className="border-2 border-dashed border-chester-pink bg-pink-50 rounded-xl aspect-[4/3] flex flex-col items-center justify-center text-center mb-5 gap-3">
                <div className="h-7 w-7 border-4 border-chester-pink border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm font-bold text-chester-pink">
                  Mengirim file ke server...
                </p>
              </div>
            ) : formData.image_url ? (
              <div className="relative border border-gray-200 rounded-xl overflow-hidden aspect-[4/3] bg-gray-50 flex items-center justify-center group mb-5 shadow-inner">
                {/* KOREKSI: Penggunaan getImageUrl & penambahan onError */}
                <img
                  src={getImageUrl(formData.image_url)}
                  alt="Preview"
                  className="w-full h-full object-contain p-2"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = "/placeholder.png";
                  }}
                />
                <button
                  type="button"
                  onClick={removeSelectedImage}
                  className="absolute top-3 right-3 bg-white/90 text-red-500 rounded-xl p-2 shadow-md z-20 hover:bg-red-500 hover:text-white transition opacity-0 group-hover:opacity-100 transform scale-90 group-hover:scale-100"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-200 bg-gray-50 rounded-xl p-8 flex flex-col items-center justify-center text-center aspect-[4/3] mb-5 text-gray-400">
                <ImageIcon className="mb-2" size={36} strokeWidth={1.5} />
                <p className="text-sm font-semibold">Belum ada gambar</p>
                <p className="text-xs">Teks panduan saja.</p>
              </div>
            )}

            {/* AREA TOMBOL PILIHAN */}
            <div className="grid grid-cols-1 gap-3 border-t border-gray-100 pt-5">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                Ambil Gambar Dari:
              </p>

              <button
                type="button"
                onClick={() => fileInputRef.current.click()}
                className="w-full py-2.5 bg-gray-800 text-white font-bold rounded-lg hover:bg-black transition flex justify-center items-center gap-2.5 text-sm shadow-sm"
              >
                <UploadCloud size={18} /> Unggah Baru dari PC
              </button>

              <div className="flex items-center gap-3 my-1">
                <div className="flex-1 h-px bg-gray-100"></div>
                <span className="text-xs font-bold text-gray-300">ATAU</span>
                <div className="flex-1 h-px bg-gray-100"></div>
              </div>

              <button
                type="button"
                onClick={openGalleryModal}
                className="w-full py-2.5 bg-white text-chester-pink border-2 border-chester-pink font-bold rounded-lg hover:bg-pink-50 transition flex justify-center items-center gap-2.5 text-sm"
              >
                <Database size={18} /> Ambil File di Server
              </button>
            </div>

            <p className="text-xs text-gray-400 mt-5 text-center leading-relaxed px-2">
              Gambar dari PC akan otomatis disimpan ke Galeri Media server agar
              bisa digunakan kembali nanti.
            </p>
          </div>
        </div>
      </form>
    </div>
  );
}
