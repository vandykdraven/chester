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
  Bell, // Icon baru untuk Notifikasi
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

  // --- STATE PENCARIAN AREA BITESHIP ---
  const [areaQuery, setAreaQuery] = useState("");
  const [areaResults, setAreaResults] = useState([]);
  const [isSearchingArea, setIsSearchingArea] = useState(false);
  const [showAreaDropdown, setShowAreaDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // 1. STATE FORM PENGATURAN UMUM & NOTIFIKASI (Telah Ditambahkan)
  const [formData, setFormData] = useState({
    shop_name: "",
    shop_phone: "",
    store_area_id: "",
    shop_address: "",
    biteship_api_key: "",
    // Tambahan Notifikasi
    smtp_host: "",
    smtp_port: "",
    smtp_user: "",
    smtp_password: "",
    fonnte_api_key: "",
  });

  // 2. STATE MANAJEMEN STAF (ADMINS)
  const [admins, setAdmins] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAdmin, setNewAdmin] = useState({
    fullname: "",
    email: "",
    password: "",
    role: "Editor",
  });

  // 3. STATE PROFIL SAYA
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

  // Menutup dropdown area jika klik di luar area input
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
    await fetchSettings();
    await fetchAdmins();
    loadCurrentLoggedInAdmin();
    setIsLoading(false);
  };

  const fetchSettings = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/settings`,
      );
      if (response.data.success) {
        setFormData((prev) => ({ ...prev, ...response.data.data }));
        // Jika sudah ada area_id sebelumnya, tampilkan ID-nya sementara
        if (response.data.data.store_area_id) {
          setAreaQuery(response.data.data.store_area_id);
        }
      }
    } catch (e) {
      console.error(e);
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

  // --- HANDLER PENCARIAN AREA ---
  const handleAreaSearchChange = async (e) => {
    const keyword = e.target.value;
    setAreaQuery(keyword);

    // Hapus ID dari form jika pengguna mulai mengetik ulang
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
    setFormData({ ...formData, store_area_id: area.id }); // Simpan ID rahasia ke state
    setAreaQuery(area.name); // Tampilkan nama kota yang indah di input
    setShowAreaDropdown(false);
  };

  // --- STANDARD HANDLERS ---
  const handleChangeSetting = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleChangeNewAdmin = (e) =>
    setNewAdmin({ ...newAdmin, [e.target.name]: e.target.value });
  const handleChangeProfile = (e) =>
    setProfileData({ ...profileData, [e.target.name]: e.target.value });

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
      // Kita menggunakan endpoint PUT/settings sesuai skrip asli Anda
      const res = await axios.put(
        `${import.meta.env.VITE_API_URL}/settings`,
        formData,
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
            id="shipping"
            icon={<Truck size={18} />}
            label="API Logistik"
          />
          {/* TAB BARU: NOTIFIKASI */}
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

                  {/* DROPDOWN HASIL PENCARIAN */}
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
                  {/* Peringatan jika belum divalidasi */}
                  {areaQuery &&
                    !formData.store_area_id &&
                    !showAreaDropdown && (
                      <p className="text-[10px] text-red-500 mt-1 font-bold">
                        ⚠️ Harap pilih lokasi dari daftar rekomendasi yang
                        muncul.
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
                <p className="text-[10px] text-gray-400 mt-1">
                  Alamat ini digunakan sebagai informasi di label pengiriman dan
                  struk pesanan.
                </p>
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="bg-chester-pink text-white px-6 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 w-max shadow-sm"
              >
                <Save size={18} /> Simpan Pengaturan
              </button>
            </form>
          )}

          {/* TAB 2: BITESHIP */}
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
                  Masukkan API Key dari dashboard Biteship Anda untuk
                  mengaktifkan perhitungan ongkos kirim otomatis.
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

          {/* TAB BARU: NOTIFIKASI (EMAIL & FONNTE) */}
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
                  Pengaturan untuk mengirim email dan WhatsApp otomatis kepada
                  admin dan pelanggan.
                </p>
              </div>

              {/* Fonnte API Key */}
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
                <p className="text-[10px] text-gray-400 mt-1">
                  Token ini digunakan agar website bisa memerintahkan Fonnte
                  mengirim pesan WA otomatis.
                </p>
              </div>

              {/* Pengaturan SMTP Email */}
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
                      Username / Email Pengirim
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
                <Save size={18} /> Simpan Pengaturan Notifikasi
              </button>
            </form>
          )}

          {/* TAB 3: PEMBAYARAN */}
          {activeTab === "payment" && (
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-100 shadow-sm min-h-[400px] animate-fade-in flex flex-col gap-6">
              <div>
                <h2 className="text-lg font-bold text-gray-800 mb-1">
                  Payment Gateway
                </h2>
                <p className="text-xs text-gray-500">
                  Pengaturan integrasi Midtrans/Xendit.
                </p>
              </div>
              <div className="flex flex-col items-center justify-center p-10 border-2 border-dashed rounded-xl bg-gray-50 text-center text-gray-400">
                <CreditCard size={40} className="mb-3" />
                <p className="font-bold">Modul Pembayaran Belum Diaktifkan</p>
              </div>
            </div>
          )}

          {/* TAB 4: KELOLA STAF */}
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

          {/* TAB 5: PROFIL SAYA */}
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
