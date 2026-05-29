import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { SlidersHorizontal, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

const formatRupiah = (angka) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
};

// Komponen Kartu Produk Khusus dengan Logika Hover Slider Kiri
const ProductCard = ({ product }) => {
  const [currentImgIndex, setCurrentImgIndex] = useState(0);
  const timeoutRef = useRef(null);
  const intervalRef = useRef(null);

  const handleMouseEnter = () => {
    // PERBAIKAN: Hanya jalankan efek slide jika perangkat mendukung hover (bukan HP)
    if (!window.matchMedia("(hover: hover)").matches) return;

    timeoutRef.current = setTimeout(() => {
      intervalRef.current = setInterval(() => {
        setCurrentImgIndex((prevIndex) => (prevIndex + 1) % product.images.length);
      }, 800);
    }, 400); 
  };

  const handleMouseLeave = () => {
    clearTimeout(timeoutRef.current);
    clearInterval(intervalRef.current);
    setCurrentImgIndex(0);
  };

  return (
    <Link 
      to={`/product/${product.id}`} 
      className="group font-lora block cursor-pointer"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="aspect-square overflow-hidden mb-4 bg-gray-100 relative">
        <div className="w-full h-full transition-transform duration-500 group-hover:scale-105">
          <div 
            className="flex w-full h-full transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${currentImgIndex * 100}%)` }}
          >
            {product.images.map((img, idx) => (
              <div key={idx} className="w-full h-full flex-shrink-0">
                <img 
                  src={img} 
                  alt={`${product.name} ${idx + 1}`} 
                  className={`w-full h-full object-cover ${product.stockStatus === 'sold' ? 'opacity-70 grayscale' : ''}`} 
                />
              </div>
            ))}
          </div>
        </div>
        
        {product.stockStatus === 'available' && <span className="absolute top-2 left-2 bg-white text-chester-text text-[10px] font-bold uppercase tracking-wider px-2 py-1 shadow-sm border border-gray-100 z-10">Available</span>}
        {product.stockStatus === 'low' && <span className="absolute top-2 left-2 bg-orange-100 text-orange-800 text-[10px] font-bold uppercase tracking-wider px-2 py-1 shadow-sm z-10">Low Stock</span>}
        {product.stockStatus === 'sold' && <span className="absolute top-2 left-2 bg-gray-900 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-1 shadow-sm z-10">Sold Out</span>}
      </div>
      
      <h3 className="text-sm font-medium text-chester-text group-hover:text-chester-pink transition mb-1 line-clamp-1">{product.name}</h3>
      <div className="flex flex-wrap items-center gap-2">
        <p className={`text-sm font-semibold ${product.originalPrice ? 'text-chester-pink' : 'text-chester-text'}`}>
          {formatRupiah(product.price)}
        </p>
        {product.originalPrice && <p className="text-xs text-gray-400 line-through">{formatRupiah(product.originalPrice)}</p>}
      </div>
    </Link>
  );
};

