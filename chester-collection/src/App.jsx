import { useState } from "react";
import { HashRouter as Router, Routes, Route, Link } from "react-router-dom";
import logo from "./assets/logo.png";
import { Search, User, ShoppingBag, Menu, X, Trash2 } from "lucide-react";

// Import Halaman Pelanggan
import Home from "./pages/Home";
import Catalog from "./pages/Catalog";
import ProductPage from "./pages/ProductPage";
import Login from "./pages/Login";
import Register from "./pages/Register";

// Import Halaman Admin
import AdminLayout from "./pages/admin/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import ProductList from "./pages/admin/ProductList";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminGuard from "./components/AdminGuard";

const formatRupiah = (angka) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(angka);
};

const Header = ({ setIsCartOpen, cartCount }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <>
      <header className="bg-white border-b border-gray-100 font-lora sticky top-0 z-40">
        <div className="bg-chester-pink text-white text-xs py-2 px-4 text-center">
          Gratis ongkir untuk pesanan di atas Rp 500.000
        </div>
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center">
            <button
              className="lg:hidden mr-4"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="h-6 w-6 text-chester-text" />
            </button>
            <Link to="/">
              <img
                src={logo}
                alt="Chester Collection Logo"
                className="h-12 lg:h-16"
              />
            </Link>
          </div>

          <nav className="hidden lg:flex flex-grow justify-center items-center gap-8">
            <Link
              to="/"
              className="text-sm font-medium text-chester-text hover:text-chester-pink transition"
            >
              Beranda
            </Link>
            <Link
              to="/products"
              className="text-sm font-medium text-chester-text hover:text-chester-pink transition"
            >
              Katalog
            </Link>
            <a
              href="#"
              className="text-sm font-medium text-chester-text hover:text-chester-pink transition"
            >
              Wanita
            </a>
            <a
              href="#"
              className="text-sm font-medium text-chester-text hover:text-chester-pink transition"
            >
              Diskon
            </a>
          </nav>

          <div className="flex items-center gap-4 lg:gap-5">
            <button>
              <Search className="h-5 w-5 text-chester-text hover:text-chester-pink transition" />
            </button>
            <Link to="/login" className="hover:text-chester-pink transition">
              <User className="h-5 w-5 text-inherit" />
            </Link>
            <button
              onClick={() => setIsCartOpen(true)}
              className="flex items-center gap-1 group relative"
            >
              <ShoppingBag className="h-5 w-5 text-chester-text group-hover:text-chester-pink transition" />
              <span className="absolute -top-1.5 -right-2 bg-chester-pink text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Sidebar Mobile Menu */}
      <div
        className={`fixed inset-0 z-50 bg-black/50 lg:hidden transition-opacity duration-300 ${isMobileMenuOpen ? "opacity-100 visible" : "opacity-0 invisible"}`}
        onClick={() => setIsMobileMenuOpen(false)}
      >
        <div
          className={`absolute top-0 left-0 bottom-0 w-3/4 max-w-sm bg-white p-6 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-10 border-b border-gray-100 pb-4">
            <img src={logo} alt="Logo" className="h-8" />
            <button onClick={() => setIsMobileMenuOpen(false)}>
              <X className="h-6 w-6 text-gray-400 hover:text-chester-pink" />
            </button>
          </div>
          <nav className="flex flex-col gap-6 font-lora">
            <Link
              to="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-lg font-bold text-chester-text hover:text-chester-pink"
            >
              Beranda
            </Link>
            <Link
              to="/products"
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-lg font-bold text-chester-text hover:text-chester-pink"
            >
              Katalog
            </Link>
            <a
              href="#"
              className="text-lg font-bold text-chester-text hover:text-chester-pink"
            >
              Wanita
            </a>
            <a
              href="#"
              className="text-lg font-bold text-chester-text hover:text-chester-pink"
            >
              Diskon
            </a>
            <Link
              to="/login"
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-lg font-bold text-chester-text hover:text-chester-pink mt-4 pt-4 border-t border-gray-100"
            >
              Akun Saya / Masuk
            </Link>
          </nav>
        </div>
      </div>
    </>
  );
};

const Footer = () => {
  return (
    <footer className="bg-chester-pink text-white py-8 font-lora mt-auto">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row flex-wrap justify-center items-center gap-6 md:gap-10 mb-8">
          <div className="bg-white rounded-full p-1.5 shadow-sm">
            <img
              src={logo}
              alt="Chester Collection"
              className="h-10 w-10 object-contain"
            />
          </div>
          <div className="flex flex-wrap justify-center gap-6 text-sm font-medium opacity-90">
            <a
              href="#"
              className="hover:opacity-100 hover:scale-105 transition-all duration-300"
            >
              Kebijakan Privasi
            </a>
            <a
              href="#"
              className="hover:opacity-100 hover:scale-105 transition-all duration-300"
            >
              FAQ
            </a>
            <a
              href="#"
              className="hover:opacity-100 hover:scale-105 transition-all duration-300"
            >
              Syarat & Ketentuan
            </a>
          </div>
          <div className="flex items-center gap-5 md:ml-4">
            {/* Ikon Sosial Media (Dirapikan agar tidak error Unterminated String) */}
            <a
              href="#"
              className="opacity-80 hover:opacity-100 hover:scale-110 transition-all duration-300"
              aria-label="Facebook"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
              </svg>
            </a>

            <a
              href="#"
              className="opacity-80 hover:opacity-100 hover:scale-110 transition-all duration-300"
              aria-label="Instagram"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
              </svg>
            </a>

            <a
              href="#"
              className="opacity-80 hover:opacity-100 hover:scale-110 transition-all duration-300"
              aria-label="Twitter"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
              </svg>
            </a>

            <a
              href="#"
              className="opacity-80 hover:opacity-100 hover:scale-110 transition-all duration-300"
              aria-label="TikTok"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5v3a3 3 0 0 1-3-3v11a7 7 0 1 1-7-7v3"></path>
              </svg>
            </a>
          </div>
        </div>
        <div className="text-center text-xs opacity-80 border-t border-white/20 pt-6 max-w-5xl mx-auto">
          <p>
            &copy; {new Date().getFullYear()} Chester Collection. Hak Cipta
            Dilindungi.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default function App() {
  const [isCartOpen, setIsCartOpen] = useState(false);

  const [cartItems, setCartItems] = useState([
    {
      id: 1,
      name: "Gaun Campuran Linen",
      price: 450000,
      qty: 1,
      size: "M",
      color: "Oatmeal",
      image:
        "https://images.unsplash.com/photo-1539008835657-9e8e9680c956?w=200",
    },
    {
      id: 3,
      name: "Celana Pendek Denim",
      price: 325000,
      qty: 2,
      size: "L",
      color: "Blue",
      image:
        "https://images.unsplash.com/photo-1591369822096-ffd140ec948f?w=200",
    },
  ]);

  const cartTotal = cartItems.reduce(
    (total, item) => total + item.price * item.qty,
    0,
  );
  const cartCount = cartItems.reduce((total, item) => total + item.qty, 0);

  const removeItem = (id) => {
    setCartItems(cartItems.filter((item) => item.id !== id));
  };

  return (
    <Router>
      <Routes>
        {/* ======================================= */}
        {/* RUTE ADMIN LOGIN (Berdiri Sendiri) */}
        {/* ======================================= */}
        <Route path="/admin-login" element={<AdminLogin />} />

        {/* ======================================= */}
        {/* RUTE ADMIN (Tanpa Header/Footer Publik) */}
        {/* ======================================= */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="products" element={<ProductList />} />
        </Route>

        {/* ======================================= */}
        {/* RUTE PELANGGAN (Ada Header/Footer/Cart) */}
        {/* ======================================= */}
        <Route
          path="/*"
          element={
            <div className="min-h-screen bg-white flex flex-col font-lora">
              <Header setIsCartOpen={setIsCartOpen} cartCount={cartCount} />

              <div className="flex-grow">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/products" element={<Catalog />} />
                  <Route path="/product/:id" element={<ProductPage />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                </Routes>
              </div>

              <Footer />

              {/* Slide Keranjang Belanja */}
              <div
                className={`fixed inset-0 z-50 bg-black/40 transition-opacity duration-300 ${isCartOpen ? "opacity-100 visible" : "opacity-0 invisible"}`}
                onClick={() => setIsCartOpen(false)}
              >
                <div
                  className={`absolute top-0 right-0 bottom-0 w-full max-w-md bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${isCartOpen ? "translate-x-0" : "translate-x-full"}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex justify-between items-center p-6 border-b border-gray-100">
                    <h2 className="text-lg font-bold text-chester-text uppercase tracking-widest">
                      Keranjang Belanja ({cartCount})
                    </h2>
                    <button
                      onClick={() => setIsCartOpen(false)}
                      className="text-gray-400 hover:text-chester-pink transition p-1"
                    >
                      <X size={24} />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
                    {cartItems.length === 0 ? (
                      <div className="text-center text-gray-500 mt-10">
                        Keranjang Anda masih kosong.
                      </div>
                    ) : (
                      cartItems.map((item) => (
                        <div key={item.id} className="flex gap-4 group">
                          <div className="w-24 aspect-[3/4] bg-gray-50 flex-shrink-0">
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 flex flex-col justify-between">
                            <div>
                              <div className="flex justify-between items-start mb-1">
                                <h3 className="text-sm font-medium text-chester-text line-clamp-2 pr-4">
                                  {item.name}
                                </h3>
                                <button
                                  onClick={() => removeItem(item.id)}
                                  className="text-gray-400 hover:text-chester-pink transition"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                              <p className="text-xs text-gray-500 mb-1">
                                {item.color} / {item.size}
                              </p>
                            </div>
                            <div className="flex justify-between items-end">
                              <span className="text-xs font-semibold text-gray-500 border border-gray-200 px-3 py-1">
                                Qty: {item.qty}
                              </span>
                              <span className="text-sm font-bold text-chester-text">
                                {formatRupiah(item.price * item.qty)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="border-t border-gray-100 p-6 bg-gray-50">
                    <div className="flex justify-between items-center mb-6">
                      <span className="text-sm font-bold text-gray-600 uppercase">
                        Subtotal
                      </span>
                      <span className="text-xl font-bold text-chester-text">
                        {formatRupiah(cartTotal)}
                      </span>
                    </div>

                    <div className="flex flex-col gap-3">
                      <button className="w-full bg-chester-pink text-white h-14 font-bold text-sm uppercase tracking-widest hover:bg-gray-900 transition duration-300">
                        Checkout
                      </button>
                      <button
                        onClick={() => setIsCartOpen(false)}
                        className="w-full bg-white text-chester-text border-2 border-chester-text h-14 font-bold text-sm uppercase tracking-widest hover:bg-gray-100 transition duration-300"
                      >
                        Lanjut Belanja
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          }
        />
      </Routes>
    </Router>
  );
}
