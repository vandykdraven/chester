import { useState, useEffect } from "react";
import {
  Save,
  Plus,
  Trash2,
  CheckCircle,
  AlertCircle,
  Image as ImageIcon,
  Upload,
} from "lucide-react";

// KOREKSI 1: Gunakan master API dan Image Helper
import api from "../../api"; 
import { getImageUrl } from "../../utils/imageHelper";

export default function HomepageSettings() {
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadingIndex, setUploadingIndex] = useState(null); 
  const [uploadingCol, setUploadingCol] = useState(null); 
  const [customAlert, setCustomAlert] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const [heroBanners, setHeroBanners] = useState([""]);
  const [featuredCol1, setFeaturedCol1] = useState({
    image: "",
    title: "",
    linkText: "",
    linkUrl: "",
  });
  const [featuredCol2, setFeaturedCol2] = useState({
    image: "",
    title: "",
    linkText: "",
    linkUrl: "",
  });

  useEffect(() => {
    fetchHomepageSettings();
  }, []);

  const fetchHomepageSettings = async () => {
    setIsLoading(true);
    try {
      // KOREKSI 2: Panggil API menggunakan instance master
      const response = await api.get(`/settings`);
      if (response.data.success) {
        let apiData = response.data.data;
        if (Array.isArray(apiData)) {
          const mapped = {};
          apiData.forEach((i) => (mapped[i.setting_key] = i.setting_value));
          apiData = mapped;
        }

        if (apiData.hero_banners)
          setHeroBanners(JSON.parse(apiData.hero_banners));
        if (apiData.featured_collection_1)
          setFeaturedCol1(JSON.parse(apiData.featured_collection_1));
        if (apiData.featured_collection_2)
          setFeaturedCol2(JSON.parse(apiData.featured_collection_2));
      }
    } catch (e) {
      console.error("Gagal mengambil pengaturan beranda:", e);
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

  // =======================================================================
  // FUNGSIONAL UTAMA: LOGIKA SUBMIT FILE GAMBAR KE BACKEND
  // =======================================================================
  const handleImageUploadAsync = async (e, targetType, index = null) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validasi ukuran gambar maksimal 7MB
    if (file.size > 7 * 1024 * 1024) {
      showAlert("Ukuran file terlalu besar! Maksimal 7MB.", "error");
      return;
    }

    if (targetType === "banner") setUploadingIndex(index);
    if (targetType === "col1") setUploadingCol(1);
    if (targetType === "col2") setUploadingCol(2);

    const formData = new FormData();
    // Gunakan key 'galleryFile' sesuai dengan konfigurasi multer di backend
    formData.append("galleryFile", file); 

    try {
      // KOREKSI 3: Tembak ke endpoint gallery/upload yang valid
      const res = await api.post(`/gallery/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data.success) {
        // KOREKSI 4: Ekstraksi respons yang tepat dan gunakan helper
        const uploadedFilePath = res.data.data.file_path;
        const absoluteImageUrl = getImageUrl(uploadedFilePath);

        if (targetType === "banner") {
          const newBanners = [...heroBanners];
          newBanners[index] = absoluteImageUrl;
          setHeroBanners(newBanners);
        } else if (targetType === "col1") {
          setFeaturedCol1({ ...featuredCol1, image: absoluteImageUrl });
        } else if (targetType === "col2") {
          setFeaturedCol2({ ...featuredCol2, image: absoluteImageUrl });
        }
        showAlert("Gambar berhasil diunggah!", "success");
      }
    } catch (err) {
      console.error(err);
      showAlert(
        err.response?.data?.message || "Gagal mengunggah file gambar.",
        "error",
      );
    } finally {
      setUploadingIndex(null);
      setUploadingCol(null);
      // Reset input agar bisa upload file yang sama berkali-kali jika diperlukan
      e.target.value = ""; 
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload = {
        hero_banners: JSON.stringify(
          heroBanners.filter((url) => url.trim() !== ""),
        ),
        featured_collection_1: JSON.stringify(featuredCol1),
        featured_collection_2: JSON.stringify(featuredCol2),
      };

      // KOREKSI 5: Panggil API menggunakan instance master
      const res = await api.put(`/settings`, payload);
      if (res.data.success)
        showAlert("Tampilan Halaman Depan berhasil diperbarui!", "success");
    } catch (err) {
      showAlert("Gagal menyimpan perubahan.", "error");
    }
    setIsSaving(false);
  };

  if (isLoading)
    return (
      <div className="flex justify-center p-10">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-chester-pink border-t-transparent"></div>
      </div>
    );

  return (
    <div className="max-w-4xl mx-auto pb-12 relative font-geova">
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

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-chester-text mb-1">
          Pengaturan Halaman Depan
        </h1>
        <p className="text-sm text-gray-500">
          Sesuaikan banner slider dan kotak koleksi unggulan via upload file
          lokal maupun link web.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        {/* HERO BANNERS */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-800">
                Banner Slider Utama (Hero)
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Bisa tempel link gambar internet atau klik tombol Upload untuk
                memilih file dari komputer Anda.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setHeroBanners([...heroBanners, ""])}
              className="bg-gray-900 text-white px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-black transition"
            >
              <Plus size={14} /> Tambah Banner
            </button>
          </div>

          <div className="space-y-4">
            {heroBanners.map((url, idx) => (
              <div
                key={idx}
                className="flex gap-4 items-start p-4 border rounded-xl bg-gray-50/50"
              >
                <div className="w-28 aspect-[16/10] bg-gray-200 rounded border overflow-hidden flex-shrink-0 flex items-center justify-center relative">
                  {url ? (
                    <img
                      src={url}
                      alt={`Preview ${idx}`}
                      loading="lazy"
                      className="w-full h-full object-cover"
                      onError={(e) => (e.target.src = "/placeholder.png")}
                    />
                  ) : (
                    <ImageIcon size={24} className="text-gray-400" />
                  )}
                  {uploadingIndex === idx && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-xs font-bold">
                      Uploading...
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-2">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">
                      Link URL / Path Gambar Banner {idx + 1}
                    </label>
                    <input
                      type="text"
                      value={url}
                      onChange={(e) => {
                        const newArr = [...heroBanners];
                        newArr[idx] = e.target.value;
                        setHeroBanners(newArr);
                      }}
                      placeholder="Tempel link https://... atau klik upload di bawah"
                      className="w-full border px-3 py-2 text-sm rounded-lg outline-none focus:border-chester-pink bg-white"
                    />
                  </div>

                  {/* Input Upload Gambar File */}
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 text-gray-700 text-xs font-bold rounded-lg cursor-pointer hover:bg-gray-50 transition shadow-xs">
                      <Upload size={14} />
                      <span>Upload File Gambar</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) =>
                          handleImageUploadAsync(e, "banner", idx)
                        }
                      />
                    </label>
                  </div>
                </div>

                {heroBanners.length > 1 && (
                  <button
                    type="button"
                    onClick={() =>
                      setHeroBanners(heroBanners.filter((_, i) => i !== idx))
                    }
                    className="mt-1 p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* FEATURED COLLECTIONS */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-100 shadow-sm">
          <h2 className="text-lg font-bold text-gray-800 mb-1">
            Koleksi Unggulan
          </h2>
          <p className="text-xs text-gray-500 mb-6">
            Kelola gambar promosi banner dua kotak tengah.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Box Kiri */}
            <div className="border border-gray-200 rounded-xl p-5 bg-gray-50/30 relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-0 right-0 bg-gray-900 text-white text-[10px] px-2 py-0.5 font-bold rounded-bl-lg">
                Kotak Kiri
              </div>
              <div className="w-full aspect-[16/10] bg-gray-200 rounded border overflow-hidden mb-4 relative flex items-center justify-center">
                {featuredCol1.image ? (
                  <img
                    src={featuredCol1.image}
                    alt="Prev 1"
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ImageIcon className="text-gray-400" size={24} />
                )}
                {uploadingCol === 1 && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-xs font-bold">
                    Uploading...
                  </div>
                )}
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">
                    Link URL Gambar
                  </label>
                  <input
                    type="text"
                    value={featuredCol1.image}
                    onChange={(e) =>
                      setFeaturedCol1({
                        ...featuredCol1,
                        image: e.target.value,
                      })
                    }
                    className="w-full border px-3 py-2 text-sm rounded-lg outline-none focus:border-chester-pink bg-white"
                    placeholder="https://..."
                  />
                </div>
                <div className="pb-2">
                  <label className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 text-gray-700 text-xs font-bold rounded-lg cursor-pointer hover:bg-gray-50 transition shadow-xs w-max">
                    <Upload size={14} /> <span>Upload Gambar</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleImageUploadAsync(e, "col1")}
                    />
                  </label>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">
                    Judul Koleksi
                  </label>
                  <input
                    type="text"
                    value={featuredCol1.title}
                    onChange={(e) =>
                      setFeaturedCol1({
                        ...featuredCol1,
                        title: e.target.value,
                      })
                    }
                    className="w-full border px-3 py-2 text-sm rounded-lg outline-none focus:border-chester-pink font-bold bg-white"
                  />
                </div>
                <div className="flex gap-2">
                  <div className="w-1/2">
                    <label className="block text-xs font-bold text-gray-500 mb-1">
                      Teks Tombol
                    </label>
                    <input
                      type="text"
                      value={featuredCol1.linkText}
                      onChange={(e) =>
                        setFeaturedCol1({
                          ...featuredCol1,
                          linkText: e.target.value,
                        })
                      }
                      className="w-full border px-3 py-2 text-xs rounded-lg outline-none focus:border-chester-pink bg-white"
                    />
                  </div>
                  <div className="w-1/2">
                    <label className="block text-xs font-bold text-gray-500 mb-1">
                      URL Tujuan
                    </label>
                    <input
                      type="text"
                      value={featuredCol1.linkUrl}
                      onChange={(e) =>
                        setFeaturedCol1({
                          ...featuredCol1,
                          linkUrl: e.target.value,
                        })
                      }
                      placeholder="/products"
                      className="w-full border px-3 py-2 text-xs rounded-lg outline-none focus:border-chester-pink bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Box Kanan */}
            <div className="border border-gray-200 rounded-xl p-5 bg-gray-50/30 relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-0 right-0 bg-gray-900 text-white text-[10px] px-2 py-0.5 font-bold rounded-bl-lg">
                Kotak Kanan
              </div>
              <div className="w-full aspect-[16/10] bg-gray-200 rounded border overflow-hidden mb-4 relative flex items-center justify-center">
                {featuredCol2.image ? (
                  <img
                    src={featuredCol2.image}
                    alt="Prev 2"
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ImageIcon className="text-gray-400" size={24} />
                )}
                {uploadingCol === 2 && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-xs font-bold">
                    Uploading...
                  </div>
                )}
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">
                    Link URL Gambar
                  </label>
                  <input
                    type="text"
                    value={featuredCol2.image}
                    onChange={(e) =>
                      setFeaturedCol2({
                        ...featuredCol2,
                        image: e.target.value,
                      })
                    }
                    className="w-full border px-3 py-2 text-sm rounded-lg outline-none focus:border-chester-pink bg-white"
                    placeholder="https://..."
                  />
                </div>
                <div className="pb-2">
                  <label className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 text-gray-700 text-xs font-bold rounded-lg cursor-pointer hover:bg-gray-50 transition shadow-xs w-max">
                    <Upload size={14} /> <span>Upload Gambar</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleImageUploadAsync(e, "col2")}
                    />
                  </label>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">
                    Judul Koleksi
                  </label>
                  <input
                    type="text"
                    value={featuredCol2.title}
                    onChange={(e) =>
                      setFeaturedCol2({
                        ...featuredCol2,
                        title: e.target.value,
                      })
                    }
                    className="w-full border px-3 py-2 text-sm rounded-lg outline-none focus:border-chester-pink font-bold bg-white"
                  />
                </div>
                <div className="flex gap-2">
                  <div className="w-1/2">
                    <label className="block text-xs font-bold text-gray-500 mb-1">
                      Teks Tombol
                    </label>
                    <input
                      type="text"
                      value={featuredCol2.linkText}
                      onChange={(e) =>
                        setFeaturedCol2({
                          ...featuredCol2,
                          linkText: e.target.value,
                        })
                      }
                      className="w-full border px-3 py-2 text-xs rounded-lg outline-none focus:border-chester-pink bg-white"
                    />
                  </div>
                  <div className="w-1/2">
                    <label className="block text-xs font-bold text-gray-500 mb-1">
                      URL Tujuan
                    </label>
                    <input
                      type="text"
                      value={featuredCol2.linkUrl}
                      onChange={(e) =>
                        setFeaturedCol2({
                          ...featuredCol2,
                          linkUrl: e.target.value,
                        })
                      }
                      placeholder="/products"
                      className="w-full border px-3 py-2 text-xs rounded-lg outline-none focus:border-chester-pink bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="bg-chester-pink text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg hover:bg-pink-600 transition w-full md:w-auto justify-center cursor-pointer"
        >
          <Save size={20} />{" "}
          {isSaving ? "Menyimpan..." : "Simpan Perubahan Beranda"}
        </button>
      </form>
    </div>
  );
}