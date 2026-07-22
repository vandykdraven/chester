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
  Star,
  Edit,
  X,
} from "lucide-react";
import axios from "axios";

// Fungsi untuk memformat angka menjadi format Rupiah
const formatRupiah = (angka) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(angka);
};

// Fungsi untuk mendapatkan URL embed YouTube yang valid
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
  const { slug } = useParams();
  const navigate = useNavigate();

  // State untuk menyimpan data ulasan
  const [reviews, setReviews] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [reviewSummary, setReviewSummary] = useState({
    averageRating: 0,
    totalReviews: 0,
  });

  // State untuk menyimpan data produk dan interaksi halaman
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

  // State khusus untuk mengontrol jendela popup (modal) edit ulasan
  const [editModal, setEditModal] = useState({
    isOpen: false,
    reviewId: null,
    rating: 5,
    comment: "",
    isSubmitting: false,
  });

  const BASE_URL = import.meta.env.VITE_API_URL.replace("/api", "");

  // Mengambil data pelanggan yang sedang login dari penyimpanan browser
  const customerUser = JSON.parse(
    localStorage.getItem("customerUser") ||
      sessionStorage.getItem("customerUser"),
  );

  // Fungsi untuk mengambil token otorisasi pelanggan untuk keperluan API
  const getCustomerAuthHeader = () => {
    const token =
      localStorage.getItem("customerToken") ||
      sessionStorage.getItem("customerToken");
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  // Efek ini berjalan otomatis saat halaman pertama kali dimuat atau slug URL berubah
  useEffect(() => {
    fetchProductDetails();
  }, [slug]);

  // Mengambil data ulasan dari backend API
  const fetchProductReviews = async (productId, page = 1) => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/products/${productId}/reviews?page=${page}&limit=5`,
      );

      if (res.data.success) {
        setReviews(res.data.data);
        if (res.data.pagination) {
          setCurrentPage(res.data.pagination.current_page);
          setTotalPages(res.data.pagination.total_pages);
        }
        if (res.data.summary) {
          setReviewSummary({
            averageRating: res.data.summary.averageRating,
            totalReviews: res.data.summary.totalReviews,
          });
        }
      }
    } catch (error) {
      console.error("Gagal memuat ulasan produk.");
    }
  };

  // Fungsi untuk menampilkan notifikasi pop-up di layar
  const showAlert = (message, type = "success") => {
    setCustomAlert({ show: true, message, type });
    setTimeout(
      () => setCustomAlert({ show: false, message: "", type: "success" }),
      3000,
    );
  };

  // Mengambil detail lengkap produk dari backend
  const fetchProductDetails = async () => {
    setLoading(true);
    try {
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

        fetchRelatedProducts(prodData.category_id, prodData.id);

        if (customerUser) {
          checkWishlistStatus(prodData.id);
        }

        // Panggil fungsi ulasan setelah ID produk didapatkan
        fetchProductReviews(prodData.id, 1);
      }
    } catch (error) {
      console.error("Gagal memuat produk:", error);
    } finally {
      setLoading(false);
    }
  };

  // Mengambil produk lain dalam kategori yang sama
  const fetchRelatedProducts = async (categoryId, currentProductId) => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/products`);
      if (res.data.success) {
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

  // Mengecek apakah produk ini sudah ada di wishlist pengguna
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

  // Menambah atau menghapus produk dari wishlist
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
            product_id: product.id,
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

  // Memproses penambahan barang ke keranjang
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

        try {
          if (window.fbq) {
            const trackPrice = selectedVariant
              ? Number(selectedVariant.price || 0)
              : Number(product.price || 0);

            window.fbq("track", "AddToCart", {
              content_name: product.name,
              content_ids: [product.id],
              content_type: "product",
              value: trackPrice * quantity,
              currency: "IDR",
            });
          }
        } catch (fbqError) {
          console.error("Meta Pixel Error (AddToCart):", fbqError);
        }
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
            value: trackPrice * quantity,
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

  // Fungsi untuk membuka modal edit dengan data ulasan yang sudah ada
  const handleOpenEditModal = (rev) => {
    setEditModal({
      isOpen: true,
      reviewId: rev.id,
      rating: rev.rating,
      comment: rev.comment || "",
      isSubmitting: false,
    });
  };

  // Fungsi untuk mengirim perubahan ulasan ke backend API
  const handleSubmitEditReview = async (e) => {
    e.preventDefault();
    try {
      setEditModal((prev) => ({ ...prev, isSubmitting: true }));

      // Memanggil endpoint PUT dengan menyertakan Token Pelanggan
      const res = await axios.put(
        `${import.meta.env.VITE_API_URL}/reviews/${editModal.reviewId}`,
        { rating: editModal.rating, comment: editModal.comment },
        getCustomerAuthHeader(),
      );

      if (res.data.success) {
        showAlert("Ulasan Anda berhasil diperbarui!", "success");

        // Memperbarui tampilan ulasan secara langsung di layar tanpa memuat ulang halaman
        setReviews(
          reviews.map((r) =>
            r.id === editModal.reviewId
              ? { ...r, rating: editModal.rating, comment: editModal.comment }
              : r,
          ),
        );

        // Menutup modal
        setEditModal((prev) => ({ ...prev, isOpen: false }));

        // Mengambil ulang summary agar rata-rata bintang terbarui
        fetchProductReviews(product.id, currentPage);
      }
    } catch (error) {
      showAlert(
        error.response?.data?.message || "Gagal memperbarui ulasan.",
        "error",
      );
    } finally {
      setEditModal((prev) => ({ ...prev, isSubmitting: false }));
    }
  };

  // Kontrol navigasi galeri gambar produk
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

  // Tampilan layar pemuatan (loading)
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-chester-pink"></div>
      </div>
    );
  }

  // Tampilan jika produk tidak ditemukan
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

  // Penentuan harga berdasarkan varian yang dipilih
  const currentPrice = selectedVariant
    ? Number(selectedVariant.price || 0)
    : Number(product.price || 0);
  const currentOriginalPrice = selectedVariant
    ? Number(selectedVariant.original_price || 0)
    : Number(product.original_price || 0);

  return (
    <div className="bg-white min-h-screen font-lora relative">
      {/* Notifikasi Pop-up */}
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
        {/* Navigasi Breadcrumb */}
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

        {/* ========================================= */}
        {/* BAGIAN ATAS: DETAIL DAN GALERI PRODUK       */}
        {/* ========================================= */}
        <div className="flex flex-col md:flex-row gap-10 lg:gap-16 items-start">
          <div className="w-full md:w-1/2 flex flex-col gap-4">
            {/* Gambar Utama */}
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

            {/* Thumbnail Gambar */}
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

            {/* Video Produk (jika ada) */}
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

            {/* Area Harga */}
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

            {/* Pilihan Variasi */}
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

            {/* Tombol Interaksi (Jumlah, Beli, Keranjang) */}
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

            {/* Deskripsi Produk */}
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

        {/* ========================================= */}
        {/* BAGIAN TENGAH: AREA UI ULASAN PEMBELI       */}
        {/* ========================================= */}
        <div className="mt-16 pt-10 border-t border-gray-100">
          <h3 className="text-xl font-bold text-chester-text mb-6">
            Ulasan Pelanggan ({reviewSummary.totalReviews})
          </h3>

          {reviews.length === 0 ? (
            <div className="bg-gray-50 rounded-xl p-8 text-center text-gray-500 text-sm">
              Belum ada ulasan untuk produk ini. Jadilah yang pertama memberikan
              penilaian setelah membeli!
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {/* Tampilkan Rata-rata Bintang */}
              <div className="flex items-center gap-4 bg-pink-50/50 p-4 rounded-xl border border-pink-100 w-max mb-2">
                <div className="text-3xl font-black text-chester-pink">
                  {Number(reviewSummary.averageRating).toFixed(1)}
                </div>
                <div>
                  <div className="flex text-yellow-400 mb-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={16}
                        fill={
                          i < Math.round(reviewSummary.averageRating)
                            ? "currentColor"
                            : "none"
                        }
                      />
                    ))}
                  </div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Dari {reviewSummary.totalReviews} Penilaian
                  </p>
                </div>
              </div>

              {/* Daftar Ulasan */}
              <div className="divide-y divide-gray-100">
                {reviews.map((rev) => (
                  <div key={rev.id} className="py-6 first:pt-0 group relative">
                    {/* TOMBOL EDIT ULASAN (Hanya terlihat oleh pembuat ulasan) */}
                    {customerUser && customerUser.id === rev.user_id && (
                      <button
                        onClick={() => handleOpenEditModal(rev)}
                        className="absolute top-6 right-0 flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-chester-pink transition-colors bg-white px-2 py-1 rounded border border-gray-200 hover:border-chester-pink shadow-sm opacity-100 md:opacity-0 md:group-hover:opacity-100"
                      >
                        <Edit size={14} />
                        Edit
                      </button>
                    )}

                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center font-bold text-gray-500 overflow-hidden">
                          {rev.avatar ? (
                            <img
                              src={`${BASE_URL}${rev.avatar}`}
                              alt="Avatar"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            rev.customer_name?.charAt(0) || "U"
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-800">
                            {rev.customer_name || "Pengguna"}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <div className="flex text-yellow-400">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  size={12}
                                  fill={
                                    i < rev.rating ? "currentColor" : "none"
                                  }
                                  strokeWidth={2}
                                />
                              ))}
                            </div>
                            <span className="text-[10px] text-gray-400">
                              {new Date(rev.created_at).toLocaleDateString(
                                "id-ID",
                                {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                },
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {rev.variant_name && (
                      <p className="text-[11px] text-gray-500 font-medium mb-3 mt-2 bg-gray-50 inline-block px-2 py-1 rounded">
                        Varian: {rev.variant_name}
                      </p>
                    )}

                    <p className="text-sm text-gray-700 leading-relaxed mt-2 pr-16 md:pr-0">
                      {rev.comment ? (
                        rev.comment
                      ) : (
                        <span className="italic text-gray-400">
                          Pengguna tidak meninggalkan teks ulasan.
                        </span>
                      )}
                    </p>

                    {/* Balasan Admin */}
                    {rev.admin_reply && (
                      <div className="mt-4 bg-gray-50 p-4 rounded-xl border-l-4 border-l-chester-pink">
                        <p className="text-xs font-bold text-chester-pink mb-1 flex items-center gap-1">
                          <CheckCircle size={12} /> Balasan Admin Mroblong
                        </p>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          {rev.admin_reply}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Navigasi Paginasi */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 mt-4 pt-6 border-t border-gray-100">
                  <button
                    onClick={() =>
                      fetchProductReviews(product.id, currentPage - 1)
                    }
                    disabled={currentPage === 1}
                    className="flex items-center justify-center p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 hover:text-chester-pink transition disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                    title="Halaman Sebelumnya"
                  >
                    <ChevronLeft size={20} />
                  </button>

                  <span className="text-sm font-bold text-gray-600 bg-gray-50 px-4 py-2 rounded-lg border border-gray-100">
                    Halaman {currentPage} dari {totalPages}
                  </span>

                  <button
                    onClick={() =>
                      fetchProductReviews(product.id, currentPage + 1)
                    }
                    disabled={currentPage === totalPages}
                    className="flex items-center justify-center p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 hover:text-chester-pink transition disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                    title="Halaman Selanjutnya"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ========================================= */}
        {/* BAGIAN BAWAH: PRODUK TERKAIT              */}
        {/* ========================================= */}
        {relatedProducts.length > 0 && (
          <div className="mt-16 pt-10 border-t border-gray-100">
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
                    to={`/product/${rel.slug}`}
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

      {/* ========================================= */}
      {/* MODAL EDIT ULASAN PELANGGAN                 */}
      {/* ========================================= */}
      {editModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50">
              <h3 className="font-bold text-gray-800">Edit Ulasan Saya</h3>
              <button
                onClick={() => setEditModal({ ...editModal, isOpen: false })}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitEditReview} className="p-6">
              {/* Interaksi Pilihan Bintang */}
              <div className="mb-5 text-center">
                <label className="block text-sm font-bold text-gray-700 mb-3">
                  Berapa bintang untuk produk ini?
                </label>
                <div className="flex justify-center gap-2 text-gray-300">
                  {[1, 2, 3, 4, 5].map((starValue) => (
                    <button
                      type="button"
                      key={starValue}
                      onClick={() =>
                        setEditModal({ ...editModal, rating: starValue })
                      }
                      className="hover:scale-110 transition-transform focus:outline-none"
                    >
                      <Star
                        size={32}
                        fill={
                          starValue <= editModal.rating ? "#facc15" : "none"
                        }
                        color={
                          starValue <= editModal.rating
                            ? "#facc15"
                            : "currentColor"
                        }
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Input Kotak Teks Komentar */}
              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Ceritakan pengalaman Anda
                </label>
                <textarea
                  required
                  rows={4}
                  value={editModal.comment}
                  onChange={(e) =>
                    setEditModal({ ...editModal, comment: e.target.value })
                  }
                  placeholder="Bagaimana kualitas bahan, jahitan, atau sablonnya?"
                  className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-chester-pink focus:ring-1 focus:ring-chester-pink transition-colors"
                ></textarea>
              </div>

              {/* Tombol Simpan atau Batal */}
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditModal({ ...editModal, isOpen: false })}
                  className="px-5 py-2.5 text-sm font-bold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={editModal.isSubmitting}
                  className="px-5 py-2.5 text-sm font-bold text-white bg-chester-pink rounded-lg hover:bg-pink-600 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {editModal.isSubmitting ? (
                    <span className="animate-pulse">Menyimpan...</span>
                  ) : (
                    "Simpan Perubahan"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
