import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  User,
  Phone,
  ArrowRight,
} from "lucide-react";
import axios from "axios";
import logo from "../assets/logo.png"; // Menggunakan path yang sudah benar (satu titik dua)

export default function Register() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State untuk melihat/menyembunyikan kata sandi
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // State Input Form
  const [formData, setFormData] = useState({
    fullname: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  // State untuk Notifikasi Kustom (Custom Alert)
  const [customAlert, setCustomAlert] = useState({
    show: false,
    message: "",
    type: "success",
  });

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

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();

    // Validasi 1: Pastikan kata sandi dan konfirmasi sama
    if (formData.password !== formData.confirmPassword) {
      showAlert("Kata sandi dan Konfirmasi kata sandi tidak cocok!", "error");
      return;
    }

    // Validasi 2: Panjang kata sandi minimal (misal 6 karakter)
    if (formData.password.length < 6) {
      showAlert("Kata sandi minimal harus 6 karakter.", "error");
      return;
    }

    setIsSubmitting(true);

    try {
      // Mengirim data ke backend Node.js
      const payload = {
        fullname: formData.fullname,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
      };

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/auth/register`,
        payload,
      );

      if (response.data.success) {
        showAlert(
          "Pendaftaran sukses! Mengalihkan ke halaman login...",
          "success",
        );

        // Jeda 2 detik agar pelanggan bisa membaca pesan sukses, lalu pindah ke halaman Login
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      }
    } catch (error) {
      // Menangkap pesan error dari backend (misal: email sudah terdaftar)
      showAlert(
        error.response?.data?.message ||
          "Gagal mendaftarkan akun. Silakan coba lagi.",
        "error",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-lora">
      {/* ALERT NOTIFIKASI KUSTOM */}
      {customAlert.show && (
        <div className="fixed top-6 right-6 z-50 animate-fade-in">
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

      {/* BOX FORM UTAMA */}
      <div className="sm:mx-auto w-full max-w-md">
        <div className="bg-white py-10 px-6 shadow-sm border border-gray-100 rounded-2xl sm:px-10">
          {/* LOGO & HEADING */}
          <div className="mb-8 text-center">
            <img
              src={logo}
              alt="Chester Logo"
              className="h-16 mx-auto object-contain mb-4"
            />
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">
              Daftar Akun Baru
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              Lengkapi data di bawah ini untuk menjadi pelanggan Chester.
            </p>
          </div>

          <form onSubmit={handleRegisterSubmit} className="space-y-5">
            {/* INPUT NAMA LENGKAP */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                Nama Lengkap *
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <User size={18} />
                </div>
                <input
                  type="text"
                  name="fullname"
                  required
                  value={formData.fullname}
                  onChange={handleChange}
                  className="w-full bg-gray-50/50 border border-gray-200 pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:border-chester-pink focus:bg-white text-sm transition-colors"
                  placeholder="Nama sesuai KTP"
                />
              </div>
            </div>

            {/* INPUT EMAIL */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                Alamat Email *
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full bg-gray-50/50 border border-gray-200 pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:border-chester-pink focus:bg-white text-sm transition-colors"
                  placeholder="nama@email.com"
                />
              </div>
            </div>

            {/* INPUT NOMOR HP */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                Nomor WhatsApp
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Phone size={18} />
                </div>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full bg-gray-50/50 border border-gray-200 pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:border-chester-pink focus:bg-white text-sm transition-colors"
                  placeholder="08123456789"
                />
              </div>
            </div>

            {/* INPUT KATA SANDI */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                Kata Sandi *
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Lock size={18} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full bg-gray-50/50 border border-gray-200 pl-10 pr-12 py-3 rounded-xl focus:outline-none focus:border-chester-pink focus:bg-white text-sm transition-colors"
                  placeholder="Minimal 6 karakter"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-chester-pink transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* KONFIRMASI KATA SANDI */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                Konfirmasi Kata Sandi *
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Lock size={18} />
                </div>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full bg-gray-50/50 border border-gray-200 pl-10 pr-12 py-3 rounded-xl focus:outline-none focus:border-chester-pink focus:bg-white text-sm transition-colors"
                  placeholder="Ketik ulang kata sandi"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-chester-pink transition-colors cursor-pointer"
                >
                  {showConfirmPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </div>

            {/* TOMBOL SUBMIT */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-gray-950 hover:bg-black focus:outline-none transition-colors cursor-pointer disabled:opacity-70"
              >
                {isSubmitting ? "Memproses..." : "Buat Akun Sekarang"}{" "}
                <ArrowRight size={16} />
              </button>
            </div>
          </form>

          {/* LINK KEMBALI KE LOGIN */}
          <div className="mt-8 text-center pt-6 border-t border-gray-100 text-xs text-gray-500">
            Sudah mempunyai akun?{" "}
            <Link
              to="/login"
              className="font-bold text-chester-pink hover:underline"
            >
              Masuk di sini
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
