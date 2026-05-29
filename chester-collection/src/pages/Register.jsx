import { Link } from "react-router-dom";

export default function Register() {
  return (
    <div className="bg-white min-h-screen font-lora py-12 md:py-20">
      <div className="container mx-auto px-4 flex flex-col items-center">
        {/* Breadcrumb */}
        <nav className="text-xs text-gray-500 mb-10 flex gap-2 w-full max-w-md">
          <Link to="/" className="hover:text-chester-pink transition">
            Beranda
          </Link>{" "}
          /<span className="text-chester-text font-medium">Buat Akun</span>
        </nav>

        {/* Kotak Form Register */}
        <div className="w-full max-w-md">
          <h1 className="text-3xl font-bold text-chester-text mb-2 text-center uppercase tracking-widest">
            Daftar Akun
          </h1>
          <p className="text-sm text-gray-500 text-center mb-10">
            Silakan isi detail di bawah ini untuk membuat akun baru.
          </p>

          <form className="flex flex-col gap-5">
            {/* Nama Depan */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="firstName"
                className="text-sm font-bold text-chester-text uppercase tracking-wider"
              >
                Nama Depan
              </label>
              <input
                type="text"
                id="firstName"
                placeholder="Contoh: Budi"
                className="border border-gray-300 h-12 px-4 focus:outline-none focus:border-chester-pink focus:ring-1 focus:ring-chester-pink transition bg-gray-50/50"
                required
              />
            </div>

            {/* Nama Belakang */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="lastName"
                className="text-sm font-bold text-chester-text uppercase tracking-wider"
              >
                Nama Belakang
              </label>
              <input
                type="text"
                id="lastName"
                placeholder="Contoh: Santoso"
                className="border border-gray-300 h-12 px-4 focus:outline-none focus:border-chester-pink focus:ring-1 focus:ring-chester-pink transition bg-gray-50/50"
                required
              />
            </div>

            {/* Email */}
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

            {/* Kata Sandi */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="password"
                className="text-sm font-bold text-chester-text uppercase tracking-wider"
              >
                Kata Sandi
              </label>
              <input
                type="password"
                id="password"
                placeholder="Minimal 8 karakter"
                className="border border-gray-300 h-12 px-4 focus:outline-none focus:border-chester-pink focus:ring-1 focus:ring-chester-pink transition bg-gray-50/50"
                required
              />
            </div>

            {/* Persetujuan Buletin / T&C (Opsional tapi bagus untuk UI) */}
            <div className="flex items-start gap-3 mt-2">
              <input
                type="checkbox"
                id="terms"
                className="mt-1 w-4 h-4 accent-chester-pink cursor-pointer"
                required
              />
              <label
                htmlFor="terms"
                className="text-xs text-gray-500 leading-relaxed cursor-pointer"
              >
                Saya menyetujui{" "}
                <a href="#" className="underline hover:text-chester-pink">
                  Syarat & Ketentuan
                </a>{" "}
                serta{" "}
                <a href="#" className="underline hover:text-chester-pink">
                  Kebijakan Privasi
                </a>{" "}
                yang berlaku.
              </label>
            </div>

            {/* Tombol Daftar */}
            <button
              type="submit"
              className="w-full bg-chester-pink text-white h-14 font-bold text-sm uppercase tracking-widest hover:bg-gray-900 transition duration-300 mt-4"
            >
              Buat Akun Saya
            </button>
          </form>

          {/* Tautan Kembali ke Login */}
          <div className="mt-10 pt-8 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-500 mb-4">Sudah memiliki akun?</p>
            <Link
              to="/login"
              className="text-sm font-bold text-chester-text hover:text-chester-pink uppercase tracking-widest underline transition"
            >
              Masuk ke Akun Anda
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
