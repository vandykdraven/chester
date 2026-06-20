import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, ArrowLeft, CheckCircle, AlertCircle, Send } from "lucide-react";
import axios from "axios";
import logo from "../assets/logo.png";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [customAlert, setCustomAlert] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const showAlert = (message, type = "success") => {
    setCustomAlert({ show: true, message, type });
    setTimeout(
      () => setCustomAlert({ show: false, message: "", type: "success" }),
      4000,
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Kirim permintaan ke backend
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/auth/forgot-password`,
        { email },
      );

      if (response.data.success) {
        setIsSuccess(true);
      }
    } catch (error) {
      showAlert(
        error.response?.data?.message ||
          "Gagal memproses permintaan. Silakan coba lagi.",
        "error",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-lora">
      {/* ALERT NOTIFIKASI */}
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

      <div className="sm:mx-auto w-full max-w-md">
        <div className="bg-white py-10 px-6 shadow-sm border border-gray-100 rounded-2xl sm:px-10">
          <div className="mb-8 text-center">
            <img
              src={logo}
              alt="Chester Logo"
              className="h-16 mx-auto object-contain mb-4"
            />
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">
              Lupa Kata Sandi
            </h2>
            <p className="text-sm text-gray-500 mt-2">
              Masukkan alamat email Anda yang terdaftar, dan kami akan
              mengirimkan instruksi untuk mengatur ulang kata sandi.
            </p>
          </div>

          {/* JIKA BERHASIL MENGIRIM EMAIL, TAMPILKAN PESAN INI */}
          {isSuccess ? (
            <div className="text-center bg-emerald-50 border border-emerald-100 p-6 rounded-xl animate-fade-in">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail size={32} />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">
                Periksa Kotak Masuk Anda
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                Kami telah mengirimkan instruksi pemulihan kata sandi ke{" "}
                <span className="font-bold">{email}</span>.
              </p>
              <Link
                to="/login"
                className="inline-flex items-center justify-center w-full py-3 px-4 border border-gray-200 rounded-xl shadow-sm text-sm font-bold text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                Kembali ke halaman Login
              </Link>
            </div>
          ) : (
            /* JIKA BELUM MENGIRIM, TAMPILKAN FORM INI */
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                  Alamat Email Terdaftar
                </label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Mail size={18} />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-gray-50/50 border border-gray-200 pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:border-chester-pink focus:bg-white text-sm transition-colors"
                    placeholder="nama@email.com"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-gray-950 hover:bg-black focus:outline-none transition-colors disabled:opacity-70"
                >
                  {isSubmitting ? "Memproses..." : "Kirim Link Pemulihan"}{" "}
                  <Send size={16} />
                </button>
              </div>
            </form>
          )}

          {/* TOMBOL KEMBALI */}
          {!isSuccess && (
            <div className="mt-6 text-center pt-6 border-t border-gray-100">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-chester-pink transition-colors"
              >
                <ArrowLeft size={16} /> Kembali ke halaman Login
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
