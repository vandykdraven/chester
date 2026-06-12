import { useState, useEffect } from "react";
import {
  Save,
  Trash2,
  Edit,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Tags,
  X,
} from "lucide-react";
import axios from "axios";

export default function ProductTag() {
  const [tags, setTags] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({ name: "" });
  const [editId, setEditId] = useState(null);

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
    fetchTags();
  }, []);

  const fetchTags = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/tags`);
      if (response.data.success) setTags(response.data.data);
    } catch (error) {
      showAlert("Gagal memuat daftar tag.", "error");
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showAlert("Nama tag wajib diisi!", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      let response;
      if (editId) {
        response = await axios.put(
          `${import.meta.env.VITE_API_URL}/tags/${editId}`,
          formData,
        );
      } else {
        response = await axios.post(
          `${import.meta.env.VITE_API_URL}/tags`,
          formData,
        );
      }

      if (response.data.success) {
        showAlert(response.data.message, "success");
        setFormData({ name: "" });
        setEditId(null);
        fetchTags();
      }
    } catch (error) {
      showAlert(
        error.response?.data?.message || "Gagal menyimpan tag.",
        "error",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (tag) => {
    setFormData({ name: tag.name });
    setEditId(tag.id);
  };

  const cancelEdit = () => {
    setFormData({ name: "" });
    setEditId(null);
  };

  const confirmDelete = async () => {
    try {
      const response = await axios.delete(
        `${import.meta.env.VITE_API_URL}/tags/${deleteModal.id}`,
      );
      if (response.data.success) {
        showAlert("Tag berhasil dihapus!", "success");
        if (editId === deleteModal.id) cancelEdit();
        fetchTags();
      }
    } catch (error) {
      showAlert("Gagal menghapus tag.", "error");
    } finally {
      setDeleteModal({ show: false, id: null, name: "" });
    }
  };

  return (
    <div className="max-w-6xl mx-auto pb-12 relative">
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

      {deleteModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 text-center">
            <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Hapus Tag?</h3>
            <p className="text-sm text-gray-500 mb-6">
              Yakin ingin menghapus tag{" "}
              <span className="font-bold text-gray-800">
                "{deleteModal.name}"
              </span>
              ?
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
          <Tags size={24} className="text-chester-pink" /> Tag & Label Produk
        </h1>
        <p className="text-sm text-gray-500">
          Kelola kata kunci SEO dan label untuk produk Anda.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm sticky top-24">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-chester-text">
                {editId ? "Edit Tag" : "Tambah Tag"}
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
                  Nama Tag / Keyword *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Contoh: Kemeja Santai"
                  className="w-full border border-gray-300 px-4 py-2.5 rounded-lg focus:outline-none focus:border-chester-pink"
                />
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
                    : "Tambah Tag"}
              </button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden p-6">
            <h3 className="text-sm font-bold text-gray-700 mb-4">
              Daftar Tag Tersedia
            </h3>
            {isLoading ? (
              <div className="p-12 text-center text-gray-500 flex flex-col items-center gap-2">
                <div className="h-6 w-6 border-2 border-chester-pink border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : tags.length === 0 ? (
              <div className="text-center text-gray-500 py-10">
                <Tags size={40} className="mx-auto mb-3 text-gray-300" />
                <p>Belum ada tag yang ditambahkan.</p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-3">
                {tags.map((tag) => (
                  <div
                    key={tag.id}
                    className={`group flex items-center gap-2 border px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${editId === tag.id ? "bg-pink-50 border-chester-pink text-chester-pink" : "bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300"}`}
                  >
                    {tag.name}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity border-l border-gray-300 pl-2 ml-1">
                      <button
                        onClick={() => handleEdit(tag)}
                        className="text-gray-400 hover:text-blue-600"
                      >
                        <Edit size={12} />
                      </button>
                      <button
                        onClick={() =>
                          setDeleteModal({
                            show: true,
                            id: tag.id,
                            name: tag.name,
                          })
                        }
                        className="text-gray-400 hover:text-red-600"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
