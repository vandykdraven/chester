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

  const [dbCategories] = useState([
    { id: "cat_1", name: "Atasan" },
    { id: "cat_2", name: "Bawahan" },
    { id: "cat_3", name: "Gaun & Dress" },
    { id: "cat_4", name: "Aksesoris" },
  ]);

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

  // Slot 0: Utama, Slot 1-4: Pendukung
  const [images, setImages] = useState([null, null, null, null, null]);
  const [wholesales, setWholesales] = useState([]);
  const [hasVariant, setHasVariant] = useState(false);
  const [variantTypes, setVariantTypes] = useState([
    { name: "Ukuran", options: ["S", "M", "L"] },
  ]);
  const [optionInputs, setOptionInputs] = useState({});
  const [variantMatrix, setVariantMatrix] = useState([]);

  // --- 1. MEMUAT SELEURUH DATA PRODUK DARI MYSQL ---
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

          // Rekonstruksi Gambar Lama dari Server
          const BASE_URL = import.meta.env.VITE_API_URL.replace("/api", "");
          const loadedImages = [null, null, null, null, null];

          const primaryImg = p.images.find((img) => img.is_primary === 1);
          if (primaryImg) {
            loadedImages[0] = {
              image_url: primaryImg.image_url,
              url: `${BASE_URL}${primaryImg.image_url}`,
              is_primary: true,
              isExisting: true,
            };
          }

          const supportingImgs = p.images.filter((img) => img.is_primary === 0);
          supportingImgs.forEach((img, index) => {
            if (index < 4) {
              loadedImages[index + 1] = {
                image_url: img.image_url,
                url: `${BASE_URL}${img.image_url}`,
                is_primary: false,
                isExisting: true,
              };
            }
          });
          setImages(loadedImages);

          if (quillInstance.current && p.description) {
            quillInstance.current.root.innerHTML = p.description;
          }
        }
      } catch (error) {
        console.error("Gagal memuat data produk:", error);
        showAlert("Gagal memuat data produk dari server", "error");
      } finally {
        setIsLoading(false);
      }
    };

    loadProductData();
  }, [id]);

  // --- 2. INISIALISASI QUILL EDITOR ---
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

    if (formData.description) {
      quillInstance.current.root.innerHTML = formData.description;
    }
  }, [isLoading]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // --- 3. LOGIKA DETEKSI UNGGRAH/EDIT FOTO LIVE ---
  const handleImageChange = (index, e) => {
    const file = e.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      const newImages = [...images];
      // Menyimpan file biner baru untuk diupload, serta menandai status primary-nya
      newImages[index] = {
        file: file,
        url: imageUrl,
        is_primary: index === 0,
        isExisting: false,
      };
      setImages(newImages);
    }
  };

  const removeImage = (index, e) => {
    e.preventDefault();
    const newImages = [...images];
    newImages[index] = null;
    setImages(newImages);
  };

  // --- 4. LOGIKA SIMPAN PERUBAHAN EDIT (SUBMIT MULTIPART FORMDATA) ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!images[0]) {
      showAlert("Foto utama produk tidak boleh kosong!", "error");
      return;
    }

    setIsSubmitting(true);

    try {
      const dataToSend = new FormData();

      // Kelompokkan file biner baru yang diunggah dari PC admin
      if (images[0].file) {
        dataToSend.append("primaryImage", images[0].file);
      }

      for (let i = 1; i <= 4; i++) {
        if (images[i] && images[i].file) {
          dataToSend.append("supportingImages", images[i].file);
        }
      }

      // Payload data teks dikirim bersamaan
      const payloadData = {
        ...formData,
        has_variant: hasVariant,
        variantTypes: hasVariant ? variantTypes : [],
        variantMatrix: hasVariant ? variantMatrix : [],
        wholesales,
        // Kirim penanda gambar lama yang dipertahankan admin ke backend
        existingImages: images.map((img) =>
          img && img.isExisting
            ? { image_url: img.image_url, is_primary: img.is_primary }
            : null,
        ),
      };

      dataToSend.append("data", JSON.stringify(payloadData));

      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/products/${id}`,
        dataToSend,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );

      if (response.data.success) {
        showAlert(
          "Berhasil! Perubahan produk dan media telah disimpan.",
          "success",
        );
        setTimeout(() => {
          setCustomAlert({ show: false, message: "", type: "success" });
          navigate("/admin/products");
        }, 2000);
      }
    } catch (error) {
      console.error("Gagal mengupdate produk:", error);
      showAlert("Terjadi kesalahan sistem saat menyimpan.", "error");
      setIsSubmitting(false);
    }
  };

  // --- 5. LOGIKA FORM MANAJEMEN GROSIR & VARIASI (SAMA PERSIS SEPERTI ADD) ---
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

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3 text-gray-500">
        <div className="h-8 w-8 border-4 border-chester-pink border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-semibold">
          Mengambil data produk lengkap...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto pb-12 relative">
      {/* CUSTOM TOAST ALERT MELAYANG */}
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

      {/* HEADER BAR */}
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Link
            to="/admin/products"
            className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600"
          >
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-bold text-chester-text">Edit Produk</h1>
        </div>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="bg-chester-pink text-white px-6 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-gray-900 transition shadow-sm"
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
                <div ref={editorRef} className="bg-white"></div>
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
                  Atur harga, stok, dan berat untuk setiap ukuran/warna.
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
              <div className="flex flex-col gap-6 border-t border-gray-100 pt-6">
                {variantTypes.map((vt, index) => (
                  <div
                    key={index}
                    className="flex flex-col gap-4 p-5 bg-gray-50 rounded-xl border border-gray-200 relative"
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
                        className="w-full border border-gray-300 px-3 py-2 rounded-lg text-sm"
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
                            className="bg-white border border-chester-pink text-chester-pink px-3 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-2 shadow-sm"
                          >
                            {opt}
                            <button
                              type="button"
                              onClick={() =>
                                handleRemoveOption(index, optIndex)
                              }
                              className="hover:text-red-500"
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
                          className="flex-1 border border-gray-300 px-3 py-2 rounded-lg text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddOption(index)}
                          className="bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-black"
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
                  <Plus size={16} /> Tambah Variasi Induk
                </button>

                {variantMatrix.length > 0 && (
                  <div className="mt-6 overflow-x-auto border border-gray-200 rounded-xl">
                    <table className="w-full text-left border-collapse min-w-[750px]">
                      <thead>
                        <tr className="bg-gray-100 text-xs text-gray-700 uppercase tracking-wider">
                          <th className="p-4 border-b border-gray-200 font-bold">
                            Kombinasi
                          </th>
                          <th className="p-4 border-b border-gray-200 font-bold w-28">
                            Harga (Rp)
                          </th>
                          <th className="p-4 border-b border-gray-200 font-bold w-28">
                            Coret (Rp)
                          </th>
                          <th className="p-4 border-b border-gray-200 font-bold w-24">
                            Stok
                          </th>
                          <th className="p-4 border-b border-gray-200 font-bold w-24">
                            Berat (gr)
                          </th>
                          <th className="p-4 border-b border-gray-200 font-bold w-32">
                            SKU
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white">
                        {variantMatrix.map((item, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="p-3 border-b border-gray-100 text-sm font-bold text-chester-pink">
                              {item.variant_key ||
                                item.combination?.join(" - ")}
                            </td>
                            <td className="p-3 border-b border-gray-100">
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
                                className="w-full p-2 border rounded-md text-sm"
                              />
                            </td>
                            <td className="p-3 border-b border-gray-100">
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
                                className="w-full p-2 border rounded-md text-sm"
                              />
                            </td>
                            <td className="p-3 border-b border-gray-100">
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
                                className="w-full p-2 border rounded-md text-sm"
                              />
                            </td>
                            <td className="p-3 border-b border-gray-100">
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
                                className="w-full p-2 border rounded-md text-sm"
                              />
                            </td>
                            <td className="p-3 border-b border-gray-100">
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
                                className="w-full p-2 border rounded-md text-sm"
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
                  className="flex gap-4 items-center bg-gray-50 p-3 rounded-lg border border-gray-200"
                >
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Minimal Qty
                    </label>
                    <input
                      type="number"
                      value={ws.minQty}
                      onChange={(e) =>
                        updateWholesale(index, "minQty", e.target.value)
                      }
                      className="w-full border border-gray-300 px-4 py-2 rounded-lg text-sm"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Harga (Rp)
                    </label>
                    <input
                      type="number"
                      value={ws.price}
                      onChange={(e) =>
                        updateWholesale(index, "price", e.target.value)
                      }
                      className="w-full border border-gray-300 px-4 py-2 rounded-lg text-sm"
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
                <Plus size={16} /> Tambah Ketentuan Grosir
              </button>
            </div>
          </div>

          {/* PENGATURAN SEO */}
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
                  className="w-full border border-gray-300 px-4 py-2.5 rounded-lg"
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
                  className="w-full border border-gray-300 px-4 py-3 rounded-lg resize-none"
                ></textarea>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Kata Kunci (Keywords)
                </label>
                <input
                  type="text"
                  name="seo_keywords"
                  value={formData.seo_keywords}
                  onChange={handleChange}
                  className="w-full border border-gray-300 px-4 py-2.5 rounded-lg"
                />
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="flex flex-col gap-8">
          {/* MEDIA PRODUK (LIVE UPDATE GAMBAR PC) */}
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <h2 className="text-lg font-bold text-chester-text mb-4">
              Media Produk
            </h2>
            <label className="relative border-2 border-dashed border-chester-pink bg-pink-50 rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-pink-100 transition group mb-4 aspect-square overflow-hidden">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleImageChange(0, e)}
              />
              {images[0] ? (
                <>
                  <img
                    src={images[0].url}
                    alt="Utama"
                    className="absolute inset-0 w-full h-full object-cover z-10"
                  />
                  <button
                    onClick={(e) => removeImage(0, e)}
                    className="absolute top-3 right-3 bg-white text-red-500 rounded p-1.5 shadow-md z-20 hover:bg-red-500 hover:text-white"
                  >
                    <Trash2 size={16} />
                  </button>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-3 shadow-sm">
                    <ImageIcon className="text-chester-pink" size={24} />
                  </div>
                  <p className="text-sm font-bold text-chester-text mb-1">
                    Foto Utama
                  </p>
                </>
              )}
            </label>

            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4].map((idx) => (
                <label
                  key={idx}
                  className="relative border-2 border-dashed border-gray-200 rounded-lg aspect-square flex flex-col items-center justify-center cursor-pointer hover:border-chester-pink hover:bg-pink-50 transition text-gray-400 overflow-hidden"
                >
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleImageChange(idx, e)}
                  />
                  {images[idx] ? (
                    <>
                      <img
                        src={images[idx].url}
                        alt="Pendukung"
                        className="absolute inset-0 w-full h-full object-cover z-10"
                      />
                      <button
                        onClick={(e) => removeImage(idx, e)}
                        className="absolute top-1 right-1 bg-white/80 text-red-500 rounded p-1 z-20"
                      >
                        <X size={12} />
                      </button>
                    </>
                  ) : (
                    <Plus size={20} />
                  )}
                </label>
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
                    className="w-full border border-gray-300 px-4 py-2.5 rounded-lg"
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
                    className="w-full border border-gray-300 px-4 py-2.5 rounded-lg"
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
                      className="w-full border border-gray-300 px-4 py-2.5 rounded-lg"
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
                      className="w-full border border-gray-300 px-4 py-2.5 rounded-lg"
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
                    className="w-full border border-gray-300 px-4 py-2.5 rounded-lg uppercase"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STATUS & KATEGORI */}
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <h2 className="text-lg font-bold text-chester-text mb-4">
              Status & Kategori
            </h2>
            <div className="flex flex-col gap-5">
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full border border-gray-300 px-4 py-2.5 rounded-lg bg-white"
              >
                <option value="available">Aktif</option>
                <option value="draft">Draf</option>
              </select>
              <select
                name="category_id"
                value={formData.category_id}
                onChange={handleChange}
                className="w-full border border-gray-300 px-4 py-2.5 rounded-lg bg-white"
              >
                <option value="">-- Pilih Kategori --</option>
                {dbCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
