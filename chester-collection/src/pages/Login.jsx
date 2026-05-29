import { Link } from "react-router-dom";

export default function Login() {
  return (
    <div className="bg-white min-h-screen font-lora py-12 md:py-20">
      <div className="container mx-auto px-4 flex flex-col items-center">
        {/* Breadcrumb */}
        <nav className="text-xs text-gray-500 mb-10 flex gap-2 w-full max-w-md">
          <Link to="/" className="hover:text-chester-pink transition">
            Beranda
          </Link>{" "}
          /<span className="text-chester-text font-medium">Masuk</span>
        </nav>

        {/* Kotak Form Login */}
        <div className="w-full max-w-md">
          <h1 className="text-3xl font-bold text-chester-text mb-2 text-center uppercase tracking-widest">
            Masuk
          </h1>
          <p className="text-sm text-gray-500 text-center mb-10">
            Silakan masukkan email dan kata sandi Anda.
          </p>

          <form className="flex flex-col gap-5">
            {/* Input Email */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="email"
                className="text-sm font-bold text-chester-text uppercase tracking-wider"
              >
                Email
              </label>
              <input
                type="email"
                id="email"
                placeholder="nama@email.com"
                className="border border-gray-300 h-12 px-4 focus:outline-none focus:border-chester-pink focus:ring-1 focus:ring-chester-pink transition bg-gray-50/50"
                required
              />
            </div>

            {/* Input Password */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-end">
                <label
                  htmlFor="password"
                  className="text-sm font-bold text-chester-text uppercase tracking-wider"
                >
                  Kata Sandi
                </label>
                <a
                  href="#"
                  className="text-xs text-gray-500 hover:text-chester-pink underline transition"
                >
                  Lupa kata sandi?
                </a>
              </div>
              <input
                type="password"
                id="password"
                placeholder="••••••••"
                className="border border-gray-300 h-12 px-4 focus:outline-none focus:border-chester-pink focus:ring-1 focus:ring-chester-pink transition bg-gray-50/50"
                required
              />
            </div>

            {/* Tombol Masuk */}
            <button
              type="submit"
              className="w-full bg-chester-pink text-white h-14 font-bold text-sm uppercase tracking-widest hover:bg-gray-900 transition duration-300 mt-4"
            >
              Masuk
            </button>
          </form>

          {/* Bagian Daftar Akun Baru */}
          <div className="mt-12 pt-8 border-t border-gray-100 text-center">
            <h2 className="text-lg font-bold text-chester-text mb-3 uppercase tracking-wider">
              Pelanggan Baru?
            </h2>
            <p className="text-sm text-gray-500 mb-6 leading-relaxed">
              Buat akun untuk mempercepat proses *checkout*, melacak status
              pesanan, dan melihat riwayat pembelian Anda.
            </p>
            <Link
              to="/register"
              className="inline-flex items-center justify-center w-full bg-white text-chester-text border-2 border-chester-text h-14 font-bold text-sm uppercase tracking-widest hover:bg-gray-50 transition duration-300"
            >
              Buat Akun
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
