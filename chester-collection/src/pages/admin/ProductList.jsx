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
// Menggunakan master API dan helper gambar terpusat
import api from "../../api";
import { getImageUrl } from "../../utils/imageHelper";

const formatRupiah = (angka) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(angka);
};

export default function ProductList() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]); // State untuk kategori dinamis
  const [isLoading, setIsLoading] = useState(true);

  // --- STATE UNTUK FILTER & SORTING ---
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("terbaru");

  // --- STATE UNTUK FITUR CENTANG HAPUS MASSAL ---
  const [selectedProducts, setSelectedProducts] = useState([]); 

  const [deleteModal, setDeleteModal] = useState({
    show: false,
    id: null, // Bisa berupa satu ID angka, atau array ID untuk hapus massal
    name: "",
  });
  
  const [customAlert, setCustomAlert] = useState({
    show: false,
    message: "",
    type: "success",
  });

  // Saat komponen dimuat, tarik produk dan kategori secara bersamaan
  useEffect(() => {
    fetchDataInitial();
  }, []);

  const fetchDataInitial = async () => {
    setIsLoading(true);
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        api.get("/products"),
        api.get("/categories")
      ]);

      if (productsRes.data.success) {
        setProducts(productsRes.data.data);
      }
      if (categoriesRes.data.success) {
        setCategories(categoriesRes.data.data);
      }
    } catch (error) {
      console.error("Gagal mengambil data awal:", error);
      showAlert("Gagal memuat data. Pastikan server menyala.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Helper pintar untuk mencari nama kategori dengan pencocokan String yang aman
  const getCategoryName = (categoryId) => {
    if (!categoryId) return "Tanpa Kategori";
    const cat = categories.find((c) => String(c.id) === String(categoryId));
    return cat ? cat.name : "Tanpa Kategori";
  };

  const showAlert = (message, type = "success") => {
    setCustomAlert({ show: true, message, type });
    setTimeout(
      () => setCustomAlert({ show: false, message: "", type: "success" }),
      3000,
    );
  };

  // --- HANDLER HAPUS ---
  const handleDeleteClick = (id, name) => {
    setDeleteModal({ show: true, id, name });
  };

  const handleBulkDeleteClick = () => {
    if (selectedProducts.length === 0) return;
    setDeleteModal({ 
      show: true, 
      id: selectedProducts, 
      name: `${selectedProducts.length} Produk Terpilih` 
    });
  };

  const confirmDelete = async () => {
    setIsLoading(true);
    try {
      if (Array.isArray(deleteModal.id)) {
        // Hapus Massal: Mengirim request delete secara paralel
        await Promise.all(
          deleteModal.id.map((productId) => api.delete(`/products/${productId}`))
        );
        showAlert(`${deleteModal.id.length} produk berhasil diproses!`, "success");
        setSelectedProducts([]); // Kosongkan centang setelah dihapus
      } else {
        // Hapus Satuan
        const response = await api.delete(`/products/${deleteModal.id}`);
        if (response.data.success) {
          showAlert("Produk berhasil diproses!", "success");
          setSelectedProducts(selectedProducts.filter(id => id !== deleteModal.id));
        }
      }
      
      // Ambil ulang data katalog terbaru
      const refreshRes = await api.get("/products");
      if (refreshRes.data.success) setProducts(refreshRes.data.data);
      
    } catch (error) {
      console.error("Gagal menghapus produk:", error);
      showAlert("Terjadi kesalahan server saat memproses produk.", "error");
    } finally {
      setDeleteModal({ show: false, id: null, name: "" });
      setIsLoading(false);
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

  // --- LOGIKA FILTER & PENGURUTAN DINAMIS ---
  const filteredProducts = products
    .filter((product) => {
      const searchLower = searchTerm.toLowerCase();
      const nameMatch = product.name?.toLowerCase().includes(searchLower);
      const skuMatch = product.sku?.toLowerCase().includes(searchLower);
      const catMatch = getCategoryName(product.category_id).toLowerCase().includes(searchLower);

      return nameMatch || skuMatch || catMatch;
    })
    .sort((a, b) => {
      if (sortBy === "terbaru") {
        return new Date(b.created_at) - new Date(a.created_at);
      } else if (sortBy === "stok_habis") {
        const stockA = a.has_variant ? Number(a.total_v_stock || 0) : Number(a.stock || 0);
        const stockB = b.has_variant ? Number(b.total_v_stock || 0) : Number(b.stock || 0);
        return stockA - stockB; 
      }
      return 0;
    });

  // --- KONTROL KOTAK CENTANG (CHECKBOX) ---
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedProducts(filteredProducts.map((p) => p.id));
    } else {
      setSelectedProducts([]);
    }
  };

  const handleSelectOne = (id) => {
    if (selectedProducts.includes(id)) {
      setSelectedProducts(selectedProducts.filter((selectedId) => selectedId !== id));
    } else {
      setSelectedProducts([...selectedProducts, id]);
    }
  };

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
            {customAlert.type === "success" ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
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
                Konfirmasi Hapus
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                Apakah Anda yakin ingin menghapus{" "}
                <span className="font-bold text-gray-800">
                  "{deleteModal.name}"
                </span>{" "}
                dari katalog?
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setDeleteModal({ show: false, id: null, name: "" })}
                  className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-50 transition"
                  disabled={isLoading}
                >
                  Batal
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={isLoading}
                  className="px-5 py-2.5 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition shadow-sm disabled:opacity-50"
                >
                  {isLoading ? "Memproses..." : "Ya, Hapus Produk"}
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
        {/* Toolbar Pencarian, Filter & Hapus Massal */}
        <div className="p-5 border-b border-gray-100 flex flex-col md:flex-row gap-4 justify-between items-center bg-gray-50/50">
          
          <div className="flex w-full md:w-auto gap-3 items-center">
            {/* TOMBOL DELETE MASSAL */}
            <button
              onClick={handleBulkDeleteClick}
              disabled={selectedProducts.length === 0}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
                selectedProducts.length > 0 
                  ? "bg-red-50 text-red-600 border border-red-200 hover:bg-red-600 hover:text-white" 
                  : "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed"
              }`}
            >
              <Trash2 size={16} /> 
              Hapus Terpilih ({selectedProducts.length})
            </button>
          </div>

          <div className="flex w-full md:w-auto gap-3">
            <div className="relative w-full md:w-64">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari nama, SKU, atau kategori..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-chester-pink transition"
              />
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-gray-200 text-sm font-semibold text-gray-600 rounded-lg hover:bg-gray-50 transition w-full md:w-auto focus:outline-none focus:border-chester-pink"
            >
              <option value="terbaru">Urutkan: Terbaru</option>
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
                    checked={filteredProducts.length > 0 && selectedProducts.length === filteredProducts.length}
                    onChange={handleSelectAll}
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

                  let currentPrice = 0;
                  let currentOriginalPrice = 0;
                  let isRange = false;
                  let maxRangePrice = 0;

                  if (product.has_variant && product.min_v_price !== null) {
                    currentPrice = Number(product.min_v_price);
                    currentOriginalPrice = Number(product.min_v_original_price || 0);
                    maxRangePrice = Number(product.max_v_price);
                    if (currentPrice !== maxRangePrice) {
                      isRange = true;
                    }
                  } else {
                    currentPrice = Number(product.price || 0);
                    currentOriginalPrice = Number(product.original_price || 0);
                  }

                  const displayPriceUI = (
                    <div className="flex flex-col gap-1">
                      {isRange ? (
                        <span className="font-semibold text-chester-text">
                          {formatRupiah(currentPrice)} - {formatRupiah(maxRangePrice)}
                        </span>
                      ) : (
                        <>
                          <span className="font-semibold text-chester-text">
                            {currentOriginalPrice > 0
                              ? formatRupiah(currentOriginalPrice)
                              : formatRupiah(currentPrice)}
                          </span>
                          {currentOriginalPrice > 0 && (
                            <span className="text-xs text-gray-400 line-through decoration-gray-300 font-medium">
                              {formatRupiah(currentPrice)}
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  );

                  return (
                    <tr
                      key={product.id}
                      className="hover:bg-pink-50/30 transition-colors group"
                    >
                      <td className="p-5 text-center align-middle">
                        <input
                          type="checkbox"
                          checked={selectedProducts.includes(product.id)}
                          onChange={() => handleSelectOne(product.id)}
                          className="w-4 h-4 accent-chester-pink cursor-pointer rounded border-gray-300"
                        />
                      </td>

                      <td className="p-5 align-middle">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0 border border-gray-200 flex items-center justify-center">
                            {product.primary_image ? (
                              <img
                                src={getImageUrl(product.primary_image)}
                                alt={product.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.onerror = null;
                                  e.currentTarget.src = "/placeholder.png";
                                }}
                              />
                            ) : (
                              <ImageIcon size={20} className="text-gray-400" />
                            )}
                          </div>
                          <div>
                            <Link
                              to={`/admin/products/edit/${product.slug}`}
                              className="font-bold text-chester-text hover:text-chester-pink transition line-clamp-1"
                            >
                              {product.name}
                            </Link>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-gray-500 font-medium">
                                {product.sku || `PRD-${String(product.id).padStart(3, "0")}`}
                              </span>
                              <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                              <span className="text-xs text-gray-500">
                                {getCategoryName(product.category_id)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="p-5 align-middle">{displayPriceUI}</td>

                      <td className="p-5 align-middle">
                        <span
                          className={`font-semibold ${
                            actualStock <= 5 ? "text-red-500" : "text-gray-600"
                          }`}
                        >
                          {actualStock} pcs
                        </span>
                      </td>

                      <td className="p-5 align-middle">
                        <span
                          className={`inline-flex px-3 py-1 rounded-full text-xs font-bold border ${getStatusStyle(
                            currentStatus,
                          )}`}
                        >
                          {currentStatus}
                        </span>
                      </td>

                      <td className="p-5 text-right align-middle">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link
                            to={`/admin/products/edit/${product.slug}`}
                            className="w-8 h-8 rounded bg-gray-50 text-gray-600 hover:text-blue-600 hover:bg-blue-50 flex items-center justify-center transition border border-gray-200"
                          >
                            <Edit size={16} />
                          </Link>
                          <button
                            onClick={() => handleDeleteClick(product.id, product.name)}
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
          </div>
        )}
      </div>
    </div>
  );
}