import { useState, useEffect, useRef } from "react";
import {
  Settings as SettingsIcon,
  Store,
  Truck,
  CreditCard,
  Save,
  CheckCircle,
  AlertCircle,
  Users,
  UserCircle,
  Plus,
  Trash2,
  X,
  Search,
  MapPin,
  Bell,
  Landmark,
  Hash,
  User,
  Share2,
  Menu as MenuIcon,
  BarChart, // <-- TAMBAHAN: Ikon untuk Menu Integrasi
} from "lucide-react";
import axios from "axios";

export default function Settings() {
  const [activeTab, setActiveTab] = useState("general");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [customAlert, setCustomAlert] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const [areaQuery, setAreaQuery] = useState("");
  const [areaResults, setAreaResults] = useState([]);
  const [isSearchingArea, setIsSearchingArea] = useState(false);
  const [showAreaDropdown, setShowAreaDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // 1. STATE FORM PENGATURAN UMUM & NOTIFIKASI
  const [formData, setFormData] = useState({
    shop_name: "",
    shop_phone: "",
    store_area_id: "",
    shop_address: "",
    biteship_api_key: "",
    smtp_host: "",
    smtp_port: "",
    smtp_user: "",
    smtp_password: "",
    fonnte_api_key: "",
    social_facebook: "",
    social_instagram: "",
    social_tiktok: "",
    social_twitter: "",
    // --- TAMBAHAN: Field untuk Integrasi Tracking ---
    meta_pixel_id: "",
    google_analytics_id: "",
    gsc_verification_tag: "",
  });

  // STATE: Rekening Bank Multiple
  const [bankAccounts, setBankAccounts] = useState([
    { bank_name: "", bank_account: "", bank_owner: "" },
  ]);

  // STATE BARU: Khusus untuk Navigasi
  const [categories, setCategories] = useState([]);
  const [activeMenus, setActiveMenus] = useState([]);

  const [admins, setAdmins] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAdmin, setNewAdmin] = useState({
    fullname: "",
    email: "",
    password: "",
    role: "Editor",
  });

  const [profileData, setProfileData] = useState({
    id: "",
    fullname: "",
    email: "",
    currentPassword: "",
    newPassword: "",
  });

  useEffect(() => {
    initPage();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowAreaDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const initPage = async () => {
    setIsLoading(true);
    await Promise.all([fetchSettings(), fetchAdmins(), fetchCategories()]);
    loadCurrentLoggedInAdmin();
    setIsLoading(false);
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/categories`,
      );
      if (response.data.success) {
        setCategories(response.data.data);
      }
    } catch (e) {
      console.error("Gagal mengambil data kategori:", e);
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/settings`,
      );
      if (response.data.success) {
        const apiData = response.data.data;

        // Memasukkan data ke form standar
        setFormData((prev) => ({ ...prev, ...apiData }));

        // Parsing data rekening bank
        if (apiData.payment_accounts) {
          try {
            setBankAccounts(JSON.parse(apiData.payment_accounts));
          } catch (e) {
            console.error("Gagal parse data rekening:", e);
          }
        }

        // Parsing data navigasi menu frontend
        if (apiData.frontend_active_menus) {
          try {
            setActiveMenus(JSON.parse(apiData.frontend_active_menus));
          } catch (e) {
            console.error("Gagal parse data navigasi:", e);
          }
        }

        if (apiData.store_area_id) {
          setAreaQuery(apiData.store_area_id);
        }
      }
    } catch (e) {
      console.error("Gagal mengambil pengaturan:", e);
    }
  };

  const fetchAdmins = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/admins`,
      );
      if (response.data.success) setAdmins(response.data.data);
    } catch (e) {
      console.error(e);
    }
  };

  const loadCurrentLoggedInAdmin = () => {
    let savedAdmin = JSON.parse(localStorage.getItem("admin"));
    if (!savedAdmin || !savedAdmin.id) {
      savedAdmin = {
        id: 1,
        fullname: "Administrator",
        email: "admin@chester.com",
      };
      localStorage.setItem("admin", JSON.stringify(savedAdmin));
    }
    setProfileData((prev) => ({
      ...prev,
      id: savedAdmin.id,
      fullname: savedAdmin.fullname,
      email: savedAdmin.email,
    }));
  };

  const showAlert = (message, type = "success") => {
    setCustomAlert({ show: true, message, type });
    setTimeout(
      () => setCustomAlert({ show: false, message: "", type: "success" }),
      3000,
    );
  };

  const handleAreaSearchChange = async (e) => {
    const keyword = e.target.value;
    setAreaQuery(keyword);
    setFormData((prev) => ({ ...prev, store_area_id: "" }));

    if (keyword.length < 3) {
      setAreaResults([]);
      setShowAreaDropdown(false);
      return;
    }

    setIsSearchingArea(true);
    setShowAreaDropdown(true);

    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/shipping/areas?search=${keyword}`,
      );
      if (res.data.success) {
        setAreaResults(res.data.data);
      }
    } catch (error) {
      console.error("Gagal mencari area:", error);
    } finally {
      setIsSearchingArea(false);
    }
  };

  const handleSelectArea = (area) => {
    setFormData({ ...formData, store_area_id: area.id });
    setAreaQuery(area.name);
    setShowAreaDropdown(false);
  };

  const handleChangeSetting = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleChangeNewAdmin = (e) =>
    setNewAdmin({ ...newAdmin, [e.target.name]: e.target.value });
  const handleChangeProfile = (e) =>
    setProfileData({ ...profileData, [e.target.name]: e.target.value });

  // HANDLER REKENING MULTIPLE
  const handleAccountChange = (index, field, value) => {
    const updatedAccounts = [...bankAccounts];
    updatedAccounts[index][field] = value;
    setBankAccounts(updatedAccounts);
  };

  const addBankAccount = () => {
    setBankAccounts([
      ...bankAccounts,
      { bank_name: "", bank_account: "", bank_owner: "" },
    ]);
  };

  const removeBankAccount = (index) => {
    const updatedAccounts = bankAccounts.filter((_, i) => i !== index);
    setBankAccounts(updatedAccounts);
  };

  // HANDLER NAVIGASI MENU
  const toggleActiveMenu = (categoryId) => {
    setActiveMenus((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId],
    );
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    if (activeTab === "general" && !formData.store_area_id) {
      showAlert(
        "Harap pilih Area ID Pengiriman dari hasil pencarian!",
        "error",
      );
      return;
    }

    setIsSaving(true);
    try {
      const payloadToSave = {
        ...formData,
        payment_accounts: JSON.stringify(bankAccounts),
        frontend_active_menus: JSON.stringify(activeMenus),
      };

      const res = await axios.put(
        `${import.meta.env.VITE_API_URL}/settings`,
        payloadToSave,
      );
      if (res.data.success)
        showAlert("Pengaturan berhasil disimpan!", "success");
    } catch (err) {
      showAlert("Gagal menyimpan.", "error");
    }
    setIsSaving(false);
  };

  const handleAddAdmin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/admins`,
        newAdmin,
      );
      if (res.data.success) {
        showAlert(res.data.message, "success");
        setNewAdmin({ fullname: "", email: "", password: "", role: "Editor" });
        setShowAddForm(false);
        fetchAdmins();
      }
    } catch (err) {
      showAlert(
        err.response?.data?.message || "Gagal menambah admin.",
        "error",
      );
    }
  };

  const handleDeleteAdmin = async (id, name) => {
    if (
      !window.confirm(
        `Apakah Anda yakin ingin menghapus akses admin untuk ${name}?`,
      )
    )
      return;
    try {
      const res = await axios.delete(
        `${import.meta.env.VITE_API_URL}/admins/${id}`,
      );
      if (res.data.success) {
        showAlert(res.data.message, "success");
        fetchAdmins();
      }
    } catch (err) {
      showAlert(err.response?.data?.message || "Gagal menghapus.", "error");
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.put(
        `${import.meta.env.VITE_API_URL}/admins/profile`,
        profileData,
      );
      if (res.data.success) {
        showAlert(res.data.message, "success");
        const currentLocal = JSON.parse(localStorage.getItem("admin")) || {};
        localStorage.setItem(
          "admin",
          JSON.stringify({ ...currentLocal, fullname: profileData.fullname }),
        );
        setProfileData((prev) => ({
          ...prev,
          currentPassword: "",
          newPassword: "",
        }));
      }
    } catch (err) {
      showAlert(
        err.response?.data?.message || "Gagal memperbarui profil.",
        "error",
      );
    }
  };

  const TabButton = ({ id, icon, label }) => (
    <button
      type="button"
      onClick={() => setActiveTab(id)}
      className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition-colors ${
        activeTab === id
          ? "bg-pink-50 text-chester-pink"
          : "text-gray-600 hover:bg-gray-50"
      }`}
    >
      {icon} {label}
    </button>
  );

  if (isLoading)
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="h-8 w-8 border-4 border-chester-pink border-t-transparent rounded-full animate-spin"></div>
      </div>
    );

  return (
    <div className="max-w-6xl mx-auto pb-12 relative">
      {/* ALERTS */}
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

      {/* HEADER */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-chester-text mb-1 flex items-center gap-2">
          <SettingsIcon size={24} className="text-chester-pink" /> Pengaturan
          Sistem
        </h1>
        <p className="text-sm text-gray-500">
          Konfigurasi operasional toko, integrasi logistik, notifikasi otomatis,
          serta manajemen otorisasi staf.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 lg:gap-8">
        {/* SIDEBAR TABS */}
        <div className="md:col-span-1 flex flex-col gap-1">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider px-4 mb-2 mt-2">
            Sistem Toko
          </div>
          <TabButton
            id="general"
            icon={<Store size={18} />}
            label="Informasi Toko"
          />
          <TabButton
            id="navigation"
            icon={<MenuIcon size={18} />}
            label="Navigasi Website"
          />
          <TabButton
            id="shipping"
            icon={<Truck size={18} />}
            label="API Logistik"
          />
          <TabButton
            id="notification"
            icon={<Bell size={18} />}
            label="Notifikasi (Email & WA)"
          />
          <TabButton
            id="payment"
            icon={<CreditCard size={18} />}
            label="Pembayaran"
          />

          {/* --- TAMBAHAN: TAB INTEGRASI & TRACKING --- */}
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider px-4 mb-2 mt-6">
            Marketing & SEO
          </div>
          <TabButton
            id="integration"
            icon={<BarChart size={18} />}
            label="Integrasi & Pelacakan"
          />

          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider px-4 mb-2 mt-6">
            Akun & Staf
          </div>
          <TabButton
            id="staff"
            icon={<Users size={18} />}
            label="Kelola Staf"
          />
          <TabButton
            id="profile"
            icon={<UserCircle size={18} />}
            label="Profil Saya"
          />
        </div>

        {/* CONTENT AREA */}
        <div className="md:col-span-3">
          {/* TAB 1: INFORMASI TOKO */}
          {activeTab === "general" && (
            <form
              onSubmit={handleSaveSettings}
              className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-100 shadow-sm min-h-[400px] animate-fade-in flex flex-col gap-6"
            >
              <div>
                <h2 className="text-lg font-bold text-gray-800 mb-1">
                  Informasi Dasar Toko
                </h2>
                <p className="text-xs text-gray-500">
                  Data ini digunakan untuk keperluan struk dan lokasi awal
                  pengiriman (Origin).
                </p>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Nama Toko
                </label>
                <input
                  type="text"
                  name="shop_name"
                  value={formData.shop_name || ""}
                  onChange={handleChangeSetting}
                  className="w-full border px-4 py-2.5 rounded-lg focus:border-chester-pink outline-none"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="w-full">
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Nomor WhatsApp (CS)
                  </label>
                  <input
                    type="text"
                    name="shop_phone"
                    value={formData.shop_phone || ""}
                    onChange={handleChangeSetting}
                    className="w-full border px-4 py-2.5 rounded-lg focus:border-chester-pink outline-none"
                  />
                </div>
                {/* FORM PENCARIAN AREA ID BITESHIP */}
                <div className="w-full relative" ref={dropdownRef}>
                  <label className="block text-sm font-bold text-gray-700 mb-2 text-chester-pink flex items-center gap-1">
                    Area ID Pengiriman (Origin){" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={areaQuery}
                      onChange={handleAreaSearchChange}
                      onFocus={() => {
                        if (areaResults.length > 0) setShowAreaDropdown(true);
                      }}
                      placeholder="Ketik nama kecamatan..."
                      className="w-full border px-4 py-2.5 pl-10 rounded-lg focus:border-chester-pink outline-none border-pink-200 bg-pink-50/20 text-sm"
                    />
                    <Search
                      className="absolute left-3 top-3 text-pink-400"
                      size={18}
                    />
                  </div>
                  {showAreaDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white border rounded-xl shadow-xl max-h-60 overflow-y-auto">
                      {isSearchingArea ? (
                        <div className="p-4 text-center text-sm text-gray-500">
                          Sedang mencari lokasi...
                        </div>
                      ) : areaResults.length > 0 ? (
                        <ul className="py-2">
                          {areaResults.map((area) => (
                            <li
                              key={area.id}
                              onClick={() => handleSelectArea(area)}
                              className="px-4 py-3 hover:bg-pink-50 cursor-pointer flex items-start gap-3 border-b last:border-0 transition"
                            >
                              <MapPin
                                size={18}
                                className="text-chester-pink mt-0.5 shrink-0"
                              />
                              <div>
                                <p className="text-sm font-bold text-gray-800 leading-tight">
                                  {area.name}
                                </p>
                                <p className="text-[10px] text-gray-400 font-mono mt-1">
                                  ID: {area.id}
                                </p>
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        areaQuery.length >= 3 && (
                          <div className="p-4 text-center text-sm text-gray-500">
                            Lokasi tidak ditemukan.
                          </div>
                        )
                      )}
                    </div>
                  )}
                  {areaQuery &&
                    !formData.store_area_id &&
                    !showAreaDropdown && (
                      <p className="text-[10px] text-red-500 mt-1 font-bold">
                        ⚠️ Harap pilih lokasi dari daftar rekomendasi.
                      </p>
                    )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Alamat Fisik Toko
                </label>
                <textarea
                  name="shop_address"
                  value={formData.shop_address || ""}
                  onChange={handleChangeSetting}
                  rows="3"
                  className="w-full border px-4 py-3 rounded-lg focus:border-chester-pink outline-none resize-none"
                  placeholder="Nama jalan, gedung, RT/RW..."
                ></textarea>
              </div>

              {/* INPUT MEDIA SOSIAL */}
              <div className="pt-6 border-t border-gray-100">
                <div className="flex items-center gap-2 mb-4">
                  <Share2 className="text-gray-400" size={18} />
                  <h3 className="text-sm font-bold text-gray-800">
                    Tautan Media Sosial
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">
                      Facebook URL
                    </label>
                    <input
                      type="url"
                      name="social_facebook"
                      value={formData.social_facebook || ""}
                      onChange={handleChangeSetting}
                      placeholder="https://facebook.com/..."
                      className="w-full border px-3 py-2 rounded-lg text-sm outline-none focus:border-chester-pink"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">
                      Instagram URL
                    </label>
                    <input
                      type="url"
                      name="social_instagram"
                      value={formData.social_instagram || ""}
                      onChange={handleChangeSetting}
                      placeholder="https://instagram.com/..."
                      className="w-full border px-3 py-2 rounded-lg text-sm outline-none focus:border-chester-pink"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">
                      TikTok URL
                    </label>
                    <input
                      type="url"
                      name="social_tiktok"
                      value={formData.social_tiktok || ""}
                      onChange={handleChangeSetting}
                      placeholder="https://tiktok.com/@..."
                      className="w-full border px-3 py-2 rounded-lg text-sm outline-none focus:border-chester-pink"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">
                      Twitter / X URL
                    </label>
                    <input
                      type="url"
                      name="social_twitter"
                      value={formData.social_twitter || ""}
                      onChange={handleChangeSetting}
                      placeholder="https://twitter.com/..."
                      className="w-full border px-3 py-2 rounded-lg text-sm outline-none focus:border-chester-pink"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="bg-chester-pink text-white px-6 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 w-max shadow-sm mt-2"
              >
                <Save size={18} /> Simpan Pengaturan
              </button>
            </form>
          )}

          {/* TAB BARU: NAVIGASI WEBSITE */}
          {activeTab === "navigation" && (
            <form
              onSubmit={handleSaveSettings}
              className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-100 shadow-sm min-h-[400px] animate-fade-in flex flex-col gap-6"
            >
              <div>
                <h2 className="text-lg font-bold text-gray-800 mb-1">
                  Navigasi Website (Menu Frontend)
                </h2>
                <p className="text-xs text-gray-500">
                  Centang kategori produk yang ingin Anda tampilkan sebagai menu
                  di header (navbar) pengunjung. Menu "Beranda" dan "Katalog"
                  akan selalu tampil secara default.
                </p>
              </div>

              <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <div className="bg-gray-50 px-5 py-3 border-b border-gray-200 flex justify-between items-center">
                  <span className="text-sm font-bold text-gray-700">
                    Daftar Kategori Tersedia
                  </span>
                  <span className="text-xs text-chester-pink font-bold bg-pink-50 px-2 py-1 rounded">
                    {activeMenus.length} Menu Terpilih
                  </span>
                </div>
                <div className="p-5 flex flex-col gap-4">
                  {categories.length === 0 ? (
                    <p className="text-sm text-gray-500 italic text-center py-4">
                      Belum ada kategori produk yang dibuat.
                    </p>
                  ) : (
                    categories.map((cat) => (
                      <label
                        key={cat.id}
                        className="flex items-center gap-3 cursor-pointer group w-max"
                      >
                        <input
                          type="checkbox"
                          checked={activeMenus.includes(cat.id)}
                          onChange={() => toggleActiveMenu(cat.id)}
                          className="w-4 h-4 accent-chester-pink cursor-pointer rounded border-gray-300"
                        />
                        <span
                          className={`text-sm font-medium transition ${activeMenus.includes(cat.id) ? "text-chester-pink font-bold" : "text-gray-700 group-hover:text-chester-pink"}`}
                        >
                          {cat.name}
                        </span>
                      </label>
                    ))
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="bg-chester-pink text-white px-6 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 w-max shadow-sm"
              >
                <Save size={18} /> Simpan Navigasi
              </button>
            </form>
          )}

          {/* TAB 3: BITESHIP */}
          {activeTab === "shipping" && (
            <form
              onSubmit={handleSaveSettings}
              className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-100 shadow-sm min-h-[400px] animate-fade-in flex flex-col gap-6"
            >
              <div>
                <h2 className="text-lg font-bold text-gray-800 mb-1">
                  Integrasi Logistik Biteship
                </h2>
                <p className="text-xs text-gray-500">
                  Masukkan API Key dari dashboard Biteship Anda.
                </p>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  API Key Biteship
                </label>
                <input
                  type="password"
                  name="biteship_api_key"
                  value={formData.biteship_api_key || ""}
                  onChange={handleChangeSetting}
                  placeholder="Paste API Key Biteship Anda di sini..."
                  className="w-full border px-4 py-2.5 rounded-lg font-mono text-sm outline-none focus:border-chester-pink bg-gray-50"
                />
              </div>
              <button
                type="submit"
                disabled={isSaving}
                className="bg-chester-pink text-white px-6 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 w-max shadow-sm"
              >
                <Save size={18} /> Simpan API Logistik
              </button>
            </form>
          )}

          {/* TAB 4: NOTIFIKASI */}
          {activeTab === "notification" && (
            <form
              onSubmit={handleSaveSettings}
              className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-100 shadow-sm min-h-[400px] animate-fade-in flex flex-col gap-6"
            >
              <div>
                <h2 className="text-lg font-bold text-gray-800 mb-1">
                  Gateway Notifikasi
                </h2>
                <p className="text-xs text-gray-500">
                  Pengaturan untuk mengirim email dan WhatsApp otomatis.
                </p>
              </div>
              <div className="pb-6 border-b border-gray-100">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Fonnte API Key (WhatsApp Gateway)
                </label>
                <input
                  type="password"
                  name="fonnte_api_key"
                  value={formData.fonnte_api_key || ""}
                  onChange={handleChangeSetting}
                  placeholder="Masukkan Token dari Fonnte..."
                  className="w-full border px-4 py-2.5 rounded-lg font-mono text-sm outline-none focus:border-chester-pink bg-gray-50"
                />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                  Konfigurasi Email SMTP
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-2">
                      SMTP Host
                    </label>
                    <input
                      type="text"
                      name="smtp_host"
                      value={formData.smtp_host || ""}
                      onChange={handleChangeSetting}
                      placeholder="contoh: smtp.gmail.com"
                      className="w-full border px-4 py-2.5 rounded-lg text-sm outline-none focus:border-chester-pink"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-2">
                      SMTP Port
                    </label>
                    <input
                      type="text"
                      name="smtp_port"
                      value={formData.smtp_port || ""}
                      onChange={handleChangeSetting}
                      placeholder="contoh: 465 atau 587"
                      className="w-full border px-4 py-2.5 rounded-lg text-sm outline-none focus:border-chester-pink"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-2">
                      Username / Email
                    </label>
                    <input
                      type="email"
                      name="smtp_user"
                      value={formData.smtp_user || ""}
                      onChange={handleChangeSetting}
                      placeholder="email.toko@gmail.com"
                      className="w-full border px-4 py-2.5 rounded-lg text-sm outline-none focus:border-chester-pink"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-2">
                      Password / App Password
                    </label>
                    <input
                      type="password"
                      name="smtp_password"
                      value={formData.smtp_password || ""}
                      onChange={handleChangeSetting}
                      placeholder="Masukkan kata sandi..."
                      className="w-full border px-4 py-2.5 rounded-lg text-sm outline-none focus:border-chester-pink"
                    />
                  </div>
                </div>
              </div>
              <button
                type="submit"
                disabled={isSaving}
                className="bg-chester-pink text-white px-6 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 w-max shadow-sm mt-4"
              >
                <Save size={18} /> Simpan Pengaturan
              </button>
            </form>
          )}

          {/* TAB 5: PEMBAYARAN */}
          {activeTab === "payment" && (
            <form
              onSubmit={handleSaveSettings}
              className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-100 shadow-sm min-h-[400px] animate-fade-in flex flex-col gap-6"
            >
              <div className="flex justify-between items-end">
                <div>
                  <h2 className="text-lg font-bold text-gray-800 mb-1">
                    Rekening Pembayaran Toko
                  </h2>
                  <p className="text-xs text-gray-500">
                    Anda dapat menambahkan lebih dari satu rekening tujuan
                    transfer untuk pelanggan.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addBankAccount}
                  className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-black transition"
                >
                  <Plus size={16} /> Tambah Rekening
                </button>
              </div>

              <div className="space-y-6">
                {bankAccounts.map((account, index) => (
                  <div
                    key={index}
                    className="p-5 border border-gray-200 rounded-xl bg-gray-50 relative animate-fade-in"
                  >
                    {bankAccounts.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeBankAccount(index)}
                        className="absolute top-4 right-4 p-2 bg-white text-red-500 hover:bg-red-50 rounded-lg shadow-sm transition"
                        title="Hapus Rekening Ini"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}

                    <h3 className="font-bold text-sm text-gray-700 mb-4">
                      Data Rekening ke-{index + 1}
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-gray-500">
                          Nama Bank Tujuan
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={account.bank_name}
                            onChange={(e) =>
                              handleAccountChange(
                                index,
                                "bank_name",
                                e.target.value,
                              )
                            }
                            placeholder="Contoh: BANK BCA, BANK MANDIRI"
                            className="w-full border px-4 py-2.5 pl-10 rounded-lg outline-none focus:border-chester-pink text-sm uppercase"
                          />
                          <Landmark
                            size={16}
                            className="absolute left-3.5 top-3 text-gray-400"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-gray-500">
                          Nomor Rekening
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={account.bank_account}
                            onChange={(e) =>
                              handleAccountChange(
                                index,
                                "bank_account",
                                e.target.value,
                              )
                            }
                            placeholder="Contoh: 7310244555"
                            className="w-full border px-4 py-2.5 pl-10 rounded-lg outline-none focus:border-chester-pink text-sm font-mono tracking-wider"
                          />
                          <Hash
                            size={16}
                            className="absolute left-3.5 top-3 text-gray-400"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5 md:col-span-2">
                        <label className="block text-xs font-bold text-gray-500">
                          Atas Nama (Pemilik Rekening)
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={account.bank_owner}
                            onChange={(e) =>
                              handleAccountChange(
                                index,
                                "bank_owner",
                                e.target.value,
                              )
                            }
                            placeholder="Contoh: PT Chester Busana Indonesia"
                            className="w-full border px-4 py-2.5 pl-10 rounded-lg outline-none focus:border-chester-pink text-sm"
                          />
                          <User
                            size={16}
                            className="absolute left-3.5 top-3 text-gray-400"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-100 pt-4 mt-2">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="bg-chester-pink text-white px-6 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 w-max shadow-sm"
                >
                  <Save size={18} /> Simpan Data Rekening
                </button>
              </div>
            </form>
          )}

          {/* --- TAMBAHAN: TAB 8 INTEGRASI & PELACAKAN --- */}
          {activeTab === "integration" && (
            <form
              onSubmit={handleSaveSettings}
              className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-100 shadow-sm min-h-[400px] animate-fade-in flex flex-col gap-6"
            >
              <div>
                <h2 className="text-lg font-bold text-gray-800 mb-1">
                  Integrasi Marketing & SEO
                </h2>
                <p className="text-xs text-gray-500">
                  Masukkan ID atau Tag verifikasi Anda di sini. Script akan
                  secara otomatis ditambahkan ke toko online Anda tanpa perlu
                  mengubah kode secara manual.
                </p>
              </div>

              {/* Meta Pixel */}
              <div className="p-5 border border-gray-200 rounded-xl bg-gray-50">
                <label className="block text-sm font-bold text-gray-800 mb-2">
                  Meta Pixel ID
                </label>
                <input
                  type="text"
                  name="meta_pixel_id"
                  value={formData.meta_pixel_id || ""}
                  onChange={handleChangeSetting}
                  placeholder="Contoh: 123456789012345"
                  className="w-full border px-4 py-2.5 rounded-lg font-mono text-sm outline-none focus:border-chester-pink bg-white"
                />
                <p className="text-[11px] text-gray-500 mt-2">
                  Digunakan untuk melacak pengunjung dari Facebook dan Instagram
                  Ads. Hanya masukkan angka ID-nya saja, bukan seluruh kodenya.
                </p>
              </div>

              {/* Google Analytics */}
              <div className="p-5 border border-gray-200 rounded-xl bg-gray-50">
                <label className="block text-sm font-bold text-gray-800 mb-2">
                  Google Analytics Measurement ID (GA4)
                </label>
                <input
                  type="text"
                  name="google_analytics_id"
                  value={formData.google_analytics_id || ""}
                  onChange={handleChangeSetting}
                  placeholder="Contoh: G-XXXXXXXXXX"
                  className="w-full border px-4 py-2.5 rounded-lg font-mono text-sm outline-none focus:border-chester-pink bg-white uppercase"
                />
                <p className="text-[11px] text-gray-500 mt-2">
                  Digunakan untuk Google Ads dan Analitik. Masukkan kode yang
                  diawali dengan awalan 'G-' atau 'AW-'.
                </p>
              </div>

              {/* Google Search Console */}
              <div className="p-5 border border-gray-200 rounded-xl bg-gray-50">
                <label className="block text-sm font-bold text-gray-800 mb-2">
                  Google Search Console (Tag Verifikasi HTML)
                </label>
                <input
                  type="text"
                  name="gsc_verification_tag"
                  value={formData.gsc_verification_tag || ""}
                  onChange={handleChangeSetting}
                  placeholder="Contoh: abcdefghijklmnopqrstuvwxyz123456789"
                  className="w-full border px-4 py-2.5 rounded-lg font-mono text-sm outline-none focus:border-chester-pink bg-white"
                />
                <p className="text-[11px] text-gray-500 mt-2">
                  Digunakan untuk verifikasi kepemilikan domain di Google Search
                  Console. Copy bagian &lt;content="..."&gt; dari tag meta yang
                  diberikan Google.
                </p>
              </div>

              <div className="border-t border-gray-100 pt-4 mt-2">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="bg-chester-pink text-white px-6 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 w-max shadow-sm"
                >
                  <Save size={18} /> Simpan Integrasi
                </button>
              </div>
            </form>
          )}

          {/* TAB 6: KELOLA STAF */}
          {activeTab === "staff" && (
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-100 shadow-sm min-h-[400px] animate-fade-in flex flex-col gap-6">
              <div className="flex justify-between items-end">
                <div>
                  <h2 className="text-lg font-bold text-gray-800 mb-1">
                    Manajemen Staf & Hak Akses
                  </h2>
                  <p className="text-xs text-gray-500">
                    Daftar personel yang berwenang mengelola admin panel toko.
                  </p>
                </div>
                <button
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-black transition"
                >
                  {showAddForm ? <X size={16} /> : <Plus size={16} />}{" "}
                  {showAddForm ? "Batal" : "Tambah Staf"}
                </button>
              </div>

              {showAddForm && (
                <form
                  onSubmit={handleAddAdmin}
                  className="p-5 bg-gray-50 rounded-xl border border-gray-200 flex flex-col gap-4 animate-fade-in"
                >
                  <h3 className="font-bold text-sm text-gray-700">
                    Formulir Akun Staf Baru
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <input
                      type="text"
                      name="fullname"
                      value={newAdmin.fullname}
                      onChange={handleChangeNewAdmin}
                      placeholder="Nama Lengkap Staf"
                      required
                      className="bg-white border px-3 py-2 rounded-lg text-sm outline-none focus:border-chester-pink"
                    />
                    <input
                      type="email"
                      name="email"
                      value={newAdmin.email}
                      onChange={handleChangeNewAdmin}
                      placeholder="Alamat Email Login"
                      required
                      className="bg-white border px-3 py-2 rounded-lg text-sm outline-none focus:border-chester-pink"
                    />
                    <input
                      type="password"
                      name="password"
                      value={newAdmin.password}
                      onChange={handleChangeNewAdmin}
                      placeholder="Password Mula-mula"
                      required
                      className="bg-white border px-3 py-2 rounded-lg text-sm outline-none focus:border-chester-pink"
                    />
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-xs text-gray-500 font-bold">
                        Role Hak Akses:
                      </span>
                      <select
                        name="role"
                        value={newAdmin.role}
                        onChange={handleChangeNewAdmin}
                        className="border px-2 py-1 bg-white rounded-md text-xs font-semibold outline-none"
                      >
                        <option value="Editor">
                          Editor (Kelola Produk/Pesanan)
                        </option>
                        <option value="Superadmin">
                          Superadmin (Akses Penuh)
                        </option>
                      </select>
                    </div>
                    <button
                      type="submit"
                      className="bg-chester-pink text-white px-4 py-1.5 rounded-lg text-xs font-bold shadow-sm"
                    >
                      Daftarkan Staf
                    </button>
                  </div>
                </form>
              )}

              <div className="border rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 border-b text-xs text-gray-500 uppercase font-bold">
                    <tr>
                      <th className="p-4">Nama</th>
                      <th className="p-4">Email</th>
                      <th className="p-4">Role</th>
                      <th className="p-4 text-center w-20">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-sm">
                    {admins.map((admin) => (
                      <tr key={admin.id} className="hover:bg-gray-50/50">
                        <td className="p-4 font-bold text-gray-800">
                          {admin.fullname}{" "}
                          {admin.id === profileData.id && (
                            <span className="text-[10px] bg-gray-100 border text-gray-500 px-1.5 py-0.5 rounded-full ml-1.5 font-normal">
                              Anda
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-gray-600">{admin.email}</td>
                        <td className="p-4">
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-bold border ${admin.role === "Superadmin" ? "bg-purple-50 text-purple-600 border-purple-200" : "bg-blue-50 text-blue-600 border-blue-200"}`}
                          >
                            {admin.role}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          {admin.id !== 1 && admin.id !== profileData.id && (
                            <button
                              onClick={() =>
                                handleDeleteAdmin(admin.id, admin.fullname)
                              }
                              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 7: PROFIL SAYA */}
          {activeTab === "profile" && (
            <form
              onSubmit={handleSaveProfile}
              className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-100 shadow-sm min-h-[400px] animate-fade-in flex flex-col gap-6"
            >
              <div>
                <h2 className="text-lg font-bold text-gray-800 mb-1">
                  Keamanan & Profil Personal
                </h2>
                <p className="text-xs text-gray-500">
                  Perbarui informasi identitas akun login pribadi Anda.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="w-full">
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Nama Lengkap Anda
                  </label>
                  <input
                    type="text"
                    name="fullname"
                    value={profileData.fullname}
                    onChange={handleChangeProfile}
                    required
                    className="w-full border px-4 py-2.5 rounded-lg outline-none focus:border-chester-pink"
                  />
                </div>
                <div className="w-full">
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Alamat Email (Permanen)
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={profileData.email}
                    disabled
                    className="w-full border px-4 py-2.5 rounded-lg bg-gray-50 text-gray-400 cursor-not-allowed"
                  />
                </div>
              </div>
              <div className="pt-4 border-t mt-2">
                <h3 className="font-bold text-sm text-gray-800 mb-1">
                  Form Ganti Kata Sandi
                </h3>
                <p className="text-xs text-gray-400 mb-4">
                  Biarkan kedua kolom ini kosong jika Anda hanya ingin mengubah
                  nama saja.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="w-full">
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Kata Sandi Saat Ini
                    </label>
                    <input
                      type="password"
                      name="currentPassword"
                      value={profileData.currentPassword}
                      onChange={handleChangeProfile}
                      placeholder="Ketik sandi sekarang"
                      className="w-full border px-4 py-2.5 rounded-lg outline-none focus:border-chester-pink"
                    />
                  </div>
                  <div className="w-full">
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Kata Sandi Baru
                    </label>
                    <input
                      type="password"
                      name="newPassword"
                      value={profileData.newPassword}
                      onChange={handleChangeProfile}
                      placeholder="Minimal 6 karakter"
                      className="w-full border px-4 py-2.5 rounded-lg outline-none focus:border-chester-pink"
                    />
                  </div>
                </div>
              </div>
              <button
                type="submit"
                className="bg-gray-900 text-white px-6 py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 w-max shadow-sm hover:bg-black transition"
              >
                <Save size={18} /> Perbarui Profil
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