export default function Catalog() {
  const [sortBy, setSortBy] = useState('terbaru');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  // State untuk Filter Sidebar
  const [priceRange, setPriceRange] = useState(1500000);
  const [availability, setAvailability] = useState('all');

  // Data produk simulasi 
  const allProducts = [
    { 
      id: 1, 
      images: [
        'https://images.unsplash.com/photo-1539008835657-9e8e9680c956?w=600',
        'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600'
      ], 
      name: 'Gaun Campuran Linen', price: 450000, originalPrice: 650000, stockStatus: 'available' 
    },
    { 
      id: 2, 
      images: [
        'https://images.unsplash.com/photo-1550639525-c97d455acf70?w=600',
        'https://images.unsplash.com/photo-1582531065972-e1d527afceef?w=600'
      ], 
      name: 'Kaos Motif Putih', price: 150000, stockStatus: 'low' 
    },
    { 
      id: 3, 
      images: ['https://images.unsplash.com/photo-1591369822096-ffd140ec948f?w=600'], 
      name: 'Celana Pendek Denim', price: 325000, stockStatus: 'available' 
    },
    { 
      id: 4, 
      images: [
        'https://images.unsplash.com/photo-1603487742131-4160ec999306?w=600',
        'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600'
      ], 
      name: 'Sandal Kulit Premium', price: 375000, stockStatus: 'sold' 
    },
    { 
      id: 5, 
      images: ['https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600'], 
      name: 'Kemeja Katun Klasik', price: 250000, stockStatus: 'available' 
    },
    { 
      id: 6, 
      images: ['https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=600'], 
      name: 'Tas Jinjing Kanvas', price: 199000, originalPrice: 299000, stockStatus: 'available' 
    },
    { 
      id: 7, 
      images: ['https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=600'], 
      name: 'Blazer Kerja Wanita', price: 550000, stockStatus: 'low' 
    },
    { 
      id: 8, 
      images: ['https://images.unsplash.com/photo-1584273143981-41c073dfe8f8?w=600'], 
      name: 'Rok Plisket Midi', price: 210000, originalPrice: 350000, stockStatus: 'sold' 
    },
  ];

  return (
    <div className="bg-white min-h-screen font-lora py-8">
      <div className="container mx-auto px-4 relative">
        
        {/* Judul Halaman & Breadcrumb */}
        <div className="mb-8 text-center md:text-left">
          <h1 className="text-3xl md:text-4xl font-bold text-chester-text mb-3">Semua Produk</h1>
          <nav className="text-xs text-gray-500 flex justify-center md:justify-start gap-2">
            <Link to="/" className="hover:text-chester-pink transition">Beranda</Link> / 
            <span className="text-chester-text font-medium">Katalog</span>
          </nav>
        </div>

        {/* Tombol Filter Mobile */}
        <button 
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          className="md:hidden w-full flex items-center justify-center gap-2 border border-gray-200 py-3 mb-6 text-sm font-semibold text-chester-text hover:bg-gray-50"
        >
          <SlidersHorizontal size={18} />
          {isFilterOpen ? 'Sembunyikan Filter' : 'Tampilkan Filter'}
        </button>

        {/* --- TATA LETAK UTAMA --- */}
        <div className="flex flex-col md:flex-row gap-8 lg:gap-12 relative items-start">
          
          {/* KOLOM KIRI: Sidebar Filter (SUDAH DIKEMBALIKAN) */}
          <aside className={`w-full md:w-64 lg:w-72 flex-shrink-0 self-start md:sticky md:top-32 ${isFilterOpen ? 'block' : 'hidden md:block'}`}>
            
            {/* Filter 1: My Collection */}
            <div className="mb-6 border-b border-gray-100 pb-6">
              <h3 className="text-sm font-bold text-chester-text mb-4 uppercase tracking-wider">My Collection</h3>
              <div className="flex flex-col gap-3">
                {['Semua Produk', 'Atasan', 'Bawahan', 'Gaun & Dress', 'Aksesoris'].map((option, index) => (
                  <label key={index} className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" className="w-4 h-4 rounded-none border-gray-300 accent-chester-pink" />
                    <span className="text-sm text-gray-600 group-hover:text-chester-pink transition">{option}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Filter 2: Availability (DIKEMBALIKAN) */}
            <div className="mb-6 border-b border-gray-100 pb-6">
              <h3 className="text-sm font-bold text-chester-text mb-4 uppercase tracking-wider">Availability</h3>
              <div className="flex flex-col gap-3">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input 
                    type="radio" 
                    name="availability" 
                    value="all"
                    checked={availability === 'all'}
                    onChange={() => setAvailability('all')}
                    className="w-4 h-4 border-gray-300 accent-chester-pink" 
                  />
                  <span className="text-sm text-gray-600 group-hover:text-chester-pink transition">All</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input 
                    type="radio" 
                    name="availability" 
                    value="instock"
                    checked={availability === 'instock'}
                    onChange={() => setAvailability('instock')}
                    className="w-4 h-4 border-gray-300 accent-chester-pink" 
                  />
                  <span className="text-sm text-gray-600 group-hover:text-chester-pink transition">In Stock</span>
                </label>
              </div>
            </div>

            {/* Filter 3: Range Harga (DIKEMBALIKAN) */}
            <div className="mb-6 border-b border-gray-100 pb-6">
              <h3 className="text-sm font-bold text-chester-text mb-4 uppercase tracking-wider">Harga</h3>
              <div className="px-1">
                <input 
                  type="range" 
                  min="0" 
                  max="3000000" 
                  step="50000" 
                  value={priceRange}
                  onChange={(e) => setPriceRange(e.target.value)}
                  className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-chester-pink"
                />
                <div className="flex justify-between items-center text-xs text-gray-500 mt-4 font-medium">
                  <span>Rp 0</span>
                  <span className="text-chester-text font-bold">{formatRupiah(priceRange)}</span>
                </div>
              </div>
            </div>

          </aside>

          {/* KOLOM KANAN: Produk & Sortir */}
          <main className="flex-1 min-w-0">
            
            {/* Top Bar: Jumlah Produk & Sortir */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-100 mb-6 gap-4">
              <p className="text-sm text-gray-500">{allProducts.length} Produk ditemukan</p>
              
              <div className="flex items-center gap-3 self-start sm:self-auto">
                <label className="text-sm font-medium text-chester-text hidden sm:block">Urutkan:</label>
                <div className="relative">
                  <select 
                    value={sortBy} 
                    onChange={(e) => setSortBy(e.target.value)}
                    className="appearance-none border border-gray-200 text-sm px-4 py-2 pr-10 focus:outline-none focus:border-chester-pink cursor-pointer bg-white min-w-[180px]"
                  >
                    <option value="unggulan">Unggulan</option>
                    <option value="terbaru">Terbaru</option>
                    <option value="termurah">Harga: Rendah ke Tinggi</option>
                    <option value="termahal">Harga: Tinggi ke Rendah</option>
                    <option value="abjad">Abjad: A - Z</option>
                  </select>
                  <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Grid Produk */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-8 md:gap-x-6 md:gap-y-10 mb-16">
              {allProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {/* Pagination Server-Side UI */}
            <div className="flex justify-center items-center gap-2 pt-8 border-t border-gray-100 font-lora">
              <button className="w-10 h-10 flex items-center justify-center border border-gray-200 text-gray-500 hover:border-chester-pink hover:text-chester-pink transition" disabled>
                <ChevronLeft size={18} />
              </button>
              
              <button className="w-10 h-10 flex items-center justify-center border border-chester-text bg-chester-text text-white font-bold text-sm">1</button>
              <button className="w-10 h-10 flex items-center justify-center border border-gray-200 text-chester-text hover:border-chester-pink hover:text-chester-pink transition font-medium text-sm">2</button>
              <button className="w-10 h-10 flex items-center justify-center border border-gray-200 text-chester-text hover:border-chester-pink hover:text-chester-pink transition font-medium text-sm">3</button>
              
              <span className="px-1 text-gray-400">...</span>
              
              <button className="w-10 h-10 flex items-center justify-center border border-gray-200 text-chester-text hover:border-chester-pink hover:text-chester-pink transition font-medium text-sm">12</button>

              <button className="w-10 h-10 flex items-center justify-center border border-gray-200 text-chester-text hover:border-chester-pink hover:text-chester-pink transition">
                <ChevronRight size={18} />
              </button>
            </div>

          </main>

        </div>
      </div>
    </div>
  );
}