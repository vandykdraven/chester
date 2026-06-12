import { useState, useEffect } from "react";
import {
  Save,
  Trash2,
  Edit,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Layers,
  X,
} from "lucide-react";
import axios from "axios";

export default function ProductCategory() {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State Form
  const [formData, setFormData] = useState({ name: "", description: "" });
  const [editId, setEditId] = useState(null);

  // State Modal & Alert
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

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/categories`,
      );
      if (response.data.success) {
        setCategories(response.data.data);
      }
    } catch (error) {
      showAlert("Gagal memuat daftar kategori.", "error");
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

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  // LOGIKA SIMPAN / UPDATE
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showAlert("Nama kategori wajib diisi!", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      let response;
      if (editId) {
        response = await axios.put(
          `${import.meta.env.VITE_API_URL}/categories/${editId}`,
          formData,
        );
      } else {
        response = await axios.post(
          `${import.meta.env.VITE_API_URL}/categories`,
          formData,
        );
      }

      if (response.data.success) {
        showAlert(response.data.message, "success");
        setFormData({ name: "", description: "" });
        setEditId(null);
        fetchCategories();
      }
    } catch (error) {
      showAlert("Gagal menyimpan kategori.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // LOGIKA EDIT (Memasukkan data tabel ke form)
  const handleEdit = (category) => {
    setFormData({
      name: category.name,
      description: category.description || "",
    });
    setEditId(category.id);
  };

  const cancelEdit = () => {
    setFormData({ name: "", description: "" });
    setEditId(null);
  };

  // LOGIKA HAPUS
  const confirmDelete = async () => {
    try {
      const response = await axios.delete(
        `${import.meta.env.VITE_API_URL}/categories/${deleteModal.id}`,
      );
      if (response.data.success) {
        showAlert("Kategori berhasil dihapus!", "success");
        if (editId === deleteModal.id) cancelEdit(); // Reset form jika yang sedang diedit dihapus
        fetchCategories();
      }
    } catch (error) {
      showAlert("Gagal menghapus kategori.", "error");
    } finally {
      setDeleteModal({ show: false, id: null, name: "" });
    }
  };

  return (
    <div className="max-w-6xl mx-auto pb-12 relative">
      {/* TOAST ALERT */}
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

      {/* DELETE MODAL */}
      {deleteModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 text-center">
            <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Hapus Kategori?
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              Yakin ingin menghapus kategori{" "}
              <span className="font-bold text-gray-800">
                "{deleteModal.name}"
              </span>
              ? Produk dengan kategori ini tidak akan error, tapi kategorinya
              akan menjadi kosong.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() =>
                  setDeleteModal({ show: false, id: null, name: "" })
                }
                className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                onClick={confirmDelete}
                className="px-5 py-2.5 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 shadow-sm"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-chester-text mb-1 flex items-center gap-2">
          <Layers size={24} className="text-chester-pink" /> Kategori Produk
        </h1>
        <p className="text-sm text-gray-500">
          Kelola pengelompokan jenis pakaian di toko Anda.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* KOLOM KIRI: FORMULIR TAMBAH/EDIT */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm sticky top-24">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-chester-text">
                {editId ? "Edit Kategori" : "Tambah Kategori"}
              </h2>
              {editId && (
                <button
                  onClick={cancelEdit}
                  className="text-xs font-bold text-red-500 hover:text-red-700 flex items-center gap-1"
                >
                  <X size={14} /> Batal Edit
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Nama Kategori *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Contoh: Kemeja Pria"
                  className="w-full border border-gray-300 px-4 py-2.5 rounded-lg focus:outline-none focus:border-chester-pink"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Deskripsi Kategori
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="4"
                  placeholder="Deskripsi singkat mengenai jenis produk ini..."
                  className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:outline-none focus:border-chester-pink resize-none"
                ></textarea>
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-chester-pink text-white px-6 py-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 hover:bg-gray-900 transition shadow-sm mt-2"
              >
                <Save size={18} />{" "}
                {isSubmitting
                  ? "Menyimpan..."
                  : editId
                    ? "Simpan Perubahan"
                    : "Tambah Kategori"}
              </button>
            </form>
          </div>
        </div>

        {/* KOLOM KANAN: TABEL DAFTAR KATEGORI */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[500px]">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wider">
                    <th className="p-4 font-bold">Nama Kategori</th>
                    <th className="p-4 font-bold">Slug URL</th>
                    <th className="p-4 font-bold text-right w-24">Aksi</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-gray-50">
                  {isLoading ? (
                    <tr>
                      <td
                        colSpan="3"
                        className="p-12 text-center text-gray-500"
                      >
                        <div className="animate-pulse flex flex-col items-center gap-2">
                          <div className="h-6 w-6 border-2 border-chester-pink border-t-transparent rounded-full animate-spin"></div>
                          Memuat data...
                        </div>
                      </td>
                    </tr>
                  ) : categories.length === 0 ? (
                    <tr>
                      <td
                        colSpan="3"
                        className="p-12 text-center text-gray-500"
                      >
                        <Layers
                          size={40}
                          className="mx-auto mb-3 text-gray-300"
                        />
                        <p>Belum ada kategori yang ditambahkan.</p>
                      </td>
                    </tr>
                  ) : (
                    categories.map((cat) => (
                      <tr
                        key={cat.id}
                        className={`hover:bg-pink-50/30 transition-colors group ${editId === cat.id ? "bg-pink-50/50" : ""}`}
                      >
                        <td className="p-4 align-middle">
                          <p className="font-bold text-chester-text">
                            {cat.name}
                          </p>
                          {cat.description && (
                            <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                              {cat.description}
                            </p>
                          )}
                        </td>
                        <td className="p-4 align-middle">
                          <span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-1 rounded">
                            /{cat.slug}
                          </span>
                        </td>
                        <td className="p-4 text-right align-middle">
                          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleEdit(cat)}
                              className="w-8 h-8 rounded bg-white text-gray-600 hover:text-blue-600 hover:bg-blue-50 flex items-center justify-center transition border border-gray-200 shadow-sm"
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              onClick={() =>
                                setDeleteModal({
                                  show: true,
                                  id: cat.id,
                                  name: cat.name,
                                })
                              }
                              className="w-8 h-8 rounded bg-white text-gray-600 hover:text-red-600 hover:bg-red-50 flex items-center justify-center transition border border-gray-200 shadow-sm"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
