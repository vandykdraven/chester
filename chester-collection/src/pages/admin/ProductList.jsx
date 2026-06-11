import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Filter,
  Image as ImageIcon,
  AlertTriangle,
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

const categoryMap = {
  cat_1: "Atasan",
  cat_2: "Bawahan",
  cat_3: "Gaun & Dress",
  cat_4: "Aksesoris",
};

export default function ProductList() {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- STATE BARU UNTUK FILTER & SORTING ---
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("terbaru");

  const [deleteModal, setDeleteModal] = useState({
    show: false,
    id: null,
    name: "",
  });
  const [customAlert, setCustomAlert] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const BASE_URL = import.meta.env.VITE_API_URL.replace("/api", "");

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/products`,
      );
      if (response.data.success) {
        setProducts(response.data.data);
      }
    } catch (error) {
      console.error("Gagal mengambil data produk:", error);
      showAlert(
        "Gagal memuat daftar produk. Pastikan server menyala.",
        "error",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const showAlert = (message, type = "success") => {
    setCustomAlert({ show: true, message, type });
    setTimeout(
      () => setCustomAlert({ show: false, message: "", type: "success" }),
      3000,
    );
  };

  const handleDeleteClick = (id, name) => {
    setDeleteModal({ show: true, id, name });
  };

  const confirmDelete = async () => {
    try {
      const response = await axios.delete(
        `${import.meta.env.VITE_API_URL}/products/${deleteModal.id}`,
      );
      if (response.data.success) {
        showAlert("Produk berhasil dihapus secara permanen!", "success");
        fetchProducts();
      }
    } catch (error) {
      console.error("Gagal menghapus produk:", error);
      showAlert("Terjadi kesalahan server saat menghapus produk.", "error");
    } finally {
      setDeleteModal({ show: false, id: null, name: "" });
    }
  };

  const getDerivedStatus = (product, actualStock) => {
    if (product.status === "draft") return "Draft";
    if (actualStock === 0) return "Habis";
    if (actualStock <= 5) return "Low Stock";
    return "Aktif";
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "Aktif":
        return "bg-green-100 text-green-700 border-green-200";
      case "Low Stock":
        return "bg-orange-100 text-orange-700 border-orange-200";
      case "Habis":
        return "bg-red-100 text-red-700 border-red-200";
      case "Draft":
        return "bg-gray-100 text-gray-700 border-gray-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  // =====================================================================
  // LOGIKA PINTAR: FILTER & URUTKAN PRODUK SEBELUM DITAMPILKAN
  // =====================================================================
  const filteredProducts = products
    .filter((product) => {
      // 1. Logika Pencarian Teks (Cari di Nama, SKU, atau Nama Kategori)
      const searchLower = searchTerm.toLowerCase();
      const nameMatch = product.name?.toLowerCase().includes(searchLower);
      const skuMatch = product.sku?.toLowerCase().includes(searchLower);
      const catMatch = (categoryMap[product.category_id] || "")
        .toLowerCase()
        .includes(searchLower);

      return nameMatch || skuMatch || catMatch;
    })
    .sort((a, b) => {
      // 2. Logika Pengurutan (Dropdown)
      if (sortBy === "terbaru") {
        return new Date(b.created_at) - new Date(a.created_at);
      } else if (sortBy === "stok_habis") {
        const stockA = a.has_variant
          ? Number(a.total_v_stock || 0)
          : Number(a.stock || 0);
        const stockB = b.has_variant
          ? Number(b.total_v_stock || 0)
          : Number(b.stock || 0);
        return stockA - stockB; // Mengurutkan dari stok paling kecil (0) ke besar
      }
      // Catatan: Untuk "terlaris", kita butuh tabel transaksi/pesanan nanti.
      // Sementara kita biarkan default.
      return 0;
    });

  return (
    <div className="max-w-6xl mx-auto pb-12 relative">
      {/* Toast Alert */}
      {customAlert.show && (
        <div className="fixed top-6 right-6 z-50 animate-bounce">
          <div
            className={`flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-xl border text-sm font-semibold text-white ${
              customAlert.type === "success"
                ? "bg-emerald-500 border-emerald-400"
                : "bg-rose-500 border-rose-400"
            }`}
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

      {/* Delete Modal */}
      {deleteModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform scale-100 animate-scale-up">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Hapus Produk?
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                Apakah Anda yakin ingin menghapus{" "}
                <span className="font-bold text-gray-800">
                  "{deleteModal.name}"
                </span>{" "}
                secara permanen?
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() =>
                    setDeleteModal({ show: false, id: null, name: "" })
                  }
                  className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-50 transition"
                >
                  Batal
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-5 py-2.5 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition shadow-sm"
                >
                  Ya, Hapus Produk
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-chester-text mb-1">
            Daftar Produk
          </h1>
          <p className="text-sm text-gray-500">
            Kelola semua produk, harga, dan stok toko Anda.
          </p>
        </div>
        <Link
          to="/admin/products/add"
          className="bg-chester-pink text-white px-5 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-gray-900 transition-colors shadow-sm"
        >
          <Plus size={18} /> Tambah Produk Baru
        </Link>
      </div>

      {/* Box Tabel Utama */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Toolbar Pencarian & Filter */}
        <div className="p-5 border-b border-gray-100 flex flex-col md:flex-row gap-4 justify-between items-center bg-gray-50/50">
          <div className="relative w-full md:w-96">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari nama produk, SKU, atau kategori..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-chester-pink focus:ring-1 focus:ring-chester-pink transition"
            />
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
          </div>

          <div className="flex w-full md:w-auto gap-3">
            {/* Tombol Filter Spesifik (Kosong untuk UI Saat ini) */}
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-sm font-semibold text-gray-600 rounded-lg hover:bg-gray-50 transition w-full md:w-auto justify-center">
              <Filter size={16} /> Filter
            </button>

            {/* Dropdown Pengurutan (Tersambung ke State sortBy) */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-gray-200 text-sm font-semibold text-gray-600 rounded-lg hover:bg-gray-50 transition w-full md:w-auto focus:outline-none focus:border-chester-pink"
            >
              <option value="terbaru">Urutkan: Terbaru</option>
              <option value="terlaris">Urutkan: Terlaris</option>
              <option value="stok_habis">Stok Paling Sedikit</option>
            </select>
          </div>
        </div>

        {/* Tabel Data Produk */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-white border-b border-gray-100 text-xs text-gray-400 uppercase tracking-wider">
                <th className="p-5 font-semibold w-12 text-center">
                  <input
                    type="checkbox"
                    className="w-4 h-4 accent-chester-pink cursor-pointer rounded border-gray-300"
                  />
                </th>
                <th className="p-5 font-semibold">Info Produk</th>
                <th className="p-5 font-semibold">Harga</th>
                <th className="p-5 font-semibold">Stok</th>
                <th className="p-5 font-semibold">Status</th>
                <th className="p-5 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-gray-50">
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="p-12 text-center text-gray-500">
                    <div className="animate-pulse flex flex-col items-center gap-2">
                      <div className="h-6 w-6 border-2 border-chester-pink border-t-transparent rounded-full animate-spin"></div>
                      Memuat katalog produk...
                    </div>
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-12 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-3">
                      <Search size={48} className="text-gray-300" />
                      <p className="text-sm">Produk tidak ditemukan.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const actualStock = product.has_variant
                    ? Number(product.total_v_stock || 0)
                    : Number(product.stock || 0);

                  const currentStatus = getDerivedStatus(product, actualStock);

                  let displayPrice;
                  if (product.has_variant && product.min_v_price !== null) {
                    const minPrice = Number(product.min_v_price);
                    const maxPrice = Number(product.max_v_price);
                    if (minPrice === maxPrice) {
                      displayPrice = formatRupiah(minPrice);
                    } else {
                      displayPrice = `${formatRupiah(minPrice)} - ${formatRupiah(maxPrice)}`;
                    }
                  } else {
                    displayPrice = formatRupiah(Number(product.price) || 0);
                  }

                  return (
                    <tr
                      key={product.id}
                      className="hover:bg-pink-50/30 transition-colors group"
                    >
                      <td className="p-5 text-center align-middle">
                        <input
                          type="checkbox"
                          className="w-4 h-4 accent-chester-pink cursor-pointer rounded border-gray-300"
                        />
                      </td>

                      <td className="p-5 align-middle">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0 border border-gray-200 flex items-center justify-center">
                            {product.primary_image ? (
                              <img
                                src={`${BASE_URL}${product.primary_image}`}
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <ImageIcon size={20} className="text-gray-400" />
                            )}
                          </div>
                          <div>
                            <Link
                              to={`/admin/products/edit/${product.id}`}
                              className="font-bold text-chester-text hover:text-chester-pink transition line-clamp-1"
                            >
                              {product.name}
                            </Link>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-gray-500 font-medium">
                                {product.sku ||
                                  `PRD-${String(product.id).padStart(3, "0")}`}
                              </span>
                              <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                              <span className="text-xs text-gray-500">
                                {categoryMap[product.category_id] ||
                                  "Tanpa Kategori"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="p-5 font-semibold text-chester-text align-middle">
                        {displayPrice}
                      </td>

                      <td className="p-5 align-middle">
                        <span
                          className={`font-semibold ${actualStock <= 5 ? "text-red-500" : "text-gray-600"}`}
                        >
                          {actualStock} pcs
                        </span>
                      </td>

                      <td className="p-5 align-middle">
                        <span
                          className={`inline-flex px-3 py-1 rounded-full text-xs font-bold border ${getStatusStyle(currentStatus)}`}
                        >
                          {currentStatus}
                        </span>
                      </td>

                      <td className="p-5 text-right align-middle">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link
                            to={`/admin/products/edit/${product.id}`}
                            className="w-8 h-8 rounded bg-gray-50 text-gray-600 hover:text-blue-600 hover:bg-blue-50 flex items-center justify-center transition border border-gray-200"
                          >
                            <Edit size={16} />
                          </Link>
                          <button
                            onClick={() =>
                              handleDeleteClick(product.id, product.name)
                            }
                            className="w-8 h-8 rounded bg-gray-50 text-gray-600 hover:text-red-600 hover:bg-red-50 flex items-center justify-center transition border border-gray-200"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Dinamis */}
        {!isLoading && filteredProducts.length > 0 && (
          <div className="p-5 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-white">
            <p className="text-sm text-gray-500">
              Menampilkan{" "}
              <span className="font-bold text-chester-text">
                1-{filteredProducts.length}
              </span>{" "}
              dari{" "}
              <span className="font-bold text-chester-text">
                {filteredProducts.length}
              </span>{" "}
              produk
            </p>
            <div className="flex gap-1">
              <button className="px-3 py-1 border border-gray-200 rounded text-sm text-gray-400 cursor-not-allowed">
                Mundur
              </button>
              <button className="px-3 py-1 border border-chester-pink bg-chester-pink text-white rounded text-sm font-bold">
                1
              </button>
              <button className="px-3 py-1 border border-gray-200 rounded text-sm text-gray-600 hover:border-chester-pink hover:text-chester-pink transition cursor-not-allowed opacity-50">
                Maju
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
