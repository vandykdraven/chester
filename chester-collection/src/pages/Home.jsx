import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../api"; // Menggunakan file konfigurasi master API
import { getImageUrl } from "../utils/imageHelper";

const formatRupiah = (angka) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(angka);
};

const ProductCard = ({ slug, image, name, price, original_price }) => (
  <Link
    to={`/product/${slug}`}
    className="group font-lora block cursor-pointer"
  >
    <div className="group aspect-[4/5] overflow-hidden mb-4 bg-gray-100 rounded-lg relative">
      <img
        src={image}
        alt={name}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        onError={(e) => {
          e.currentTarget.onerror = null;
          e.currentTarget.src = "/placeholder.png";
        }}
      />
    </div>
    <p className="text-sm font-medium text-chester-text group-hover:text-chester-pink transition line-clamp-1">
      {name}
    </p>

    <div className="flex items-center gap-2 mt-1">
      <p className="text-sm font-semibold text-chester-pink">
        {original_price > 0
          ? formatRupiah(original_price)
          : formatRupiah(price)}
      </p>
      {original_price > 0 && (
        <p className="text-[11px] text-gray-400 line-through decoration-gray-300 font-medium">
          {formatRupiah(price)}
        </p>
      )}
    </div>
  </Link>
);

const Hero = ({ slides }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (!slides || slides.length === 0) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
    }, 5000);
    return () => clearInterval(timer);
  }, [slides]);

  if (!slides || slides.length === 0)
    return (
      <section className="w-full h-[400px] bg-gray-100 flex items-center justify-center">
        <p className="text-gray-400">Loading Banner...</p>
      </section>
    );

  return (
    <section className="relative w-full h-[400px] md:h-[600px] lg:h-[750px] overflow-hidden group">
      {slides.map((slide, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentSlide ? "opacity-100 z-10" : "opacity-0 z-0"}`}
        >
          <img
            src={slide}
            alt={`Banner ${index + 1}`}
            className="w-full h-full object-cover object-center"
          />
        </div>
      ))}
    </section>
  );
};

const NewArrivals = () => {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const fetchLatestProducts = async () => {
      // 1. Cek Cache di Memori
      const cachedLatest = sessionStorage.getItem("chester_latest_arrivals");
      if (cachedLatest) {
        setProducts(JSON.parse(cachedLatest));
        return;
      }

      // 2. Fetch API jika belum ada cache
      try {
        const res = await api.get(`/products`); // Menggunakan master config
        if (res.data.success) {
          const activeProducts = res.data.data.filter(
            (p) => p.status === "available",
          );
          const sortedLatest = activeProducts
            .sort((a, b) => b.id - a.id)
            .slice(0, 4);

          setProducts(sortedLatest);
          sessionStorage.setItem(
            "chester_latest_arrivals",
            JSON.stringify(sortedLatest),
          );
        }
      } catch (err) {
        console.error("Gagal load new arrivals:", err);
      }
    };
    fetchLatestProducts();
  }, []);

  return (
    <section className="py-16 font-lora">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-10">
          <h2 className="text-2xl font-bold text-chester-text">
            Kedatangan Terbaru
          </h2>
          <Link
            to="/products"
            className="text-sm text-gray-500 hover:text-chester-pink font-semibold transition underline"
          >
            Lihat Semua
          </Link>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            Belum ada produk aktif yang tersedia.
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {products.map((p) => {
              // Menggunakan fungsi getImageUrl dari helper
              const image = getImageUrl(p.primary_image);
              const price =
                p.has_variant === 1 ? Number(p.min_v_price) : Number(p.price);
              const original_price =
                p.has_variant === 1
                  ? Number(p.min_v_original_price)
                  : Number(p.original_price);

              return (
                <ProductCard
                  key={p.id}
                  slug={p.slug}
                  image={image}
                  name={p.name}
                  price={price}
                  original_price={original_price}
                />
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

const FeaturedCollection = ({ col1, col2 }) => {
  if (!col1 || !col2) return null;

  return (
    <section className="py-16 bg-chester-gray font-lora">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="relative group overflow-hidden cursor-pointer aspect-square md:aspect-auto md:h-[500px] rounded-xl shadow-md">
            <img
              src={col1.image}
              alt={col1.title}
              className="w-full h-full object-cover group-hover:scale-105 transition duration-700"
            />
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition duration-500"></div>
            <div className="absolute inset-0 flex flex-col justify-center items-center text-white p-8 text-center">
              <h3 className="text-3xl font-bold mb-3 drop-shadow-md">
                {col1.title}
              </h3>
              <Link
                to={col1.linkUrl || "/products"}
                className="border-b-2 border-white pb-1 text-sm font-semibold hover:text-chester-pink hover:border-chester-pink transition mt-4 uppercase drop-shadow-md"
              >
                {col1.linkText}
              </Link>
            </div>
          </div>

          <div className="relative group overflow-hidden cursor-pointer aspect-square md:aspect-auto md:h-[500px] rounded-xl shadow-md">
            <img
              src={col2.image}
              alt={col2.title}
              className="w-full h-full object-cover group-hover:scale-105 transition duration-700"
            />
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition duration-500"></div>
            <div className="absolute inset-0 flex flex-col justify-center items-center text-white p-8 text-center">
              <h3 className="text-3xl font-bold mb-3 drop-shadow-md">
                {col2.title}
              </h3>
              <Link
                to={col2.linkUrl || "/products"}
                className="border-b-2 border-white pb-1 text-sm font-semibold hover:text-chester-pink hover:border-chester-pink transition mt-4 uppercase drop-shadow-md"
              >
                {col2.linkText}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default function Home() {
  const [homeData, setHomeData] = useState({
    heroSlides: [],
    feat1: null,
    feat2: null,
  });

  useEffect(() => {
    const fetchHomeConfig = async () => {
      // 1. Cek Cache Pengaturan Beranda
      const cachedConfig = sessionStorage.getItem("chester_home_config");
      if (cachedConfig) {
        setHomeData(JSON.parse(cachedConfig));
        return;
      }

      // 2. Fetch API jika tidak ada di memori
      try {
        const res = await api.get(`/settings`);
        if (res.data.success) {
          let apiData = res.data.data;
          if (Array.isArray(apiData)) {
            const mapped = {};
            apiData.forEach((i) => (mapped[i.setting_key] = i.setting_value));
            apiData = mapped;
          }

          const parsedData = {
            heroSlides: apiData.hero_banners
              ? JSON.parse(apiData.hero_banners)
              : [
                  "https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=2070&auto=format&fit=crop",
                  "https://images.unsplash.com/photo-1496747611176-843222e1e57c?q=80&w=2073&auto=format&fit=crop",
                ],
            feat1: apiData.featured_collection_1
              ? JSON.parse(apiData.featured_collection_1)
              : {
                  image:
                    "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=1200",
                  title: "Kebutuhan Musim Panas",
                  linkText: "Belanja Koleksi",
                  linkUrl: "/products",
                },
            feat2: apiData.featured_collection_2
              ? JSON.parse(apiData.featured_collection_2)
              : {
                  image:
                    "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=1200",
                  title: "Denim Harian",
                  linkText: "Belanja Koleksi",
                  linkUrl: "/products",
                },
          };

          setHomeData(parsedData);
          sessionStorage.setItem(
            "chester_home_config",
            JSON.stringify(parsedData),
          );
        }
      } catch (err) {
        console.error("Gagal menarik konfigurasi beranda:", err);
      }
    };
    fetchHomeConfig();
  }, []);

  return (
    <main className="animate-fade-in">
      <Hero slides={homeData.heroSlides} />
      <NewArrivals />
      <FeaturedCollection col1={homeData.feat1} col2={homeData.feat2} />
    </main>
  );
}
