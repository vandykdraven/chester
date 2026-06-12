import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Save,
  Image as ImageIcon,
  Plus,
  Trash2,
  X,
  CheckCircle,
  AlertCircle,
  UploadCloud,
  Database,
} from "lucide-react";
import Quill from "quill";
import axios from "axios";
import "quill/dist/quill.snow.css";
import { quillModules } from "../../utils/quillConfig";

export default function ProductAdd() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const editorRef = useRef(null);
  const quillInstance = useRef(null);

  // Ref untuk input file PC tersembunyi
  const fileInputRef = useRef(null);
  const [activeSlot, setActiveSlot] = useState(null);

  // --- STATE DATA MASTER DROP-DOWN ---
  const [sizeGuides, setSizeGuides] = useState([]);
  const [categories, setCategories] = useState([]);

  // --- STATE CUSTOM ALERT ---
  const [customAlert, setCustomAlert] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const showAlert = (message, type = "success") => {
    setCustomAlert({ show: true, message, type });
    if (type === "error") {
      setTimeout(
        () => setCustomAlert({ show: false, message: "", type: "success" }),
        4000,
      );
    }
  };

  // --- STATE FORM UTAMA ---
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    size_guide_id: "", // Menampung pilihan panduan ukuran
    description: "",
    price: "",
    original_price: "",
    stock: "",
    sku: "",
    weight: "",
    status: "available",
    seo_title: "",
    seo_description: "",
    seo_keywords: "",
  });

  // --- STATE DUAL-PATH MEDIA ---
  // Slot 0: Utama, Slot 1-4: Pendukung. Tiap slot berisi null atau objek { type: 'pc'/'server', file?: File, path?: string, url: string }
  const [images, setImages] = useState([null, null, null, null, null]);
  const [showGallery, setShowGallery] = useState(false);
  const [galleryMedia, setGalleryMedia] = useState([]);
  const [isGalleryLoading, setIsGalleryLoading] = useState(false);
  const [tags, setTags] = useState([]);
  const [wholesales, setWholesales] = useState([]);
  const [hasVariant, setHasVariant] = useState(false);
  const [variantTypes, setVariantTypes] = useState([
    { name: "Ukuran", options: ["S", "M", "L"] },
  ]);
  const [optionInputs, setOptionInputs] = useState({});
  const [variantMatrix, setVariantMatrix] = useState([]);

  const BASE_URL = import.meta.env.VITE_API_URL.replace("/api", "");

  // --- 1. AMBIL MASTER DATA (PANDUAN UKURAN & KATEGORI) DARI DB ---
  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        const [guidesRes, catsRes, tagsRes] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_URL}/size-guides`),
          axios.get(`${import.meta.env.VITE_API_URL}/categories`),
          axios.get(`${import.meta.env.VITE_API_URL}/tags`), // <--- TAMBAH INI
        ]);

        if (guidesRes.data.success) setSizeGuides(guidesRes.data.data);
        if (catsRes.data.success) setCategories(catsRes.data.data);
        if (tagsRes.data.success) setTags(tagsRes.data.data); // <--- TAMBAH INI
      } catch (error) {
        console.error("Gagal memuat data master:", error);
      }
    };
    fetchMasterData();
  }, []);

  // --- 2. INITIALIZE QUILL TEXT EDITOR ---
  useEffect(() => {
    if (!editorRef.current || quillInstance.current) return;

    quillInstance.current = new Quill(editorRef.current, {
      theme: "snow",
      placeholder:
        "Tuliskan detail bahan, ukuran, dan spesifikasi produk di sini...",
      modules: quillModules,
    });

    quillInstance.current.on("text-change", () => {
      setFormData((prev) => ({
        ...prev,
        description: quillInstance.current.root.innerHTML,
      }));
    });
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // =======================================================================
  // LOGIKA MEDIA: PROSES JALUR PC & JALUR SERVER
  // =======================================================================
  const triggerPCUpload = (slotIdx) => {
    setActiveSlot(slotIdx);
    fileInputRef.current.click();
  };

  const handlePCFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const blobUrl = URL.createObjectURL(file);
    const newImages = [...images];
    newImages[activeSlot] = { type: "pc", file: file, url: blobUrl };
    setImages(newImages);
    e.target.value = ""; // Clear input
  };

  const triggerServerGallery = (slotIdx) => {
    setActiveSlot(slotIdx);
    setShowGallery(true);
    if (galleryMedia.length === 0) {
      loadGalleryData();
    }
  };

  const loadGalleryData = async () => {
    setIsGalleryLoading(true);
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/gallery?limit=50`,
      );
      if (response.data.success) {
        setGalleryMedia(response.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGalleryLoading(false);
    }
  };

  const handleSelectFromGallery = (filePath) => {
    const newImages = [...images];
    newImages[activeSlot] = {
      type: "server",
      path: filePath,
      url: `${BASE_URL}${filePath}`,
    };
    setImages(newImages);
    setShowGallery(false);
  };

  const removeImageSlot = (slotIdx, e) => {
    e.preventDefault();
    const newImages = [...images];
    newImages[slotIdx] = null;
    setImages(newImages);
  };

  // =======================================================================
  // LOGIKA SIMPAN DATA (POST DENGAN FORM-DATA MULTIPART)
  // =======================================================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!images[0]) {
      showAlert("Foto utama produk wajib diisi!", "error");
      return;
    }

    setIsSubmitting(true);

    try {
      const dataToSend = new FormData();

      // Kelompokkan file biner dari PC untuk dikirim ke multer backend
      if (images[0].type === "pc" && images[0].file) {
        dataToSend.append("primaryImage", images[0].file);
      }

      for (let i = 1; i <= 4; i++) {
        if (images[i] && images[i].type === "pc" && images[i].file) {
          dataToSend.append("supportingImages", images[i].file);
        }
      }

      // Buat manifest config agar backend tahu isi tiap slot (PC atau Server path)
      const imagesConfig = images.map((img) => {
        if (!img) return null;
        return {
          type: img.type,
          path: img.type === "server" ? img.path : null,
        };
      });

      const payload = {
        ...formData,
        hasVariant: hasVariant,
        variantTypes: hasVariant ? variantTypes : [],
        variantMatrix: hasVariant ? variantMatrix : [],
        wholesales,
        imagesConfig,
      };

      dataToSend.append("data", JSON.stringify(payload));

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/products`,
        dataToSend,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );

      if (response.data.success) {
        showAlert(
          "Luar biasa! Produk tingkat mahir berhasil disimpan.",
          "success",
        );
        setTimeout(() => {
          setCustomAlert({ show: false, message: "", type: "success" });
          navigate("/admin/products");
        }, 2000);
      }
    } catch (error) {
      console.error("Gagal menyimpan produk:", error);
      showAlert("Terjadi kesalahan sistem saat menyimpan produk.", "error");
      setIsSubmitting(false);
    }
  };

  // --- LOGIKA MANAJEMEN GROSIR & VARIASI (SAMA SEPERTI SEBELUMNYA) ---
  const addWholesale = () =>
    setWholesales([...wholesales, { minQty: "", price: "" }]);
  const removeWholesale = (index) =>
    setWholesales(wholesales.filter((_, i) => i !== index));
  const updateWholesale = (index, field, value) => {
    const newWs = [...wholesales];
    newWs[index][field] = value;
    setWholesales(newWs);
  };
  const addVariantType = () =>
    setVariantTypes([...variantTypes, { name: "", options: [] }]);
  const removeVariantType = (index) =>
    setVariantTypes(variantTypes.filter((_, i) => i !== index));
  const updateVariantTypeName = (index, value) => {
    const newVt = [...variantTypes];
    newVt[index].name = value;
    setVariantTypes(newVt);
  };
  const handleAddOption = (typeIndex) => {
    const val = optionInputs[typeIndex];
    if (val && val.trim() !== "") {
      const newVt = [...variantTypes];
      if (!newVt[typeIndex].options.includes(val.trim())) {
        newVt[typeIndex].options.push(val.trim());
        setVariantTypes(newVt);
      }
      setOptionInputs({ ...optionInputs, [typeIndex]: "" });
    }
  };
  const handleOptionKeyDown = (e, typeIndex) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddOption(typeIndex);
    }
  };
  const handleRemoveOption = (typeIndex, optIndex) => {
    const newVt = [...variantTypes];
    newVt[typeIndex].options.splice(optIndex, 1);
    setVariantTypes(newVt);
  };
  const updateMatrixValue = (index, field, value) => {
    const newMatrix = [...variantMatrix];
    newMatrix[index][field] = value;
    setVariantMatrix(newMatrix);
  };

  useEffect(() => {
    if (!hasVariant) return;
    const validTypes = variantTypes.filter(
      (vt) => vt.name.trim() && vt.options.length > 0,
    );
    if (validTypes.length === 0) return;
    const optionsArrays = validTypes.map((vt) => vt.options);
    const combos = optionsArrays.reduce(
      (a, b) => a.flatMap((d) => b.map((e) => [...d, e])),
      [[]],
    );
    setVariantMatrix((prevMatrix) => {
      return combos.map((combo) => {
        const key = combo.join("-");
        const existing = prevMatrix.find((p) => p.key === key);
        return (
          existing || {
            key,
            combination: combo,
            price: "",
            original_price: "",
            stock: "",
            weight: "",
            sku: "",
          }
        );
      });
    });
  }, [variantTypes, hasVariant]);

  const handleAddTagToSEO = (tagName) => {
    setFormData((prev) => {
      // Pecah string saat ini jadi array, hilangkan spasi, buang yang kosong
      const currentKeywords = prev.seo_keywords
        ? prev.seo_keywords
            .split(",")
            .map((k) => k.trim())
            .filter((k) => k)
        : [];
      // Jika tag belum ada di dalam daftar, masukkan
      if (!currentKeywords.includes(tagName)) {
        currentKeywords.push(tagName);
      }
      return { ...prev, seo_keywords: currentKeywords.join(", ") };
    });
  };

  // =======================================================================
  // LOGIKA SMART TAGGING (AUTOCOMPLETE & AUTO-SAVE)
  // =======================================================================
  const [tagInput, setTagInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Ambil array keyword saat ini dari string (contoh: "kemeja, pria" -> ["kemeja", "pria"])
  const currentKeywords = formData.seo_keywords
    ? formData.seo_keywords
        .split(",")
        .map((k) => k.trim())
        .filter((k) => k)
    : [];

  // Filter saran tag dari database (tidak menampilkan yang sudah dipilih)
  const suggestedTags = tags.filter(
    (t) =>
      t.name.toLowerCase().includes(tagInput.toLowerCase()) &&
      !currentKeywords
        .map((k) => k.toLowerCase())
        .includes(t.name.toLowerCase()),
  );

  const addTagToSEO = async (tagName) => {
    const trimmedName = tagName.trim();
    if (!trimmedName) return;

    // Cegah duplikasi di form input
    if (
      currentKeywords
        .map((k) => k.toLowerCase())
        .includes(trimmedName.toLowerCase())
    ) {
      setTagInput("");
      return;
    }

    // AUTO-SAVE: Simpan tag baru ke database secara diam-diam (background) jika belum terdaftar
    const isExistInDB = tags.find(
      (t) => t.name.toLowerCase() === trimmedName.toLowerCase(),
    );
    if (!isExistInDB) {
      try {
        await axios.post(`${import.meta.env.VITE_API_URL}/tags`, {
          name: trimmedName,
        });
        // Update state lokal agar bisa disarankan di pengetikan berikutnya
        setTags([...tags, { id: Date.now(), name: trimmedName }]);
      } catch (error) {
        console.error("Gagal auto-save tag:", error);
      }
    }

    // Masukkan ke state form produk utama
    const newKeywords = [...currentKeywords, trimmedName];
    setFormData((prev) => ({ ...prev, seo_keywords: newKeywords.join(", ") }));
    setTagInput("");
    setShowSuggestions(false);
  };

  const removeTagFromSEO = (indexToRemove) => {
    const newKeywords = currentKeywords.filter(
      (_, idx) => idx !== indexToRemove,
    );
    setFormData((prev) => ({ ...prev, seo_keywords: newKeywords.join(", ") }));
  };

  const handleTagKeyDown = (e) => {
    // Tombol Enter atau Koma akan memicu penambahan Tag
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTagToSEO(tagInput);
    }
  };

  return (
    <div className="max-w-5xl mx-auto pb-12 relative">
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        onChange={handlePCFileChange}
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

      {/* MODAL GALERI FILE MANAGER SERVER */}
      {showGallery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden animate-scale-up">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                Pilih Foto dari Galeri Server
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
                <div className="flex flex-col items-center justify-center h-40 gap-2">
                  <div className="h-6 w-6 border-2 border-chester-pink border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : galleryMedia.length === 0 ? (
                <p className="text-center text-gray-400 py-10">
                  Pustaka media kosong.
                </p>
              ) : (
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-4">
                  {galleryMedia.map((media) => (
                    <div
                      key={media.id}
                      onClick={() => handleSelectFromGallery(media.file_path)}
                      className="cursor-pointer aspect-square rounded-xl overflow-hidden border hover:border-chester-pink transition shadow-sm"
                    >
                      <img
                        src={`${BASE_URL}${media.file_path}`}
                        alt="Media"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* HEADER BAR */}
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Link
            to="/admin/products"
            className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600"
          >
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-bold text-chester-text">
            Tambah Produk Baru
          </h1>
        </div>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="bg-chester-pink text-white px-6 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-gray-900 transition shadow-sm"
        >
          <Save size={18} /> {isSubmitting ? "Menyimpan..." : "Publish Produk"}
        </button>
      </div>

      <form
        className="grid grid-cols-1 lg:grid-cols-3 gap-8"
        onSubmit={handleSubmit}
      >
        <div className="lg:col-span-2 flex flex-col gap-8">
          {/* INFORMASI DASAR */}
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <h2 className="text-lg font-bold text-chester-text mb-6">
              Informasi Dasar
            </h2>
            <div className="flex flex-col gap-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Nama Produk *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full border border-gray-300 px-4 py-2.5 rounded-lg focus:outline-none focus:border-chester-pink"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Deskripsi Produk
                </label>
                <div
                  ref={editorRef}
                  className="bg-white min-h-[200px] border rounded-lg"
                ></div>
              </div>
            </div>
          </div>

          {/* VARIASI PRODUK */}
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-lg font-bold text-chester-text">
                  Variasi Produk
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  Aktifkan untuk ukuran atau warna bersilang.
                </p>
              </div>
              <label className="flex items-center cursor-pointer relative">
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={hasVariant}
                  onChange={() => setHasVariant(!hasVariant)}
                />
                <div
                  className={`w-11 h-6 rounded-full transition ${hasVariant ? "bg-chester-pink" : "bg-gray-300"}`}
                ></div>
                <div
                  className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${hasVariant ? "translate-x-5" : ""}`}
                ></div>
              </label>
            </div>

            {hasVariant && (
              <div className="flex flex-col gap-6 border-t pt-6">
                {variantTypes.map((vt, index) => (
                  <div
                    key={index}
                    className="flex flex-col gap-4 p-5 bg-gray-50 rounded-xl border relative"
                  >
                    <button
                      type="button"
                      onClick={() => removeVariantType(index)}
                      className="absolute top-4 right-4 text-gray-400 hover:text-red-500"
                    >
                      <Trash2 size={18} />
                    </button>
                    <div className="w-full max-w-sm">
                      <label className="block text-sm font-bold text-gray-700 mb-1">
                        Variasi Induk
                      </label>
                      <input
                        type="text"
                        value={vt.name}
                        onChange={(e) =>
                          updateVariantTypeName(index, e.target.value)
                        }
                        className="w-full border px-3 py-2 rounded-lg text-sm"
                      />
                    </div>
                    <div className="w-full">
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Sub Variasi
                      </label>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {vt.options?.map((opt, optIndex) => (
                          <span
                            key={optIndex}
                            className="bg-white border border-chester-pink text-chester-pink px-3 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-2"
                          >
                            {opt}
                            <button
                              type="button"
                              onClick={() =>
                                handleRemoveOption(index, optIndex)
                              }
                            >
                              <X size={14} />
                            </button>
                          </span>
                        ))}
                      </div>
                      <div className="flex gap-2 max-w-sm">
                        <input
                          type="text"
                          value={optionInputs[index] || ""}
                          onChange={(e) =>
                            setOptionInputs({
                              ...optionInputs,
                              [index]: e.target.value,
                            })
                          }
                          onKeyDown={(e) => handleOptionKeyDown(e, index)}
                          placeholder="Ketik lalu Enter"
                          className="flex-1 border px-3 py-2 rounded-lg text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddOption(index)}
                          className="bg-gray-800 text-white px-4 py-2 rounded-lg text-sm"
                        >
                          Tambah
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addVariantType}
                  className="w-max py-2 px-4 border-2 border-dashed border-chester-pink text-chester-pink text-sm font-bold rounded-lg flex items-center gap-2"
                >
                  <Plus size={16} /> Tambah Kategori Variasi
                </button>

                {variantMatrix.length > 0 && (
                  <div className="overflow-x-auto border rounded-xl mt-4">
                    <table className="w-full text-left min-w-[750px]">
                      <thead>
                        <tr className="bg-gray-100 text-xs text-gray-700 font-bold uppercase">
                          <th className="p-4">Kombinasi</th>
                          <th className="p-4 w-28">Harga (Rp)</th>
                          <th className="p-4 w-28">Coret (Rp)</th>
                          <th className="p-4 w-24">Stok</th>
                          <th className="p-4 w-24">Berat (gr)</th>
                          <th className="p-4 w-32">SKU</th>
                        </tr>
                      </thead>
                      <tbody>
                        {variantMatrix.map((item, index) => (
                          <tr key={index} className="border-b">
                            <td className="p-3 text-sm font-bold text-chester-pink">
                              {item.key}
                            </td>
                            <td className="p-3">
                              <input
                                type="number"
                                value={item.price}
                                onChange={(e) =>
                                  updateMatrixValue(
                                    index,
                                    "price",
                                    e.target.value,
                                  )
                                }
                                className="w-full p-2 border rounded text-sm"
                              />
                            </td>
                            <td className="p-3">
                              <input
                                type="number"
                                value={item.original_price}
                                onChange={(e) =>
                                  updateMatrixValue(
                                    index,
                                    "original_price",
                                    e.target.value,
                                  )
                                }
                                className="w-full p-2 border rounded text-sm"
                              />
                            </td>
                            <td className="p-3">
                              <input
                                type="number"
                                value={item.stock}
                                onChange={(e) =>
                                  updateMatrixValue(
                                    index,
                                    "stock",
                                    e.target.value,
                                  )
                                }
                                className="w-full p-2 border rounded text-sm"
                              />
                            </td>
                            <td className="p-3">
                              <input
                                type="number"
                                value={item.weight}
                                onChange={(e) =>
                                  updateMatrixValue(
                                    index,
                                    "weight",
                                    e.target.value,
                                  )
                                }
                                className="w-full p-2 border rounded text-sm"
                              />
                            </td>
                            <td className="p-3">
                              <input
                                type="text"
                                value={item.sku}
                                onChange={(e) =>
                                  updateMatrixValue(
                                    index,
                                    "sku",
                                    e.target.value,
                                  )
                                }
                                className="w-full p-2 border rounded text-sm uppercase"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* HARGA GROSIR */}
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <h2 className="text-lg font-bold text-chester-text mb-4">
              Harga Grosir
            </h2>
            <div className="flex flex-col gap-4">
              {wholesales.map((ws, index) => (
                <div
                  key={index}
                  className="flex gap-4 items-center bg-gray-50 p-3 rounded-lg border"
                >
                  <div className="flex-1">
                    <label className="block text-xs font-bold mb-1">
                      Minimal Qty
                    </label>
                    <input
                      type="number"
                      value={ws.minQty}
                      onChange={(e) =>
                        updateWholesale(index, "minQty", e.target.value)
                      }
                      className="w-full border px-4 py-2 rounded-lg text-sm"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-bold mb-1">
                      Harga Satuan Grosir (Rp)
                    </label>
                    <input
                      type="number"
                      value={ws.price}
                      onChange={(e) =>
                        updateWholesale(index, "price", e.target.value)
                      }
                      className="w-full border px-4 py-2 rounded-lg text-sm"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeWholesale(index)}
                    className="mt-5 p-2 text-gray-400 hover:text-red-500"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addWholesale}
                className="w-max mt-2 text-sm font-bold text-chester-pink flex items-center gap-1"
              >
                <Plus size={16} /> Tambah Batasan Grosir
              </button>
            </div>
          </div>

          {/* SEO SETTINGS */}
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <h2 className="text-lg font-bold text-chester-text mb-6">
              Pengaturan SEO
            </h2>
            <div className="flex flex-col gap-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  SEO Title
                </label>
                <input
                  type="text"
                  name="seo_title"
                  value={formData.seo_title}
                  onChange={handleChange}
                  className="w-full border px-4 py-2.5 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  SEO Description
                </label>
                <textarea
                  name="seo_description"
                  rows="3"
                  value={formData.seo_description}
                  onChange={handleChange}
                  className="w-full border px-4 py-3 rounded-lg resize-none"
                ></textarea>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  SEO Keywords / Tag Produk
                </label>
                <div className="relative">
                  {/* KOTAK INPUT MULTI-TAG */}
                  <div className="flex flex-wrap gap-2 w-full border border-gray-300 px-3 py-2 rounded-lg bg-white focus-within:border-chester-pink min-h-[46px] items-center transition-colors">
                    {currentKeywords.map((kw, idx) => (
                      <span
                        key={idx}
                        className="bg-pink-50 text-chester-pink border border-pink-200 px-2.5 py-1 rounded-md text-xs font-bold flex items-center gap-1.5 shadow-sm"
                      >
                        {kw}
                        <button
                          type="button"
                          onClick={() => removeTagFromSEO(idx)}
                          className="hover:bg-red-500 hover:text-white rounded-full p-0.5 transition-colors"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => {
                        setTagInput(e.target.value);
                        setShowSuggestions(true);
                      }}
                      onKeyDown={handleTagKeyDown}
                      onFocus={() => setShowSuggestions(true)}
                      onBlur={() =>
                        setTimeout(() => setShowSuggestions(false), 200)
                      }
                      placeholder={
                        currentKeywords.length === 0
                          ? "Ketik keyword lalu tekan Enter atau Koma..."
                          : "Ketik lagi..."
                      }
                      className="flex-1 min-w-[150px] outline-none bg-transparent text-sm text-gray-700 placeholder-gray-400"
                    />
                  </div>

                  {/* DROPDOWN SARAN (AUTOCOMPLETE) */}
                  {showSuggestions && tagInput && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-2xl max-h-48 overflow-y-auto">
                      {suggestedTags.length > 0 ? (
                        suggestedTags.map((tag) => (
                          <div
                            key={tag.id}
                            onClick={() => addTagToSEO(tag.name)}
                            className="px-4 py-2.5 hover:bg-pink-50 hover:text-chester-pink cursor-pointer text-sm font-semibold text-gray-700 transition border-b border-gray-50 last:border-0"
                          >
                            <span className="opacity-40 mr-2">#</span>
                            {tag.name}
                          </div>
                        ))
                      ) : (
                        <div className="px-4 py-3 text-sm text-gray-500 bg-gray-50 rounded-b-xl border-t border-gray-100">
                          Tekan{" "}
                          <span className="font-bold text-gray-700">Enter</span>{" "}
                          untuk menambahkan{" "}
                          <span className="font-bold text-chester-pink">
                            "{tagInput}"
                          </span>{" "}
                          sebagai Tag baru di server.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ======================================================================= */}
        {/* KOLOM KANAN: DUAL-PATH MEDIA & INTERACTIVE DROPDOWNS */}
        {/* ======================================================================= */}
        <div className="flex flex-col gap-8">
          {/* MEDIA PRODUK (SLOT UTAMA & PENDUKUNG DENGAN DUAL KONTROL) */}
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <h2 className="text-lg font-bold text-chester-text mb-4">
              Media Katalog
            </h2>

            {/* SLOT 0: FOTO UTAMA */}
            <div className="relative border-2 border-dashed border-gray-200 bg-gray-50 rounded-xl p-4 flex flex-col items-center justify-center text-center aspect-square mb-4 overflow-hidden group">
              {images[0] ? (
                <>
                  <img
                    src={images[0].url}
                    alt="Utama"
                    className="absolute inset-0 w-full h-full object-cover z-10"
                  />
                  <button
                    onClick={(e) => removeImageSlot(0, e)}
                    className="absolute top-3 right-3 bg-white text-red-500 rounded p-1.5 shadow-md z-20 hover:bg-red-500 hover:text-white"
                  >
                    <Trash2 size={16} />
                  </button>
                </>
              ) : (
                <div className="z-10 flex flex-col items-center">
                  <ImageIcon className="text-gray-300 mb-2" size={32} />
                  <p className="text-xs font-bold text-gray-500 mb-3">
                    Foto Utama Produk
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => triggerPCUpload(0)}
                      className="px-2.5 py-1.5 bg-gray-800 text-white text-xs rounded font-semibold flex items-center gap-1 hover:bg-black"
                    >
                      <UploadCloud size={12} /> PC
                    </button>
                    <button
                      type="button"
                      onClick={() => triggerServerGallery(0)}
                      className="px-2.5 py-1.5 bg-white text-chester-pink border border-chester-pink text-xs rounded font-semibold flex items-center gap-1 hover:bg-pink-50"
                    >
                      <Database size={12} /> Server
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* SLOT 1-4: FOTO PENDUKUNG */}
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4].map((idx) => (
                <div
                  key={idx}
                  className="relative border-2 border-dashed border-gray-200 bg-gray-50 rounded-lg aspect-square flex flex-col items-center justify-center text-center overflow-hidden group"
                >
                  {images[idx] ? (
                    <>
                      <img
                        src={images[idx].url}
                        alt="Pendukung"
                        className="absolute inset-0 w-full h-full object-cover z-10"
                      />
                      <button
                        onClick={(e) => removeImageSlot(idx, e)}
                        className="absolute top-1 right-1 bg-white/80 text-red-500 rounded p-1 z-20"
                      >
                        <X size={12} />
                      </button>
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-1 p-0.5">
                      <Plus size={14} className="text-gray-400" />
                      <div className="flex flex-col gap-1">
                        <button
                          type="button"
                          onClick={() => triggerPCUpload(idx)}
                          className="p-1 bg-gray-800 text-white rounded text-[9px] font-bold"
                        >
                          <UploadCloud size={10} className="mx-auto" />
                        </button>
                        <button
                          type="button"
                          onClick={() => triggerServerGallery(idx)}
                          className="p-1 bg-white text-chester-pink border border-chester-pink rounded text-[9px] font-bold"
                        >
                          <Database size={10} className="mx-auto" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* HARGA & INVENTARIS MANUAL (JIKA STANDAR) */}
          {!hasVariant && (
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
              <h2 className="text-lg font-bold text-chester-text mb-6">
                Harga & Inventaris
              </h2>
              <div className="flex flex-col gap-5">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Harga Jual (Rp) *
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    className="w-full border px-4 py-2.5 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Harga Coret
                  </label>
                  <input
                    type="number"
                    name="original_price"
                    value={formData.original_price}
                    onChange={handleChange}
                    className="w-full border px-4 py-2.5 rounded-lg"
                  />
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Stok
                    </label>
                    <input
                      type="number"
                      name="stock"
                      value={formData.stock}
                      onChange={handleChange}
                      className="w-full border px-4 py-2.5 rounded-lg"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Berat (gr)
                    </label>
                    <input
                      type="number"
                      name="weight"
                      value={formData.weight}
                      onChange={handleChange}
                      className="w-full border px-4 py-2.5 rounded-lg"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    SKU
                  </label>
                  <input
                    type="text"
                    name="sku"
                    value={formData.sku}
                    onChange={handleChange}
                    className="w-full border px-4 py-2.5 rounded-lg uppercase"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STATUS, KATEGORI, & PANDUAN UKURAN DINAMIS */}
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <h2 className="text-lg font-bold text-chester-text mb-4">
              Pengaturan Katalog
            </h2>
            <div className="flex flex-col gap-5">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                  Status Produk
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full border px-4 py-2.5 rounded-lg bg-white"
                >
                  <option value="available">Aktif</option>
                  <option value="draft">Draf</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                  Kategori Toko
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full border px-4 py-2.5 rounded-lg bg-white"
                >
                  <option value="">-- Pilih Kategori --</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* --- DROPDOWN PANDUAN UKURAN DINAMIS --- */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                  Template Panduan Ukuran
                </label>
                <select
                  name="size_guide_id"
                  value={formData.size_guide_id}
                  onChange={handleChange}
                  className="w-full border px-4 py-2.5 rounded-lg bg-white focus:border-chester-pink"
                >
                  <option value="">-- Tanpa Panduan Ukuran --</option>
                  {sizeGuides.map((guide) => (
                    <option key={guide.id} value={guide.id}>
                      {guide.name}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-gray-400 mt-1.5 leading-relaxed">
                  Jika produk ini membutuhkan pop-up tabel panduan ukuran saat
                  diklik oleh pembeli di website utama.
                </p>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
