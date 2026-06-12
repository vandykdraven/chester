import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
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

export default function ProductEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const editorRef = useRef(null);
  const quillInstance = useRef(null);
  const fileInputRef = useRef(null);
  const [activeSlot, setActiveSlot] = useState(null);

  // --- DATA MASTER ---
  const [sizeGuides, setSizeGuides] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);

  const [customAlert, setCustomAlert] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const showAlert = (message, type = "success") => {
    setCustomAlert({ show: true, message, type });
    if (type === "error")
      setTimeout(
        () => setCustomAlert({ show: false, message: "", type: "success" }),
        4000,
      );
  };

  const [formData, setFormData] = useState({
    name: "",
    category_id: "",
    size_guide_id: "",
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

  // Dual-Path Media State
  const [images, setImages] = useState([null, null, null, null, null]);
  const [showGallery, setShowGallery] = useState(false);
  const [galleryMedia, setGalleryMedia] = useState([]);
  const [isGalleryLoading, setIsGalleryLoading] = useState(false);

  const [wholesales, setWholesales] = useState([]);
  const [hasVariant, setHasVariant] = useState(false);
  const [variantTypes, setVariantTypes] = useState([
    { name: "Ukuran", options: [] },
  ]);
  const [optionInputs, setOptionInputs] = useState({});
  const [variantMatrix, setVariantMatrix] = useState([]);

  const BASE_URL = import.meta.env.VITE_API_URL.replace("/api", "");

  // --- 1. AMBIL MASTER DATA (PANDUAN UKURAN, KATEGORI, TAG) DARI DB ---
  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        const [guidesRes, catsRes, tagsRes] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_URL}/size-guides`),
          axios.get(`${import.meta.env.VITE_API_URL}/categories`),
          axios.get(`${import.meta.env.VITE_API_URL}/tags`),
        ]);

        if (guidesRes.data.success) setSizeGuides(guidesRes.data.data);
        if (catsRes.data.success) setCategories(catsRes.data.data);
        if (tagsRes.data.success) setTags(tagsRes.data.data);
      } catch (error) {
        console.error("Gagal memuat data master:", error);
      }
    };
    fetchMasterData();
  }, []);

  // --- 2. AMBIL DATA PRODUK UNTUK DIEDIT ---
  useEffect(() => {
    const loadProductData = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/products/${id}`,
        );
        if (response.data.success) {
          const p = response.data.data;

          setFormData({
            name: p.name || "",
            category_id: p.category_id || "",
            size_guide_id: p.size_guide_id || "",
            description: p.description || "",
            price: p.price || "",
            original_price: p.original_price || "",
            stock: p.stock || "",
            sku: p.sku || "",
            weight: p.weight || "",
            status: p.status || "available",
            seo_title: p.seo_title || "",
            seo_description: p.seo_description || "",
            seo_keywords: p.seo_keywords || "",
          });

          setHasVariant(p.has_variant === 1);
          if (p.has_variant === 1 && p.variant_types_json) {
            setVariantTypes(JSON.parse(p.variant_types_json));
            setVariantMatrix(p.variants);
          }

          if (p.wholesales) {
            setWholesales(
              p.wholesales.map((w) => ({
                minQty: w.min_qty,
                price: w.wholesale_price,
              })),
            );
          }

          // Konstruksi Gambar
          const loadedImages = [null, null, null, null, null];
          const primaryImg = p.images.find((img) => img.is_primary === 1);
          if (primaryImg)
            loadedImages[0] = {
              type: "existing",
              path: primaryImg.image_url,
              url: `${BASE_URL}${primaryImg.image_url}`,
            };

          const supportingImgs = p.images.filter((img) => img.is_primary === 0);
          supportingImgs.forEach((img, index) => {
            if (index < 4)
              loadedImages[index + 1] = {
                type: "existing",
                path: img.image_url,
                url: `${BASE_URL}${img.image_url}`,
              };
          });
          setImages(loadedImages);

          if (quillInstance.current && p.description) {
            quillInstance.current.root.innerHTML = p.description;
          }
        }
      } catch (error) {
        console.error("Gagal memuat produk:", error);
        showAlert("Gagal memuat data produk.", "error");
      } finally {
        setIsLoading(false);
      }
    };
    loadProductData();
  }, [id]);

  // --- 3. INITIALIZE QUILL ---
  useEffect(() => {
    if (!editorRef.current || quillInstance.current) return;
    quillInstance.current = new Quill(editorRef.current, {
      theme: "snow",
      modules: quillModules,
    });
    quillInstance.current.on("text-change", () => {
      setFormData((prev) => ({
        ...prev,
        description: quillInstance.current.root.innerHTML,
      }));
    });
    if (formData.description)
      quillInstance.current.root.innerHTML = formData.description;
  }, [isLoading]);

  const handleChange = (e) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  // --- 4. MEDIA HANDLERS ---
  const triggerPCUpload = (slotIdx) => {
    setActiveSlot(slotIdx);
    fileInputRef.current.click();
  };

  const handlePCFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const newImages = [...images];
    newImages[activeSlot] = {
      type: "pc",
      file: file,
      url: URL.createObjectURL(file),
    };
    setImages(newImages);
    e.target.value = "";
  };

  const triggerServerGallery = (slotIdx) => {
    setActiveSlot(slotIdx);
    setShowGallery(true);
    if (galleryMedia.length === 0) loadGalleryData();
  };

  const loadGalleryData = async () => {
    setIsGalleryLoading(true);
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/gallery?limit=50`,
      );
      if (response.data.success) setGalleryMedia(response.data.data);
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
  // LOGIKA SMART TAGGING (AUTOCOMPLETE & AUTO-SAVE)
  // =======================================================================
  const [tagInput, setTagInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const currentKeywords = formData.seo_keywords
    ? formData.seo_keywords
        .split(",")
        .map((k) => k.trim())
        .filter((k) => k)
    : [];

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

    if (
      currentKeywords
        .map((k) => k.toLowerCase())
        .includes(trimmedName.toLowerCase())
    ) {
      setTagInput("");
      return;
    }

    const isExistInDB = tags.find(
      (t) => t.name.toLowerCase() === trimmedName.toLowerCase(),
    );
    if (!isExistInDB) {
      try {
        await axios.post(`${import.meta.env.VITE_API_URL}/tags`, {
          name: trimmedName,
        });
        setTags([...tags, { id: Date.now(), name: trimmedName }]);
      } catch (error) {
        console.error("Gagal auto-save tag:", error);
      }
    }

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
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTagToSEO(tagInput);
    }
  };

  // --- 5. SUBMIT HANDLER ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!images[0]) {
      showAlert("Foto utama produk wajib diisi!", "error");
      return;
    }
    setIsSubmitting(true);

    try {
      const dataToSend = new FormData();
      if (images[0].type === "pc" && images[0].file)
        dataToSend.append("primaryImage", images[0].file);
      for (let i = 1; i <= 4; i++) {
        if (images[i] && images[i].type === "pc" && images[i].file)
          dataToSend.append("supportingImages", images[i].file);
      }

      const imagesConfig = images.map((img) =>
        img
          ? {
              type: img.type,
              path:
                img.type === "server" || img.type === "existing"
                  ? img.path
                  : null,
            }
          : null,
      );

      const payload = {
        ...formData,
        has_variant: hasVariant,
        variantTypes: hasVariant ? variantTypes : [],
        variantMatrix: hasVariant ? variantMatrix : [],
        wholesales,
        imagesConfig,
      };
      dataToSend.append("data", JSON.stringify(payload));

      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/products/${id}`,
        dataToSend,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );

      if (response.data.success) {
        showAlert("Perubahan produk berhasil disimpan.", "success");
        setTimeout(() => navigate("/admin/products"), 2000);
      }
    } catch (error) {
      showAlert("Terjadi kesalahan saat menyimpan produk.", "error");
      setIsSubmitting(false);
    }
  };

  // --- VARIANTS & WHOLESALE HANDLERS ---
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
    if (!hasVariant || isLoading) return;
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
        const existing = prevMatrix.find(
          (p) => p.key === key || p.variant_key === key,
        );
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
  }, [variantTypes, hasVariant, isLoading]);

  if (isLoading)
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3 text-gray-500">
        <div className="h-8 w-8 border-4 border-chester-pink border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-semibold">Memuat produk...</p>
      </div>
    );

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

      {/* MODAL GALERI SERVER */}
      {showGallery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden animate-scale-up">
            <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-lg text-gray-800">
                Pilih Foto dari Galeri Server
              </h3>
              <button
                onClick={() => setShowGallery(false)}
                className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              {isGalleryLoading ? (
                <div className="flex justify-center h-40 items-center">
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

      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Link
            to="/admin/products"
            className="p-2 bg-white border rounded-lg hover:bg-gray-50"
          >
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-bold text-chester-text">Edit Produk</h1>
        </div>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="bg-chester-pink text-white px-6 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-gray-900 transition"
        >
          <Save size={18} />{" "}
          {isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
        </button>
      </div>

      <form
        className="grid grid-cols-1 lg:grid-cols-3 gap-8"
        onSubmit={handleSubmit}
      >
        <div className="lg:col-span-2 flex flex-col gap-8">
          <div className="bg-white p-6 rounded-xl border shadow-sm">
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
                  className="w-full border px-4 py-2.5 rounded-lg focus:outline-none focus:border-chester-pink"
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
          <div className="bg-white p-6 rounded-xl border shadow-sm">
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
                              {item.variant_key ||
                                item.key ||
                                item.combination?.join("-")}
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
          <div className="bg-white p-6 rounded-xl border shadow-sm">
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
                      Harga (Rp)
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
                <Plus size={16} /> Tambah Grosir
              </button>
            </div>
          </div>

          {/* SEO SETTINGS & SMART TAGGING */}
          <div className="bg-white p-6 rounded-xl border shadow-sm">
            <h2 className="text-lg font-bold text-chester-text mb-6">
              Pengaturan SEO & Tag
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
                          ? "Ketik lalu tekan Enter..."
                          : "Ketik lagi..."
                      }
                      className="flex-1 min-w-[150px] outline-none bg-transparent text-sm text-gray-700 placeholder-gray-400"
                    />
                  </div>

                  {showSuggestions && tagInput && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-2xl max-h-48 overflow-y-auto">
                      {suggestedTags.length > 0 ? (
                        suggestedTags.map((tag) => (
                          <div
                            key={tag.id}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              addTagToSEO(tag.name);
                            }}
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
                          untuk menambah Tag baru.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* KOLOM KANAN */}
        <div className="flex flex-col gap-8">
          <div className="bg-white p-6 rounded-xl border shadow-sm">
            <h2 className="text-lg font-bold text-chester-text mb-4">
              Media Katalog
            </h2>
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
                    Foto Utama
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

          {!hasVariant && (
            <div className="bg-white p-6 rounded-xl border shadow-sm">
              <h2 className="text-lg font-bold text-chester-text mb-6">
                Harga & Inventaris
              </h2>
              <div className="flex flex-col gap-5">
                <div>
                  <label className="block text-sm font-bold mb-2">
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
                  <label className="block text-sm font-bold mb-2">
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
                    <label className="block text-sm font-bold mb-2">Stok</label>
                    <input
                      type="number"
                      name="stock"
                      value={formData.stock}
                      onChange={handleChange}
                      className="w-full border px-4 py-2.5 rounded-lg"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-bold mb-2">
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
                  <label className="block text-sm font-bold mb-2">SKU</label>
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

          <div className="bg-white p-6 rounded-xl border shadow-sm">
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
                  className="w-full border px-4 py-2.5 rounded-lg"
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
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleChange}
                  className="w-full border px-4 py-2.5 rounded-lg"
                >
                  <option value="">-- Pilih Kategori --</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                  Template Panduan Ukuran
                </label>
                <select
                  name="size_guide_id"
                  value={formData.size_guide_id}
                  onChange={handleChange}
                  className="w-full border px-4 py-2.5 rounded-lg"
                >
                  <option value="">-- Tanpa Panduan Ukuran --</option>
                  {sizeGuides.map((guide) => (
                    <option key={guide.id} value={guide.id}>
                      {guide.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
