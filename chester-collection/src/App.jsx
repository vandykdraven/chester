import { useState } from 'react';
import { HashRouter as Router, Routes, Route, Link } from 'react-router-dom';
import logo from './assets/logo.png';
import { Search, User, ShoppingBag, Menu, X } from 'lucide-react'; // Tambahkan ikon X

import Home from './pages/Home';
import Catalog from './pages/Catalog';
import ProductPage from './pages/ProductPage';

const Header = () => {
  // State untuk mengontrol menu mobile
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <>
      <header className="bg-white border-b border-gray-100 font-lora sticky top-0 z-40">
        <div className="bg-chester-pink text-white text-xs py-2 px-4 text-center">
          Gratis ongkir untuk pesanan di atas Rp 500.000
        </div>
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center">
            {/* Tombol Hamburger dengan fungsi onClick */}
            <button className="lg:hidden mr-4" onClick={() => setIsMobileMenuOpen(true)}>
              <Menu className="h-6 w-6 text-chester-text" />
            </button>
            <Link to="/"><img src={logo} alt="Chester Collection Logo" className="h-12 lg:h-16" /></Link>
          </div>
          
          <nav className="hidden lg:flex flex-grow justify-center items-center gap-8">
            <Link to="/" className="text-sm font-medium text-chester-text hover:text-chester-pink transition">Beranda</Link>
            <Link to="/products" className="text-sm font-medium text-chester-text hover:text-chester-pink transition">Katalog</Link>
            <a href="#" className="text-sm font-medium text-chester-text hover:text-chester-pink transition">Wanita</a>
            <a href="#" className="text-sm font-medium text-chester-text hover:text-chester-pink transition">Diskon</a>
          </nav>

          <div className="flex items-center gap-4 lg:gap-5">
            <button><Search className="h-5 w-5 text-chester-text" /></button>
            <button><User className="h-5 w-5 text-chester-text" /></button>
            <button className="flex items-center gap-1 group">
              <ShoppingBag className="h-5 w-5 text-chester-text group-hover:text-chester-pink" />
              <span className="text-xs font-semibold text-chester-text group-hover:text-chester-pink">(0)</span>
            </button>
          </div>
        </div>
      </header>

      {/* --- SIDEBAR MOBILE MENU --- */}
      <div className={`fixed inset-0 z-50 bg-black/50 lg:hidden transition-opacity duration-300 ${isMobileMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`} onClick={() => setIsMobileMenuOpen(false)}>
        <div 
          className={`absolute top-0 left-0 bottom-0 w-3/4 max-w-sm bg-white p-6 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`} 
          onClick={(e) => e.stopPropagation()} // Mencegah menu tertutup saat area putih diklik
        >
          <div className="flex justify-between items-center mb-10 border-b border-gray-100 pb-4">
            <img src={logo} alt="Logo" className="h-8" />
            <button onClick={() => setIsMobileMenuOpen(false)}>
              <X className="h-6 w-6 text-gray-400 hover:text-chester-pink" />
            </button>
          </div>
          <nav className="flex flex-col gap-6 font-lora">
            <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-bold text-chester-text hover:text-chester-pink">Beranda</Link>
            <Link to="/products" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-bold text-chester-text hover:text-chester-pink">Katalog</Link>
            <a href="#" className="text-lg font-bold text-chester-text hover:text-chester-pink">Wanita</a>
            <a href="#" className="text-lg font-bold text-chester-text hover:text-chester-pink">Diskon</a>
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
          {/* Logo */}
          <div className="bg-white rounded-full p-1.5 shadow-sm">
            <img src={logo} alt="Chester Collection" className="h-10 w-10 object-contain" />
          </div>
          
          {/* Menu Tautan */}
          <div className="flex flex-wrap justify-center gap-6 text-sm font-medium opacity-90">
            <a href="#" className="hover:opacity-100 hover:scale-105 transition-all duration-300">Kebijakan Privasi</a>
            <a href="#" className="hover:opacity-100 hover:scale-105 transition-all duration-300">FAQ</a>
            <a href="#" className="hover:opacity-100 hover:scale-105 transition-all duration-300">Syarat & Ketentuan</a>
          </div>
          
          {/* Ikon Sosial Media Lengkap (FB, IG, Twitter/X, TikTok) */}
          <div className="flex items-center gap-5 md:ml-4">
            <a href="#" className="opacity-80 hover:opacity-100 hover:scale-110 transition-all duration-300" aria-label="Facebook">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
            </a>
            <a href="#" className="opacity-80 hover:opacity-100 hover:scale-110 transition-all duration-300" aria-label="Instagram">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
            </a>
            <a href="#" className="opacity-80 hover:opacity-100 hover:scale-110 transition-all duration-300" aria-label="Twitter">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path></svg>
            </a>
            <a href="#" className="opacity-80 hover:opacity-100 hover:scale-110 transition-all duration-300" aria-label="TikTok">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5v3a3 3 0 0 1-3-3v11a7 7 0 1 1-7-7v3"></path></svg>
            </a>
          </div>
        </div>

        {/* Copyright */}
        <div className="text-center text-xs opacity-80 border-t border-white/20 pt-6 max-w-5xl mx-auto">
          <p>&copy; {new Date().getFullYear()} Chester Collection. Hak Cipta Dilindungi.</p>
        </div>

      </div>
    </footer>
  );
};

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-white flex flex-col">
        <Header />
        <div className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/products" element={<Catalog />} />
            <Route path="/product/:id" element={<ProductPage />} />
          </Routes>
        </div>
        <Footer />
      </div>
    </Router>
  );
}