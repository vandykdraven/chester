import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  Plus,
  Minus,
  Share2,
  ChevronLeft,
  ChevronRight,
  Heart,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import axios from "axios";

const formatRupiah = (angka) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(angka);
};

const getYouTubeEmbedUrl = (url) => {
  if (!url) return null;
  const ytRegex =
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
  const match = url.match(ytRegex);
  if (match && match[1]) {
    return `https://www.youtube.com/embed/${match[1]}?autoplay=1&mute=1&loop=1&playlist=${match[1]}`;
  }
  return url;
};

export default function ProductPage() {
  // DIPERBARUI: Menangkap 'slug' dari URL, bukan lagi 'id'
  const { slug } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);

  const [currentImgIndex, setCurrentImgIndex] = useState(0);
  const [zoomStyle, setZoomStyle] = useState({
    transformOrigin: "center",
    transform: "scale(1)",
  });

  const [isWishlisted, setIsWishlisted] = useState(false);
  const [customAlert, setCustomAlert] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const BASE_URL = import.meta.env.VITE_API_URL.replace("/api", "");
  const customerUser = JSON.parse(
    localStorage.getItem("customerUser") ||
      sessionStorage.getItem("customerUser"),
  );

  // DIPERBARUI: Memantau perubahan 'slug'
  useEffect(() => {
    fetchProductDetails();
    // checkWishlistStatus dipanggil dari dalam fetchProductDetails setelah ID asli didapatkan
  }, [slug]);

  const showAlert = (message, type = "success") => {
    setCustomAlert({ show: true, message, type });
    setTimeout(
      () => setCustomAlert({ show: false, message: "", type: "success" }),
      3000,
    );
  };

  const fetchProductDetails = async () => {
    setLoading(true);
    try {
      // DIPERBARUI: Memanggil backend dengan parameter 'slug'
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/products/${slug}`,
      );
      if (res.data.success) {
        const prodData = res.data.data;
        const allImages =
          prodData.images && prodData.images.length > 0
            ? prodData.images.map((img) => `${BASE_URL}${img.image_url}`)
            : [];

        setProduct({
          ...prodData,
          displayImages:
            allImages.length > 0 ? allImages : ["/placeholder.png"],
        });

        if (prodData.variants && prodData.variants.length > 0) {
          setSelectedVariant(prodData.variants[0]);
        }

        // DIPERBARUI: Meneruskan ID produk asli agar tidak muncul di produk terkait
        fetchRelatedProducts(prodData.category_id, prodData.id);

        // DIPERBARUI: Mengecek wishlist menggunakan ID produk asli
        if (customerUser) {
          checkWishlistStatus(prodData.id);
        }
      }
    } catch (error) {
      console.error("Gagal memuat produk:", error);
    } finally {
      setLoading(false);
    }
  };

  // DIPERBARUI: Menerima parameter currentProductId
  const fetchRelatedProducts = async (categoryId, currentProductId) => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/products`);
      if (res.data.success) {
        // Hindari menampilkan produk yang sedang dibuka menggunakan ID asli
        let filtered = res.data.data.filter((p) => p.id !== currentProductId);
        if (categoryId) {
          const sameCat = filtered.filter((p) => p.category_id === categoryId);
          if (sameCat.length > 0) filtered = sameCat;
        }
        setRelatedProducts(filtered.slice(0, 4));
      }
    } catch (error) {
      console.error("Gagal memuat produk terkait.");
    }
  };

  // DIPERBARUI: Menerima parameter currentProductId
  const checkWishlistStatus = async (currentProductId) => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/users/${customerUser.id}/wishlists`,
      );
      if (res.data.success) {
        const isExist = res.data.data.some(
          (w) => w.product_id === currentProductId,
        );
        setIsWishlisted(isExist);
      }
    } catch (error) {
      console.error("Gagal mengecek status wishlist");
    }
  };

  const toggleWishlist = async () => {
    if (!customerUser) {
      showAlert("Silakan login untuk menyimpan produk ke Wishlist.", "error");
      setTimeout(() => navigate("/login"), 2000);
      return;
    }

    try {
      if (isWishlisted) {
        navigate("/wishlist");
      } else {
        const res = await axios.post(
          `${import.meta.env.VITE_API_URL}/wishlists`,
          {
            user_id: customerUser.id,
            product_id: product.id, // DIPERBARUI: Menggunakan ID dari state
          },
        );
        if (res.data.success) {
          setIsWishlisted(true);
          showAlert("Produk ditambahkan ke Wishlist!", "success");
        }
      }
    } catch (error) {
      showAlert(
        error.response?.data?.message || "Gagal mengubah status Wishlist.",
        "error",
      );
    }
  };

  const updateQuantity = (type) => {
    if (type === "plus") setQuantity((prev) => prev + 1);
    else setQuantity((prev) => (prev > 1 ? prev - 1 : 1));
  };

  const handleAddToCart = async () => {
    if (!customerUser) {
      showAlert("Silakan login untuk menambahkan ke keranjang.", "error");
      setTimeout(() => navigate("/login"), 2000);
      return;
    }

    if (product.has_variant === 1 && !selectedVariant) {
      showAlert("Silakan pilih variasi produk terlebih dahulu.", "error");
      return;
    }

    try {
      const payload = {
        user_id: customerUser.id,
        product_id: product.id,
        variant_id: selectedVariant ? selectedVariant.id : null,
        quantity: quantity,
      };

      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/carts`,
        payload,
      );

      if (res.data.success) {
        showAlert("Berhasil ditambahkan ke keranjang!", "success");
        window.dispatchEvent(new Event("cartUpdated"));

        // ---> TAMBAHAN META PIXEL: AddToCart <---
        try {
          if (window.fbq) {
            const trackPrice = selectedVariant
              ? Number(selectedVariant.price || 0)
              : Number(product.price || 0);

            window.fbq("track", "AddToCart", {
              content_name: product.name,
              content_ids: [product.id],
              content_type: "product",
              value: trackPrice * quantity, // Total harga item x jumlah
              currency: "IDR",
            });
          }
        } catch (fbqError) {
          console.error("Meta Pixel Error (AddToCart):", fbqError);
        }
        // ----------------------------------------
      }
    } catch (error) {
      console.error("Gagal tambah keranjang:", error);
      showAlert("Terjadi kesalahan saat menambah ke keranjang.", "error");
    }
  };

  const handleBuyNow = async () => {
    if (!customerUser) {
      showAlert("Silakan login untuk memproses pesanan.", "error");
      setTimeout(() => navigate("/login"), 2000);
      return;
    }

    if (product.has_variant === 1 && !selectedVariant) {
      showAlert("Silakan pilih variasi produk terlebih dahulu.", "error");
      return;
    }

    try {
      const payload = {
        user_id: customerUser.id,
        product_id: product.id,
        variant_id: selectedVariant ? selectedVariant.id : null,
        quantity: quantity,
      };

      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/carts`,
        payload,
      );
      try {
        if (window.fbq) {
          const trackPrice = selectedVariant
            ? Number(selectedVariant.price || 0)
            : Number(product.price || 0);

          window.fbq("track", "AddToCart", {
            content_name: product.name,
            content_ids: [product.id],
            content_type: "product",
            value: trackPrice * quantity, // Total harga item x jumlah
            currency: "IDR",
          });
        }
      } catch (fbqError) {
        console.error("Meta Pixel Error (AddToCart):", fbqError);
      }
      if (res.data.success) {
        window.dispatchEvent(new Event("cartUpdated"));
        navigate("/checkout");
      }
    } catch (error) {
      console.error("Gagal Beli Sekarang:", error);
      showAlert("Terjadi kesalahan saat memproses Beli Sekarang.", "error");
    }
  };

  const handleShare = async () => {
    if (!product) return;
    const shareData = {
      title: product.name,
      text: `Cek produk mroblong keren ini: ${product.name}`,
      url: window.location.href,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        showAlert("Link produk berhasil disalin!", "success");
      }
    } catch (err) {
      if (err.name !== "AbortError") console.error("Terjadi kesalahan:", err);
    }
  };

  const nextImage = () =>
    setCurrentImgIndex((prev) => (prev + 1) % product.displayImages.length);
  const prevImage = () =>
    setCurrentImgIndex(
      (prev) =>
        (prev - 1 + product.displayImages.length) %
        product.displayImages.length,
    );

  const handleMouseMove = (e) => {
    if (window.innerWidth < 768) return;
    const { left, top, width, height } =
      e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomStyle({ transformOrigin: `${x}% ${y}%`, transform: "scale(2)" });
  };
  const handleMouseLeave = () =>
    setZoomStyle({ transformOrigin: "center", transform: "scale(1)" });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-chester-pink"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <h2 className="text-2xl font-bold">Produk Tidak Ditemukan</h2>
        <Link to="/products" className="text-chester-pink underline">
          Kembali Belanja
        </Link>
      </div>
    );
  }

  const currentPrice = selectedVariant
    ? Number(selectedVariant.price || 0)
    : Number(product.price || 0);
  const currentOriginalPrice = selectedVariant
    ? Number(selectedVariant.original_price || 0)
    : Number(product.original_price || 0);

  return (
    <div className="bg-white min-h-screen font-lora relative">
      {customAlert.show && (
        <div className="fixed top-6 right-6 z-50 animate-bounce">
          <div
            className={`flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-xl border text-sm font-semibold text-white ${customAlert.type === "success" ? "bg-emerald-500 border-emerald-400" : "bg-rose-500 border-rose-400"}`}
          >
            {customAlert.type === "success" ? (
              <CheckCircle size={20} />
            ) : (
              <AlertCircle size={20} />
            )}
            <span>{customAlert.message}</span>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <nav className="text-xs text-gray-500 mb-8 flex gap-2">
          <Link to="/" className="hover:text-chester-pink">
            Beranda
          </Link>{" "}
          /
          <Link to="/products" className="hover:text-chester-pink">
            Katalog
          </Link>{" "}
          /
          <span className="text-chester-text font-medium truncate w-32 md:w-auto">
            {product.name}
          </span>
        </nav>

        <div className="flex flex-col md:flex-row gap-10 lg:gap-16 items-start">
          <div className="w-full md:w-1/2 flex flex-col gap-4">
            <div
              className="relative w-full aspect-[3/4] bg-gray-50 overflow-hidden cursor-crosshair group rounded-lg"
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            >
              <img
                src={product.displayImages[currentImgIndex]}
                alt={`${product.name} Main`}
                className="w-full h-full object-cover transition-transform duration-200 ease-out"
                style={zoomStyle}
              />

              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  prevImage();
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 hover:bg-white text-chester-text flex items-center justify-center opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity rounded-full shadow"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  nextImage();
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 hover:bg-white text-chester-text flex items-center justify-center opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity rounded-full shadow"
              >
                <ChevronRight size={20} />
              </button>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-2 hide-scrollbar">
              {product.displayImages.map((img, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImgIndex(index)}
                  className={`w-20 lg:w-24 aspect-[3/4] flex-shrink-0 bg-gray-50 border-2 rounded transition-all ${currentImgIndex === index ? "border-chester-pink" : "border-transparent hover:border-gray-200"}`}
                >
                  <img
                    src={img}
                    alt={`Thumbnail ${index + 1}`}
                    className="w-full h-full object-cover rounded-sm"
                  />
                </button>
              ))}
            </div>

            {product.video_url && (
              <div className="mt-4 border border-gray-100 p-2 rounded-xl bg-gray-50">
                <div className="w-full aspect-video rounded-lg overflow-hidden shadow-sm bg-gray-900">
                  <iframe
                    width="100%"
                    height="100%"
                    src={getYouTubeEmbedUrl(product.video_url)}
                    title="Product Video"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                </div>
              </div>
            )}
          </div>

          <div className="w-full md:w-1/2 pt-2">
            <h1 className="text-3xl lg:text-4xl font-bold text-chester-text mb-4 leading-tight">
              {product.name}
            </h1>

            <div className="flex items-end gap-3 mb-8">
              <p className="text-2xl text-chester-pink font-medium">
                {currentOriginalPrice > 0
                  ? formatRupiah(currentOriginalPrice)
                  : formatRupiah(currentPrice)}
              </p>

              {currentOriginalPrice > 0 && (
                <p className="text-lg text-gray-400 line-through decoration-gray-300 font-medium pb-0.5">
                  {formatRupiah(currentPrice)}
                </p>
              )}
            </div>

            {product.has_variant === 1 &&
              product.variants &&
              product.variants.length > 0 && (
                <div className="mb-8">
                  <div className="flex justify-between items-center mb-3">
                    <p className="text-sm font-bold text-chester-text uppercase tracking-wider">
                      Pilihan Variasi:{" "}
                      <span className="font-normal text-gray-500">
                        {selectedVariant?.variant_key}
                      </span>
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {product.variants.map((v) => (
                      <button
                        key={v.id}
                        onClick={() => setSelectedVariant(v)}
                        className={`px-4 py-2 text-sm font-bold border rounded transition ${selectedVariant?.id === v.id ? "border-chester-text bg-chester-text text-white" : "border-gray-200 text-chester-text hover:border-gray-400"}`}
                      >
                        {v.variant_key}
                      </button>
                    ))}
                  </div>
                </div>
              )}

            <div className="flex flex-col gap-4 mb-10">
              <div className="flex items-center border border-gray-300 w-full md:w-32 h-14 md:h-12 rounded-lg">
                <button
                  onClick={() => updateQuantity("minus")}
                  className="w-12 md:w-10 h-full flex justify-center items-center text-gray-500 hover:text-chester-text"
                >
                  <Minus size={16} />
                </button>
                <span className="flex-1 text-center font-bold text-sm">
                  {quantity}
                </span>
                <button
                  onClick={() => updateQuantity("plus")}
                  className="w-12 md:w-10 h-full flex justify-center items-center text-gray-500 hover:text-chester-text"
                >
                  <Plus size={16} />
                </button>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleAddToCart}
                  className="flex-1 bg-chester-pink text-white h-14 rounded-lg font-bold text-sm uppercase tracking-widest hover:bg-pink-600 transition shadow-sm"
                >
                  Tambah ke Keranjang
                </button>

                <button
                  onClick={toggleWishlist}
                  className={`w-14 h-14 flex items-center justify-center border-2 rounded-lg transition-colors ${isWishlisted ? "border-chester-pink bg-pink-50 text-chester-pink" : "border-gray-200 text-gray-400 hover:border-chester-pink hover:text-chester-pink"}`}
                  title="Simpan ke Wishlist"
                >
                  <Heart
                    size={20}
                    fill={isWishlisted ? "currentColor" : "none"}
                  />
                </button>
              </div>

              <button
                onClick={handleBuyNow}
                className="w-full bg-white text-chester-text border-2 border-chester-text h-14 rounded-lg font-bold text-sm uppercase tracking-widest hover:bg-gray-50 transition shadow-sm"
              >
                Beli Sekarang
              </button>
            </div>

            <div className="pt-8 border-t border-gray-100">
              <div className="mb-6">
                <h3 className="text-sm font-bold text-chester-text uppercase tracking-wider mb-3">
                  Deskripsi Produk
                </h3>
                <div
                  className="text-sm text-gray-600 leading-relaxed [&_ul]:!list-disc [&_ul]:!pl-5 [&_ol]:!list-disc [&_ol]:!pl-5 [&_li]:!mb-2 [&_li]:!ml-4"
                  dangerouslySetInnerHTML={{
                    __html: product.description || "Tidak ada deskripsi.",
                  }}
                />
              </div>
            </div>

            <div
              onClick={handleShare}
              className="mt-8 pt-6 border-t border-gray-100 flex items-center gap-2 text-sm text-gray-500 cursor-pointer hover:text-chester-pink transition w-fit"
            >
              <Share2 size={16} />
              <span className="underline font-medium">Bagikan Produk Ini</span>
            </div>
          </div>
        </div>

        {relatedProducts.length > 0 && (
          <div className="mt-24 pt-16 border-t border-gray-100">
            <div className="flex justify-between items-end mb-10">
              <h2 className="text-2xl lg:text-3xl font-bold text-chester-text">
                Produk Terkait
              </h2>
              <Link
                to="/products"
                className="text-sm font-semibold text-gray-500 hover:text-chester-pink underline hidden sm:block"
              >
                Lihat Semua
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {relatedProducts.map((rel) => {
                const relPrice =
                  rel.has_variant === 1
                    ? Number(rel.min_v_price || 0)
                    : Number(rel.price || 0);
                const relOriginalPrice =
                  rel.has_variant === 1
                    ? Number(rel.min_v_original_price || 0)
                    : Number(rel.original_price || 0);

                return (
                  <Link
                    key={rel.id}
                    to={`/product/${rel.slug}`} // <-- DIPERBARUI: Menggunakan SLUG
                    className="group font-lora block cursor-pointer"
                  >
                    <div className="aspect-[4/5] overflow-hidden mb-4 bg-gray-100 relative rounded-lg">
                      <img
                        src={
                          rel.primary_image
                            ? `${BASE_URL}${rel.primary_image}`
                            : "/placeholder.png"
                        }
                        alt={rel.name}
                        className={`w-full h-full object-cover transition-transform duration-500 ${rel.status !== "available" ? "opacity-70 grayscale" : "group-hover:scale-105"}`}
                      />
                      {rel.status === "sold" && (
                        <span className="absolute top-2 left-2 bg-gray-900 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-1 shadow-sm z-10 rounded">
                          Sold Out
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm font-medium text-chester-text group-hover:text-chester-pink transition mb-1 line-clamp-1">
                      {rel.name}
                    </h3>

                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <p className="text-sm font-semibold text-chester-pink">
                        {relOriginalPrice > 0
                          ? formatRupiah(relOriginalPrice)
                          : formatRupiah(relPrice)}
                      </p>

                      {relOriginalPrice > 0 && (
                        <p className="text-[11px] text-gray-400 line-through decoration-gray-300 font-medium">
                          {formatRupiah(relPrice)}
                        </p>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
            <Link
              to="/products"
              className="sm:hidden block mt-8 text-center text-sm font-bold text-chester-text border border-chester-text py-3 rounded-lg uppercase tracking-widest"
            >
              Lihat Semua Produk
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
