import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Minus, Share2, ChevronLeft, ChevronRight } from 'lucide-react';

const formatRupiah = (angka) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
};

const dummyProduct = {
  name: 'Classic Rose Sweater',
  price: 499000,
  images: [
    'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1550639525-c97d455acf70?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1584273143981-41c073dfe8f8?q=80&w=1200&auto=format&fit=crop'
  ],
  colors: ['Rose Pink', 'Oatmeal', 'Navy'],
  sizes: ['S', 'M', 'L', 'XL'],
  description: 'Sweater rajut berdesain klasik dengan potongan longgar yang nyaman. Terbuat dari campuran katun dan wol premium untuk menjaga Anda tetap hangat tanpa terasa berat. Pilihan tepat untuk gaya kasual sehari-hari.',
  materials: '50% Cotton, 30% Acrylic, 20% Wool.\nCuci mesin dengan air dingin putaran lembut. Jangan gunakan pemutih.',
  shipping: 'Gratis pengiriman untuk pesanan di atas Rp 500.000.\nEstimasi pengiriman 2-3 hari kerja untuk area Jabodetabek.'
};

const relatedProducts = [
  { id: 2, image: 'https://images.unsplash.com/photo-1550639525-c97d455acf70?w=600', name: 'Kaos Motif Putih', price: 150000, stockStatus: 'low' },
  { id: 3, image: 'https://images.unsplash.com/photo-1591369822096-ffd140ec948f?w=600', name: 'Celana Pendek Denim', price: 325000, originalPrice: 400000, stockStatus: 'available' },
  { id: 5, image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600', name: 'Kemeja Katun Klasik', price: 250000, stockStatus: 'available' },
  { id: 7, image: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=600', name: 'Blazer Kerja Wanita', price: 550000, originalPrice: 750000, stockStatus: 'sold' },
];

export default function ProductPage() {
  const [selectedColor, setSelectedColor] = useState(dummyProduct.colors[0]);
  const [selectedSize, setSelectedSize] = useState('M');
  const [quantity, setQuantity] = useState(1);
  
  const [currentImgIndex, setCurrentImgIndex] = useState(0);
  const [zoomStyle, setZoomStyle] = useState({ transformOrigin: 'center', transform: 'scale(1)' });

  const updateQuantity = (type) => {
    if (type === 'plus') setQuantity(prev => prev + 1);
    else setQuantity(prev => (prev > 1 ? prev - 1 : 1));
  };

  const nextImage = () => setCurrentImgIndex((prev) => (prev + 1) % dummyProduct.images.length);
  const prevImage = () => setCurrentImgIndex((prev) => (prev - 1 + dummyProduct.images.length) % dummyProduct.images.length);

  const handleMouseMove = (e) => {
    // PERBAIKAN: Matikan zoom jika ukuran layar lebih kecil dari 768px (layar HP)
    if (window.innerWidth < 768) return;

    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    
    setZoomStyle({
      transformOrigin: `${x}% ${y}%`,
      transform: 'scale(2)'
    });
  };

  const handleMouseLeave = () => {
    setZoomStyle({ transformOrigin: 'center', transform: 'scale(1)' });
  };

  return (
    <div className="bg-white min-h-screen font-lora">
      <div className="container mx-auto px-4 py-8">
        
        <nav className="text-xs text-gray-500 mb-8 flex gap-2">
          <Link to="/" className="hover:text-chester-pink">Beranda</Link> / 
          <Link to="/products" className="hover:text-chester-pink">Pakaian</Link> / 
          <span className="text-chester-text font-medium">{dummyProduct.name}</span>
        </nav>

        <div className="flex flex-col md:flex-row gap-10 lg:gap-16 items-start">
          
          <div className="w-full md:w-1/2 flex flex-col gap-4">
            
            <div 
              className="relative w-full aspect-[3/4] bg-gray-50 overflow-hidden cursor-crosshair group"
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            >
              <img 
                src={dummyProduct.images[currentImgIndex]} 
                alt={`${dummyProduct.name} Main`} 
                className="w-full h-full object-cover transition-transform duration-200 ease-out"
                style={zoomStyle} 
              />
              
              {/* PERBAIKAN: opacity-100 diubah agar di HP panah ini selalu muncul, tidak perlu hover */}
              <button 
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); prevImage(); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 hover:bg-white text-chester-text flex items-center justify-center opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <ChevronLeft size={20} />
              </button>
              <button 
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); nextImage(); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 hover:bg-white text-chester-text flex items-center justify-center opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <ChevronRight size={20} />
              </button>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-2">
              {dummyProduct.images.map((img, index) => (
                <button 
                  key={index} 
                  onClick={() => setCurrentImgIndex(index)}
                  className={`w-20 lg:w-24 aspect-[3/4] flex-shrink-0 bg-gray-50 border-2 transition-all ${currentImgIndex === index ? 'border-chester-pink' : 'border-transparent hover:border-gray-200'}`}
                >
                  <img src={img} alt={`Thumbnail ${index + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>

          </div>

          <div className="w-full md:w-1/2">
            <h1 className="text-3xl lg:text-4xl font-bold text-chester-text mb-4 leading-tight">{dummyProduct.name}</h1>
            <p className="text-2xl text-chester-text font-medium mb-8">{formatRupiah(dummyProduct.price)}</p>

            <div className="mb-6">
              <p className="text-sm font-bold text-chester-text mb-3 uppercase tracking-wider">Warna: <span className="font-normal text-gray-500 capitalize">{selectedColor}</span></p>
              <div className="flex gap-3">
                {dummyProduct.colors.map(color => (
                  <button 
                    key={color} 
                    onClick={() => setSelectedColor(color)}
                    className={`px-6 py-2.5 text-xs font-semibold uppercase tracking-wider border transition ${selectedColor === color ? 'border-chester-text bg-chester-text text-white' : 'border-gray-200 text-chester-text hover:border-gray-400'}`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-8">
              <div className="flex justify-between items-center mb-3">
                <p className="text-sm font-bold text-chester-text uppercase tracking-wider">Ukuran: <span className="font-normal text-gray-500">{selectedSize}</span></p>
                <button className="text-xs text-gray-500 underline hover:text-chester-pink">Panduan Ukuran</button>
              </div>
              <div className="flex gap-2">
                {dummyProduct.sizes.map(size => (
                  <button 
                    key={size} 
                    onClick={() => setSelectedSize(size)}
                    className={`w-12 h-12 flex items-center justify-center text-sm font-bold border transition ${selectedSize === size ? 'border-chester-text bg-chester-text text-white' : 'border-gray-200 text-chester-text hover:border-gray-400'}`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-4 mb-12">
              <div className="flex items-center border border-gray-300 w-full md:w-32 h-14 md:h-12">
                <button onClick={() => updateQuantity('minus')} className="w-12 md:w-10 h-full flex justify-center items-center text-gray-500 hover:text-chester-text"><Minus size={16} /></button>
                <span className="flex-1 text-center font-bold text-sm">{quantity}</span>
                <button onClick={() => updateQuantity('plus')} className="w-12 md:w-10 h-full flex justify-center items-center text-gray-500 hover:text-chester-text"><Plus size={16} /></button>
              </div>
              
              <button className="w-full bg-chester-pink text-white h-14 font-bold text-sm uppercase tracking-widest hover:bg-gray-900 transition duration-300">Tambah ke Keranjang</button>
              <button className="w-full bg-white text-chester-text border-2 border-chester-text h-14 font-bold text-sm uppercase tracking-widest hover:bg-gray-50 transition duration-300">Beli Sekarang</button>
            </div>

            <div className="pt-8 border-t border-gray-100">
              <div className="mb-6">
                <h3 className="text-sm font-bold text-chester-text uppercase tracking-wider mb-3">Deskripsi Produk</h3>
                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{dummyProduct.description}</p>
              </div>
              <div className="mb-6">
                <h3 className="text-sm font-bold text-chester-text uppercase tracking-wider mb-3">Bahan & Perawatan</h3>
                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{dummyProduct.materials}</p>
              </div>
              <div>
                <h3 className="text-sm font-bold text-chester-text uppercase tracking-wider mb-3">Pengiriman</h3>
                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{dummyProduct.shipping}</p>
              </div>
            </div>

            <div className="mt-10 pt-6 border-t border-gray-100 flex items-center gap-2 text-sm text-gray-500 cursor-pointer hover:text-chester-pink transition w-fit">
              <Share2 size={16} />
              <span className="underline font-medium">Bagikan Produk Ini</span>
            </div>

          </div>
        </div>

        {/* --- BAGIAN PRODUK TERKAIT --- */}
        <div className="mt-24 pt-16 border-t border-gray-100">
          <div className="flex justify-between items-end mb-10">
            <h2 className="text-2xl lg:text-3xl font-bold text-chester-text">Produk Terkait</h2>
            <Link to="/products" className="text-sm font-semibold text-gray-500 hover:text-chester-pink underline hidden sm:block">Lihat Semua</Link>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {relatedProducts.map(product => (
              <Link key={product.id} to={`/product/${product.id}`} className="group font-lora block cursor-pointer">
                <div className="aspect-square overflow-hidden mb-4 bg-gray-100 relative">
                  <img 
                    src={product.image} 
                    alt={product.name} 
                    className={`w-full h-full object-cover transition-transform duration-500 ${product.stockStatus === 'sold' ? 'opacity-70 grayscale' : 'group-hover:scale-105'}`} 
                  />
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
            ))}
          </div>
          <Link to="/products" className="sm:hidden block mt-8 text-center text-sm font-bold text-chester-text border border-chester-text py-3 uppercase tracking-widest">
            Lihat Semua Produk
          </Link>
        </div>

      </div>
    </div>
  );
}