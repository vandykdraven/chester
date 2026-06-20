import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import axios from "axios";
import logo from "../assets/logo.png"; // Memakai logo yang sama

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  // Tangkap jalur sebelumnya, jika tidak ada, jadikan beranda ("/") sebagai default
  const from = location.state?.from || "/";
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // State Input Form
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const [customAlert, setCustomAlert] = useState({
    show: false,
    message: "",
    type: "success",
  });

  // Efek Otomatis Cek jika user mencentang Remember Me sebelumnya
  useEffect(() => {
    const savedToken = localStorage.getItem("customerToken");
    if (savedToken) {
      navigate(from); // Jika sudah diingat, langsung lempar ke beranda utama pembeli
    }
  }, [navigate]);

  const showAlert = (message, type = "success") => {
    setCustomAlert({ show: true, message, type });
    setTimeout(
      () => setCustomAlert({ show: false, message: "", type: "success" }),
      3500,
    );
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/auth/login`,
        { email, password },
      );

      if (response.data.success) {
        showAlert("Selamat datang kembali! Login berhasil.", "success");

        const { token, user } = response.data;

        // LOGIKA INGAT SAYA (REMEMBER ME) YANG SEBENARNYA:
        if (rememberMe) {
          // Disimpan di LocalStorage (Permanen walaupun browser ditutup)
          localStorage.setItem("customerToken", token);
          localStorage.setItem("customerUser", JSON.stringify(user));
        } else {
          // Disimpan di SessionStorage (Hilang otomatis saat tab/browser ditutup)
          sessionStorage.setItem("customerToken", token);
          sessionStorage.setItem("customerUser", JSON.stringify(user));
        }

        setTimeout(() => {
          navigate(from); // Arahkan ke homepage pembeli setelah sukses
        }, 1500);
      }
    } catch (error) {
      showAlert(
        error.response?.data?.message || "Email atau kata sandi Anda keliru.",
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
              Masuk Akun
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              Silakan masuk untuk melanjutkan pesanan Anda di Chester.
            </p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-6">
            {/* INPUT EMAIL */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                Alamat Email
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

            {/* INPUT PASSWORD */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                Kata Sandi
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Lock size={18} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-gray-50/50 border border-gray-200 pl-10 pr-12 py-3 rounded-xl focus:outline-none focus:border-chester-pink focus:bg-white text-sm transition-colors"
                  placeholder="••••••••"
                />
                {/* TOMBOL LIHAT PASSWORD */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-chester-pink transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* INGAT SAYA & LUPA PASSWORD */}
            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 cursor-pointer group select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded accent-chester-pink cursor-pointer border-gray-300"
                />
                <span className="text-gray-500 font-medium group-hover:text-gray-800 transition-colors">
                  Ingat Saya
                </span>
              </label>

              {/* LINK LUPA PASSWORD */}
              <Link
                to="/forgot-password"
                className="font-bold text-chester-pink hover:underline"
              >
                Lupa Kata Sandi?
              </Link>
            </div>

            {/* TOMBOL SUBMIT */}
            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-gray-950 hover:bg-black focus:outline-none transition-colors cursor-pointer disabled:opacity-70"
              >
                {isSubmitting ? "Memproses..." : "Masuk Aplikasi"}{" "}
                <ArrowRight size={16} />
              </button>
            </div>
          </form>

          {/* LINK DAFTAR */}
          <div className="mt-8 text-center pt-6 border-t border-gray-100 text-xs text-gray-500">
            Belum mempunyai akun pembeli?{" "}
            <Link
              to="/register"
              className="font-bold text-chester-pink hover:underline"
            >
              Daftar Sekarang
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
