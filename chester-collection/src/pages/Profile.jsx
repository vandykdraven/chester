import { useState, useEffect, useRef } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import {
  User,
  Phone,
  Mail,
  Camera,
  Save,
  CheckCircle,
  AlertCircle,
  ShoppingBag,
  MapPin,
  Ticket,
  Heart,
  LogOut,
} from "lucide-react";
import axios from "axios";

export default function Profile() {
  const navigate = useNavigate();
  const location = useLocation();
  const fileInputRef = useRef(null);

  // --- STATE DATA PENGGUNA ---
  const [userData, setUserData] = useState(null);
  const [formData, setFormData] = useState({
    fullname: "",
    phone: "",
    email: "",
  });

  // --- STATE PASSWORD ---
  const [passData, setPassData] = useState({
    oldPassword: "",
    newPassword: "",
  });

  // --- STATE MEDIA (FOTO) ---
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  // --- STATE UI ---
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customAlert, setCustomAlert] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const BASE_URL = import.meta.env.VITE_API_URL.replace("/api", "");

  useEffect(() => {
    const localUser = localStorage.getItem("customerUser");
    const sessionUser = sessionStorage.getItem("customerUser");
    const storedUser = localUser
      ? JSON.parse(localUser)
      : sessionUser
        ? JSON.parse(sessionUser)
        : null;

    if (!storedUser) {
      navigate("/login");
      return;
    }

    setUserData(storedUser);
    setFormData({
      fullname: storedUser.fullname || "",
      phone: storedUser.phone || "",
      email: storedUser.email || "",
    });

    if (storedUser.avatar) {
      setAvatarPreview(`${BASE_URL}${storedUser.avatar}`);
    }
  }, [navigate, BASE_URL]);

  const showAlert = (message, type = "success") => {
    setCustomAlert({ show: true, message, type });
    setTimeout(
      () => setCustomAlert({ show: false, message: "", type: "success" }),
      3500,
    );
  };

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handlePassChange = (e) => {
    setPassData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = new FormData();
      payload.append("fullname", formData.fullname);
      payload.append("phone", formData.phone);
      if (avatarFile) payload.append("avatar", avatarFile);

      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/users/${userData.id}`,
        payload,
        { headers: { "Content-Type": "multipart/form-data" } },
      );

      if (response.data.success) {
        showAlert("Profil berhasil diperbarui!", "success");
        const updatedUser = {
          ...userData,
          fullname: formData.fullname,
          phone: formData.phone,
        };
        if (response.data.avatar) updatedUser.avatar = response.data.avatar;

        const storage = localStorage.getItem("customerUser")
          ? localStorage
          : sessionStorage;
        storage.setItem("customerUser", JSON.stringify(updatedUser));
        setUserData(updatedUser);
      }
    } catch (error) {
      showAlert("Gagal memperbarui profil.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    try {
      await axios.put(
        `${import.meta.env.VITE_API_URL}/users/${userData.id}/password`,
        passData,
      );
      showAlert("Password berhasil diubah!", "success");
      setPassData({ oldPassword: "", newPassword: "" });
    } catch (error) {
      showAlert("Gagal ganti password. Periksa password lama Anda.", "error");
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    navigate("/login");
  };

  if (!userData) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-10 font-lora">
      {customAlert.show && (
        <div className="fixed top-6 right-6 z-50 animate-fade-in">
          <div
            className={`flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-xl border text-sm font-semibold text-white ${customAlert.type === "success" ? "bg-emerald-500" : "bg-rose-500"}`}
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

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="md:col-span-3">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-6 text-center border-b border-gray-100 bg-gray-950 text-white">
                <div className="w-16 h-16 mx-auto rounded-full bg-gray-800 border-2 border-chester-pink overflow-hidden mb-3">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xl font-bold uppercase">
                      {userData.fullname.charAt(0)}
                    </div>
                  )}
                </div>
                <h3 className="font-bold text-sm truncate">
                  {userData.fullname}
                </h3>
              </div>

              <nav className="flex flex-col p-2 gap-1 text-sm font-semibold">
                <Link
                  to="/profile"
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${location.pathname === "/profile" ? "bg-pink-50 text-chester-pink" : "text-gray-600 hover:bg-gray-50"}`}
                >
                  <User size={18} /> Profil Saya
                </Link>
                <Link
                  to="/addresses"
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${location.pathname === "/addresses" ? "bg-pink-50 text-chester-pink" : "text-gray-600 hover:bg-gray-50"}`}
                >
                  <MapPin size={18} /> Buku Alamat
                </Link>
                <Link
                  to="/orders"
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${location.pathname === "/orders" ? "bg-pink-50 text-chester-pink" : "text-gray-600 hover:bg-gray-50"}`}
                >
                  <ShoppingBag size={18} /> Pesanan Saya
                </Link>
                <Link
                  to="/vouchers"
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${location.pathname === "/vouchers" ? "bg-pink-50 text-chester-pink" : "text-gray-600 hover:bg-gray-50"}`}
                >
                  <Ticket size={18} /> Voucher Saya
                </Link>
                <Link
                  to="/wishlist"
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${location.pathname === "/wishlist" ? "bg-pink-50 text-chester-pink" : "text-gray-600 hover:bg-gray-50"}`}
                >
                  <Heart size={18} /> Wishlist
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 text-left mt-2 border-t border-gray-100"
                >
                  <LogOut size={18} /> Keluar Akun
                </button>
              </nav>
            </div>
          </div>

          <div className="md:col-span-9 space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-8">
                Profil Saya
              </h2>
              <form
                onSubmit={handleSubmit}
                className="flex flex-col md:flex-row gap-10"
              >
                <div className="flex-1 space-y-6">
                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-500 mb-2">
                      Nama Lengkap
                    </label>
                    <input
                      type="text"
                      name="fullname"
                      required
                      value={formData.fullname}
                      onChange={handleChange}
                      className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-500 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      disabled
                      className="w-full bg-gray-100 border border-gray-200 p-3 rounded-xl text-sm text-gray-500 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-500 mb-2">
                      No WhatsApp
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl text-sm"
                    />
                  </div>
                  <button
                    type="submit"
                    className="bg-gray-950 text-white px-6 py-3 rounded-xl text-sm font-bold w-full sm:w-auto"
                  >
                    Simpan Perubahan
                  </button>
                </div>
                <div className="w-full md:w-1/3 flex flex-col items-center border-l border-gray-100 pl-8">
                  <div className="w-32 h-32 rounded-full border-4 border-gray-50 overflow-hidden mb-4 bg-gray-100">
                    {avatarPreview ? (
                      <img
                        src={avatarPreview}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User size={48} className="text-gray-300 m-auto mt-8" />
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current.click()}
                    className="text-chester-pink font-bold text-xs underline"
                  >
                    Ganti Foto
                  </button>
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              </form>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                Ubah Kata Sandi
              </h2>
              <form
                onSubmit={handleUpdatePassword}
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-2">
                    Password Lama
                  </label>
                  <input
                    type="password"
                    name="oldPassword"
                    required
                    value={passData.oldPassword}
                    onChange={handlePassChange}
                    className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-2">
                    Password Baru
                  </label>
                  <input
                    type="password"
                    name="newPassword"
                    required
                    value={passData.newPassword}
                    onChange={handlePassChange}
                    className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl text-sm"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-chester-pink text-white px-6 py-3 rounded-xl text-sm font-bold w-full md:w-auto"
                >
                  Update Password
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
