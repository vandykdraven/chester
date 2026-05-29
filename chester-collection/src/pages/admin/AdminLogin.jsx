import { Link } from "react-router-dom";
import { ShieldCheck, ArrowLeft } from "lucide-react";

export default function AdminLogin() {
  return (
    <div className="bg-gray-50 min-h-screen font-lora flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Tombol Kembali ke Website */}
      <div className="absolute top-8 left-8">
        <Link
          to="/"
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-chester-pink transition font-medium"
        >
          <ArrowLeft size={16} /> Kembali ke Toko
        </Link>
      </div>

      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-xl border border-gray-100">
        {/* Header Form */}
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

        {/* Form Login */}
        <form className="mt-8 space-y-6">
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
                name="email"
                type="email"
                required
                className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-chester-pink focus:border-transparent transition bg-gray-50 focus:bg-white"
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
                name="password"
                type="password"
                required
                className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-chester-pink focus:border-transparent transition bg-gray-50 focus:bg-white"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
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
            <Link
              to="/admin"
              className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold uppercase tracking-widest text-white bg-chester-pink hover:bg-gray-900 transition-colors duration-300"
            >
              Masuk ke Dashboard
            </Link>
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
