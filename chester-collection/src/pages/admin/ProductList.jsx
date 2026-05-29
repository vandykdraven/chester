import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Search, Edit, Trash2, Filter, MoreVertical } from "lucide-react";

const formatRupiah = (angka) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(angka);
};

export default function ProductList() {
  // Dummy Data Produk (Nanti akan diganti dengan data dari Node.js / Database)
  const [products, setProducts] = useState([
    {
      id: "PRD-001",
      name: "Gaun Campuran Linen",
      category: "Gaun & Dress",
      price: 450000,
      stock: 24,
      status: "Aktif",
      image:
        "https://images.unsplash.com/photo-1539008835657-9e8e9680c956?w=100",
    },
    {
      id: "PRD-002",
      name: "Kaos Motif Putih",
      category: "Atasan",
      price: 150000,
      stock: 5,
      status: "Low Stock",
      image: "https://images.unsplash.com/photo-1550639525-c97d455acf70?w=100",
    },
    {
      id: "PRD-003",
      name: "Celana Pendek Denim",
      category: "Bawahan",
      price: 325000,
      stock: 50,
      status: "Aktif",
      image:
        "https://images.unsplash.com/photo-1591369822096-ffd140ec948f?w=100",
    },
    {
      id: "PRD-004",
      name: "Sandal Kulit Premium",
      category: "Aksesoris",
      price: 375000,
      stock: 0,
      status: "Habis",
      image:
        "https://images.unsplash.com/photo-1603487742131-4160ec999306?w=100",
    },
    {
      id: "PRD-005",
      name: "Kemeja Katun Klasik",
      category: "Atasan",
      price: 250000,
      stock: 12,
      status: "Draft",
      image:
        "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=100",
    },
  ]);

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

  return (
    <div>
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
              placeholder="Cari nama produk, SKU, atau kategori..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-chester-pink focus:ring-1 focus:ring-chester-pink transition"
            />
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
          </div>

          <div className="flex w-full md:w-auto gap-3">
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-sm font-semibold text-gray-600 rounded-lg hover:bg-gray-50 transition w-full md:w-auto justify-center">
              <Filter size={16} /> Filter
            </button>
            <select className="px-4 py-2 border border-gray-200 text-sm font-semibold text-gray-600 rounded-lg hover:bg-gray-50 transition w-full md:w-auto focus:outline-none focus:border-chester-pink">
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
              {products.map((product) => (
                <tr
                  key={product.id}
                  className="hover:bg-pink-50/30 transition-colors group"
                >
                  {/* Checkbox */}
                  <td className="p-5 text-center align-middle">
                    <input
                      type="checkbox"
                      className="w-4 h-4 accent-chester-pink cursor-pointer rounded border-gray-300"
                    />
                  </td>

                  {/* Info Produk (Gambar + Nama + Kategori) */}
                  <td className="p-5 align-middle">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0 border border-gray-200">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <Link
                          to="#"
                          className="font-bold text-chester-text hover:text-chester-pink transition line-clamp-1"
                        >
                          {product.name}
                        </Link>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-500">
                            {product.id}
                          </span>
                          <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                          <span className="text-xs text-gray-500">
                            {product.category}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Harga */}
                  <td className="p-5 font-semibold text-chester-text align-middle">
                    {formatRupiah(product.price)}
                  </td>

                  {/* Stok */}
                  <td className="p-5 align-middle">
                    <span
                      className={`font-semibold ${product.stock <= 5 ? "text-red-500" : "text-gray-600"}`}
                    >
                      {product.stock} pcs
                    </span>
                  </td>

                  {/* Status */}
                  <td className="p-5 align-middle">
                    <span
                      className={`inline-flex px-3 py-1 rounded-full text-xs font-bold border ${getStatusStyle(product.status)}`}
                    >
                      {product.status}
                    </span>
                  </td>

                  {/* Aksi (Edit / Hapus) */}
                  <td className="p-5 text-right align-middle">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        className="w-8 h-8 rounded bg-gray-50 text-gray-600 hover:text-chester-pink hover:bg-pink-50 flex items-center justify-center transition border border-gray-200"
                        title="Edit Produk"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        className="w-8 h-8 rounded bg-gray-50 text-gray-600 hover:text-red-600 hover:bg-red-50 flex items-center justify-center transition border border-gray-200"
                        title="Hapus Produk"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Dummy */}
        <div className="p-5 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-white">
          <p className="text-sm text-gray-500">
            Menampilkan <span className="font-bold text-chester-text">1-5</span>{" "}
            dari <span className="font-bold text-chester-text">24</span> produk
          </p>
          <div className="flex gap-1">
            <button className="px-3 py-1 border border-gray-200 rounded text-sm text-gray-400 cursor-not-allowed">
              Mundur
            </button>
            <button className="px-3 py-1 border border-chester-pink bg-chester-pink text-white rounded text-sm font-bold">
              1
            </button>
            <button className="px-3 py-1 border border-gray-200 rounded text-sm text-gray-600 hover:border-chester-pink hover:text-chester-pink transition">
              2
            </button>
            <button className="px-3 py-1 border border-gray-200 rounded text-sm text-gray-600 hover:border-chester-pink hover:text-chester-pink transition">
              3
            </button>
            <button className="px-3 py-1 border border-gray-200 rounded text-sm text-gray-600 hover:border-chester-pink hover:text-chester-pink transition">
              Maju
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
