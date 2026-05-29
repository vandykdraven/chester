import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const formatRupiah = (angka) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
};

const ProductCard = ({ image, name, price }) => (
  <Link to="/product/1" className="group font-lora block cursor-pointer">
    <div className="aspect-square overflow-hidden mb-4 bg-gray-100">
      <img src={image} alt={name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
    </div>
    <p className="text-sm font-medium text-chester-text group-hover:text-chester-pink transition">{name}</p>
    <p className="text-sm font-semibold text-chester-text mt-1">{formatRupiah(price)}</p>
  </Link>
);

const Hero = () => {
  const slides = [
    "https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=2070&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1496747611176-843222e1e57c?q=80&w=2073&auto=format&fit=crop"
  ];
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <section className="relative w-full h-[400px] md:h-[600px] lg:h-[750px] overflow-hidden group">
      {slides.map((slide, index) => (
        <div key={index} className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
          <img src={slide} alt={`Banner ${index + 1}`} className="w-full h-full object-cover object-center" />
        </div>
      ))}
    </section>
  );
};

const NewArrivals = () => {
  const products = [
    { id: 1, image: 'https://images.unsplash.com/photo-1539008835657-9e8e9680c956?w=600', name: 'Gaun Campuran Linen', price: 450000 },
    { id: 2, image: 'https://images.unsplash.com/photo-1550639525-c97d455acf70?w=600', name: 'Kaos Motif Putih', price: 150000 },
    { id: 3, image: 'https://images.unsplash.com/photo-1591369822096-ffd140ec948f?w=600', name: 'Celana Pendek Denim', price: 325000 },
    { id: 4, image: 'https://images.unsplash.com/photo-1603487742131-4160ec999306?w=600', name: 'Sandal Kulit Premium', price: 375000 },
  ];

  return (
    <section className="py-16 font-lora">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-10">
          <h2 className="text-2xl font-bold text-chester-text">Kedatangan Terbaru</h2>
          <Link to="/products" className="text-sm text-gray-500 hover:text-chester-pink font-semibold transition">Lihat Semua</Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {products.map(product => <ProductCard key={product.id} {...product} />)}
        </div>
      </div>
    </section>
  );
};

const FeaturedCollection = () => (
  <section className="py-16 bg-chester-gray font-lora">
    <div className="container mx-auto px-4">
      <div className="grid md:grid-cols-2 gap-8">
        <div className="relative group overflow-hidden cursor-pointer aspect-square md:aspect-auto md:h-[500px]">
          <img src="https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=1200" alt="Koleksi" className="w-full h-full object-cover group-hover:scale-105 transition duration-700" />
          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition duration-500"></div>
          <div className="absolute inset-0 flex flex-col justify-center items-center text-white p-8">
            <h3 className="text-3xl font-bold mb-3">Kebutuhan Musim Panas</h3>
            <Link to="/products" className="border-b-2 border-white pb-1 text-sm font-semibold hover:text-chester-pink hover:border-chester-pink transition mt-4 uppercase">Belanja Koleksi</Link>
          </div>
        </div>
        {/* Sisipan koleksi kedua dipersingkat untuk kerapian */}
        <div className="relative group overflow-hidden cursor-pointer aspect-square md:aspect-auto md:h-[500px]">
          <img src="https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=1200" alt="Koleksi" className="w-full h-full object-cover group-hover:scale-105 transition duration-700" />
          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition duration-500"></div>
          <div className="absolute inset-0 flex flex-col justify-center items-center text-white p-8">
            <h3 className="text-3xl font-bold mb-3">Denim Harian</h3>
            <Link to="/products" className="border-b-2 border-white pb-1 text-sm font-semibold hover:text-chester-pink hover:border-chester-pink transition mt-4 uppercase">Belanja Koleksi</Link>
          </div>
        </div>
      </div>
    </div>
  </section>
);

export default function Home() {
  return (
    <main>
      <Hero />
      <NewArrivals />
      <FeaturedCollection />
    </main>
  );
}