import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShieldCheck, ArrowLeft, Loader2 } from "lucide-react";
import axios from "axios";

export default function AdminLogin() {
  const navigate = useNavigate();

  // State untuk form input
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // State untuk status pengiriman data
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Mengirimkan data input ke server Node.js kita
      const response = await axios.post(
        "http://localhost:5000/api/admin/login",
        {
          email,
          password,
        },
      );

      // Jika sukses, simpan Token JWT dan data Admin ke memori browser (localStorage)
      localStorage.setItem("adminToken", response.data.token);
      localStorage.setItem("adminData", JSON.stringify(response.data.admin));

      // Alihkan halaman secara aman langsung menuju Dashboard Admin
      navigate("/admin");
    } catch (err) {
      // Jika gagal, tangkap pesan error dari server backend
      if (err.response && err.response.data) {
        setError(err.response.data.message);
      } else {
        setError(
          "Tidak dapat terhubung ke server backend. Pastikan server Node.js menyala!",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen font-lora flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="absolute top-8 left-8">
        <Link
          to="/"
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-chester-pink transition font-medium"
        >
          <ArrowLeft size={16} /> Kembali ke Toko
        </Link>
      </div>

      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-xl border border-gray-100">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-pink-50 rounded-full flex items-center justify-center mb-4">
            <ShieldCheck size={32} className="text-chester-pink" />
          </div>
          <h2 className="text-3xl font-extrabold text-chester-text tracking-tight uppercase">
            Admin Panel
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Masuk ke sistem pengelolaan Chester Collection
          </p>
        </div>

        {/* Notifikasi Error jika login gagal */}
        {error && (
          <div
            className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 text-sm rounded animate-shake"
            role="alert"
          >
            <p className="font-bold">Gagal Masuk</p>
            <p>{error}</p>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="text-sm font-bold text-chester-text uppercase tracking-wider block mb-2"
              >
                Alamat Email
              </label>
              <input
                id="email"
                type="email"
                required
                disabled={loading}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-chester-pink focus:border-transparent transition bg-gray-50 focus:bg-white disabled:opacity-50"
                placeholder="admin@chester.com"
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="text-sm font-bold text-chester-text uppercase tracking-wider block mb-2"
              >
                Kata Sandi
              </label>
              <input
                id="password"
                type="password"
                required
                disabled={loading}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-chester-pink focus:border-transparent transition bg-gray-50 focus:bg-white disabled:opacity-50"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                type="checkbox"
                className="h-4 w-4 accent-chester-pink border-gray-300 rounded cursor-pointer"
              />
              <label
                htmlFor="remember-me"
                className="ml-2 block text-sm text-gray-600 cursor-pointer"
              >
                Ingat saya
              </label>
            </div>
            <div className="text-sm">
              <a
                href="#"
                className="font-medium text-chester-pink hover:text-gray-900 transition underline"
              >
                Lupa sandi?
              </a>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 py-3.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold uppercase tracking-widest text-white bg-chester-pink hover:bg-gray-900 transition-colors duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Memverifikasi...
                </>
              ) : (
                "Masuk ke Dashboard"
              )}
            </button>
          </div>
        </form>

        <div className="pt-6 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-400">
            Restricted Access &bull; Authorized Personnel Only
          </p>
        </div>
      </div>
    </div>
  );
}
