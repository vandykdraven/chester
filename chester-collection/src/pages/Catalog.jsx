import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  SlidersHorizontal,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Search,
} from "lucide-react";
import api from "../api"; // Menggunakan konfigurasi master API
import { getImageUrl } from "../utils/imageHelper"; // Standarisasi gambar

const formatRupiah = (angka) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(angka);
};

const ProductCard = ({ product }) => {
  const [currentImgIndex, setCurrentImgIndex] = useState(0);
  const timeoutRef = useRef(null);
  const intervalRef = useRef(null);

  // Menggunakan helper secara langsung dan menghilangkan BASE_URL string yang statis
  const images = [getImageUrl(product.primary_image)];

  const handleMouseEnter = () => {
    if (!window.matchMedia("(hover: hover)").matches || images.length <= 1)
      return;
    timeoutRef.current = setTimeout(() => {
      intervalRef.current = setInterval(() => {
        setCurrentImgIndex((prev) => (prev + 1) % images.length);
      }, 800);
    }, 400);
  };

  const handleMouseLeave = () => {
    clearTimeout(timeoutRef.current);
    clearInterval(intervalRef.current);
    setCurrentImgIndex(0);
  };

  let stockStatus = "available";
  const totalStock =
    product.has_variant === 1 ? product.total_v_stock : product.stock;
  if (totalStock === 0) stockStatus = "sold";
  else if (totalStock > 0 && totalStock <= 5) stockStatus = "low";

  const currentPrice =
    product.has_variant === 1
      ? Number(product.min_v_price || 0)
      : Number(product.price || 0);
  const currentOriginalPrice =
    product.has_variant === 1
      ? Number(product.min_v_original_price || 0)
      : Number(product.original_price || 0);

  return (
    <Link
      to={`/product/${product.slug}`}
      className="group font-lora block cursor-pointer"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="group aspect-square overflow-hidden mb-4 bg-gray-100 relative rounded-lg">
        <div className="w-full h-full transition-transform duration-500 group-hover:scale-105">
          <div
            className="flex w-full h-full transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${currentImgIndex * 100}%)` }}
          >
            {images.map((img, idx) => (
              <div key={idx} className="w-full h-full flex-shrink-0">
                <img
                  src={img}
                  alt={`${product.name} ${idx + 1}`}
                  className={`w-full h-full object-cover ${stockStatus === "sold" ? "opacity-70 grayscale" : ""}`}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = "/placeholder.png";
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        {stockStatus === "available" && (
          <span className="absolute top-2 left-2 bg-white text-chester-text text-[10px] font-bold uppercase tracking-wider px-2 py-1 shadow-sm border border-gray-100 z-10 rounded">
            Tersedia
          </span>
        )}
        {stockStatus === "low" && (
          <span className="absolute top-2 left-2 bg-orange-100 text-orange-800 text-[10px] font-bold uppercase tracking-wider px-2 py-1 shadow-sm z-10 rounded">
            Stok Menipis
          </span>
        )}
        {stockStatus === "sold" && (
          <span className="absolute top-2 left-2 bg-gray-900 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-1 shadow-sm z-10 rounded">
            Habis
          </span>
        )}
      </div>

      <h3 className="text-sm font-medium text-chester-text group-hover:text-chester-pink transition mb-1 line-clamp-1">
        {product.name}
      </h3>

      <div className="flex flex-wrap items-center gap-2 mt-1">
        <p className="text-sm font-semibold text-chester-pink">
          {currentOriginalPrice > 0
            ? formatRupiah(currentOriginalPrice)
            : formatRupiah(currentPrice)}
        </p>

        {currentOriginalPrice > 0 && (
          <p className="text-[11px] text-gray-400 line-through decoration-gray-300 font-medium">
            {formatRupiah(currentPrice)}
          </p>
        )}
      </div>
    </Link>
  );
};

export default function Catalog() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [sortBy, setSortBy] = useState("terbaru");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [priceRange, setPriceRange] = useState(3000000);
  const [availability, setAvailability] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState([]);

  const location = useLocation();

  useEffect(() => {
    // Cache memori khusus untuk kategori filter
    const cachedCategories = sessionStorage.getItem("chester_categories");
    if (cachedCategories) {
      setCategories(JSON.parse(cachedCategories));
    } else {
      api.get(`/categories`).then((res) => {
        if (res.data.success) {
          setCategories(res.data.data);
          sessionStorage.setItem(
            "chester_categories",
            JSON.stringify(res.data.data),
          );
        }
      });
    }
  }, []);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const categoryParam = searchParams.get("category");

    if (categoryParam) {
      const slugs = categoryParam.split(",");
      setSelectedCategories(slugs);
      setPage(1);
    } else {
      setSelectedCategories([]);
    }
  }, [location.search]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchProducts();
    }, 400);
    return () => clearTimeout(delayDebounceFn);
  }, [page, sortBy, availability, selectedCategories, priceRange, searchQuery]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page,
        limit: 12,
        sortBy: sortBy,
        availability: availability,
        maxPrice: priceRange,
        search: searchQuery,
      });

      if (selectedCategories.length > 0) {
        params.append("category", selectedCategories.join(","));
      }

      // Menggunakan file konfigurasi master api
      const response = await api.get(`/products?${params.toString()}`);

      if (response.data.success) {
        setProducts(response.data.data);
        setTotalPages(response.data.pagination.totalPages);
        setTotalItems(response.data.pagination.totalItems);
      }
    } catch (error) {
      console.error("Gagal memuat produk:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (setter, value) => {
    setter(value);
    setPage(1);
  };

  const handleCategoryToggle = (categorySlug) => {
    setSelectedCategories((prev) => {
      const isExist = prev.includes(categorySlug);
      setPage(1);
      return isExist
        ? prev.filter((slug) => slug !== categorySlug)
        : [...prev, categorySlug];
    });
  };

  const renderPaginationNumbers = () => {
    let pages = [];
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) {
        pages.push(i);
      } else if (i === page - 2 || i === page + 2) {
        pages.push("...");
      }
    }
    pages = pages.filter(
      (item, index) => item !== "..." || pages[index - 1] !== "...",
    );

    return pages.map((pageNum, index) => {
      if (pageNum === "...")
        return (
          <span key={`dots-${index}`} className="px-1 text-gray-400">
            ...
          </span>
        );
      return (
        <button
          key={pageNum}
          onClick={() => {
            setPage(pageNum);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className={`w-10 h-10 flex items-center justify-center border font-medium text-sm rounded transition ${page === pageNum ? "border-chester-text bg-chester-text text-white font-bold" : "border-gray-200 text-chester-text hover:border-chester-pink hover:text-chester-pink"}`}
        >
          {pageNum}
        </button>
      );
    });
  };

  return (
    <div className="bg-white min-h-screen font-lora py-8">
      <div className="container mx-auto px-4 relative max-w-7xl">
        <div className="mb-8 text-center md:text-left flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-chester-text mb-3">
              Semua Produk
            </h1>
            <nav className="text-xs text-gray-500 flex justify-center md:justify-start gap-2">
              <Link to="/" className="hover:text-chester-pink transition">
                Beranda
              </Link>{" "}
              /<span className="text-chester-text font-medium">Katalog</span>
            </nav>
          </div>
          <div className="relative w-full md:w-72">
            <input
              type="text"
              placeholder="Cari produk..."
              value={searchQuery}
              onChange={(e) =>
                handleFilterChange(setSearchQuery, e.target.value)
              }
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-chester-pink"
            />
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
          </div>
        </div>

        <button
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          className="md:hidden w-full flex items-center justify-center gap-2 border border-gray-200 py-3 mb-6 text-sm font-semibold text-chester-text hover:bg-gray-50 rounded-lg"
        >
          <SlidersHorizontal size={18} />{" "}
          {isFilterOpen ? "Sembunyikan Filter" : "Tampilkan Filter"}
        </button>

        <div className="flex flex-col md:flex-row gap-8 lg:gap-12 relative items-start">
          <aside
            className={`w-full md:w-64 lg:w-72 flex-shrink-0 self-start md:sticky md:top-32 ${isFilterOpen ? "block" : "hidden md:block"}`}
          >
            <div className="mb-6 border-b border-gray-100 pb-6">
              <h3 className="text-sm font-bold text-chester-text mb-4 uppercase tracking-wider">
                Kategori
              </h3>
              <div className="flex flex-col gap-3">
                {categories.map((cat) => (
                  <label
                    key={cat.id}
                    className="flex items-center gap-3 cursor-pointer group"
                  >
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(cat.slug)}
                      onChange={() => handleCategoryToggle(cat.slug)}
                      className="w-4 h-4 rounded-none border-gray-300 accent-chester-pink"
                    />
                    <span className="text-sm text-gray-600 group-hover:text-chester-pink transition">
                      {cat.name}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="mb-6 border-b border-gray-100 pb-6">
              <h3 className="text-sm font-bold text-chester-text mb-4 uppercase tracking-wider">
                Availability
              </h3>
              <div className="flex flex-col gap-3">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="radio"
                    value="all"
                    checked={availability === "all"}
                    onChange={() => handleFilterChange(setAvailability, "all")}
                    className="w-4 h-4 border-gray-300 accent-chester-pink"
                  />
                  <span className="text-sm text-gray-600 group-hover:text-chester-pink transition">
                    Semua Produk
                  </span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="radio"
                    value="instock"
                    checked={availability === "instock"}
                    onChange={() =>
                      handleFilterChange(setAvailability, "instock")
                    }
                    className="w-4 h-4 border-gray-300 accent-chester-pink"
                  />
                  <span className="text-sm text-gray-600 group-hover:text-chester-pink transition">
                    Stok Tersedia
                  </span>
                </label>
              </div>
            </div>

            <div className="mb-6 border-b border-gray-100 pb-6">
              <h3 className="text-sm font-bold text-chester-text mb-4 uppercase tracking-wider">
                Harga Maksimal
              </h3>
              <div className="px-1">
                <input
                  type="range"
                  min="0"
                  max="3000000"
                  step="50000"
                  value={priceRange}
                  onChange={(e) =>
                    handleFilterChange(setPriceRange, e.target.value)
                  }
                  className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-chester-pink"
                />
                <div className="flex justify-between items-center text-xs text-gray-500 mt-4 font-medium">
                  <span>Rp 0</span>
                  <span className="text-chester-text font-bold">
                    {formatRupiah(priceRange)}
                  </span>
                </div>
              </div>
            </div>
          </aside>

          <main className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-100 mb-6 gap-4">
              <p className="text-sm text-gray-500">
                {totalItems} Produk ditemukan
              </p>
              <div className="flex items-center gap-3 self-start sm:self-auto">
                <label className="text-sm font-medium text-chester-text hidden sm:block">
                  Urutkan:
                </label>
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) =>
                      handleFilterChange(setSortBy, e.target.value)
                    }
                    className="appearance-none border border-gray-200 rounded-lg text-sm px-4 py-2.5 pr-10 focus:outline-none focus:border-chester-pink cursor-pointer bg-white min-w-[180px]"
                  >
                    <option value="terbaru">Terbaru</option>
                    <option value="termurah">Harga: Rendah ke Tinggi</option>
                    <option value="termahal">Harga: Tinggi ke Rendah</option>
                    <option value="abjad">Abjad: A - Z</option>
                  </select>
                  <ChevronDown
                    size={16}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  />
                </div>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-chester-pink"></div>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-20 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                <h3 className="text-lg font-bold text-gray-800 mb-2">
                  Produk Tidak Ditemukan
                </h3>
                <p className="text-gray-500 text-sm">
                  Coba sesuaikan kata kunci atau filter pencarian Anda.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-8 md:gap-x-6 md:gap-y-10 mb-16">
                {products.map((product) => (
                  <ProductCard key={product.slug} product={product} />
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 pt-8 border-t border-gray-100 font-lora">
                <button
                  onClick={() => {
                    setPage((p) => Math.max(1, p - 1));
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  disabled={page === 1}
                  className="w-10 h-10 flex items-center justify-center border border-gray-200 text-gray-500 hover:border-chester-pink hover:text-chester-pink transition rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={18} />
                </button>

                {renderPaginationNumbers()}

                <button
                  onClick={() => {
                    setPage((p) => Math.min(totalPages, p + 1));
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  disabled={page === totalPages}
                  className="w-10 h-10 flex items-center justify-center border border-gray-200 text-gray-500 hover:border-chester-pink hover:text-chester-pink transition rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
