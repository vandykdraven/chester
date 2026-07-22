import { useState, useEffect } from "react";
import axios from "axios";
import {
  Search,
  MessageCircle,
  Star,
  X,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
} from "lucide-react";

export default function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterStar, setFilterStar] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const [replyModal, setReplyModal] = useState({
    isOpen: false,
    reviewId: null,
    productName: "",
    customerName: "",
    comment: "",
    replyText: "",
    isSubmitting: false,
  });
  const [alert, setAlert] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const getAuthHeader = () => {
    const token = localStorage.getItem("adminToken");
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  useEffect(() => {
    fetchAdminReviews();
  }, []);

  const fetchAdminReviews = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/admin/reviews`,
        getAuthHeader(),
      );
      if (res.data.success) {
        setReviews(res.data.data);
      }
    } catch (error) {
      console.error("Gagal memuat ulasan:", error);
      showAlert("Gagal memuat data ulasan. Periksa otorisasi Anda.", "error");
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (message, type = "success") => {
    setAlert({ show: true, message, type });
    setTimeout(
      () => setAlert({ show: false, message: "", type: "success" }),
      3000,
    );
  };

  const handleToggleVisibility = async (id, currentStatus) => {
    try {
      setReviews(
        reviews.map((rev) =>
          rev.id === id ? { ...rev, is_hidden: !currentStatus } : rev,
        ),
      );
      const res = await axios.patch(
        `${import.meta.env.VITE_API_URL}/admin/reviews/${id}/visibility`,
        {},
        getAuthHeader(),
      );

      if (!res.data.success) {
        setReviews(
          reviews.map((rev) =>
            rev.id === id ? { ...rev, is_hidden: currentStatus } : rev,
          ),
        );
        showAlert("Gagal mengubah status visibilitas.", "error");
      } else {
        showAlert(
          currentStatus
            ? "Ulasan kembali ditampilkan."
            : "Ulasan disembunyikan.",
          "success",
        );
      }
    } catch (error) {
      console.error("Gagal mengubah visibilitas:", error);
      showAlert("Terjadi kesalahan server saat mengubah status.", "error");
      fetchAdminReviews();
    }
  };

  const handleOpenModal = (review) => {
    setReplyModal({
      isOpen: true,
      reviewId: review.id,
      productName: review.product_name || "Produk",
      customerName: review.customer_name || "Pelanggan",
      comment: review.comment || "Tidak ada komentar.",
      replyText: review.admin_reply || "",
      isSubmitting: false,
    });
  };

  const handleSubmitReply = async (e) => {
    e.preventDefault();
    if (!replyModal.replyText.trim())
      return showAlert("Teks balasan tidak boleh kosong.", "error");

    try {
      setReplyModal((prev) => ({ ...prev, isSubmitting: true }));
      const res = await axios.put(
        `${import.meta.env.VITE_API_URL}/admin/reviews/${replyModal.reviewId}/reply`,
        { admin_reply: replyModal.replyText },
        getAuthHeader(),
      );

      if (res.data.success) {
        setReviews(
          reviews.map((rev) =>
            rev.id === replyModal.reviewId
              ? { ...rev, admin_reply: replyModal.replyText }
              : rev,
          ),
        );
        showAlert("Balasan berhasil dikirim!", "success");
        setReplyModal((prev) => ({ ...prev, isOpen: false }));
      }
    } catch (error) {
      showAlert(
        error.response?.data?.message || "Kesalahan menyimpan balasan.",
        "error",
      );
    } finally {
      setReplyModal((prev) => ({ ...prev, isSubmitting: false }));
    }
  };

  const filteredReviews = reviews.filter((rev) => {
    const searchMatch =
      (rev.product_name || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      (rev.customer_name || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
    const starMatch =
      filterStar === "all" || rev.rating.toString() === filterStar;

    let statusMatch = true;
    if (filterStatus === "hidden") statusMatch = rev.is_hidden;
    else if (filterStatus === "replied")
      statusMatch = !!rev.admin_reply && !rev.is_hidden;
    else if (filterStatus === "waiting")
      statusMatch = !rev.admin_reply && !rev.is_hidden;

    return searchMatch && starMatch && statusMatch;
  });

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-chester-pink"></div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 font-lora relative">
      {alert.show && (
        <div className="fixed top-6 right-6 z-50 animate-bounce flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-xl text-white font-semibold text-sm bg-gray-900">
          {alert.type === "success" ? (
            <CheckCircle size={20} className="text-emerald-400" />
          ) : (
            <AlertCircle size={20} className="text-rose-400" />
          )}
          {alert.message}
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Manajemen Ulasan</h1>
          <p className="text-sm text-gray-500 mt-1">
            Pantau, balas, atau sembunyikan ulasan pelanggan.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={filterStar}
            onChange={(e) => setFilterStar(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-chester-pink"
          >
            <option value="all">Semua Bintang</option>
            <option value="5">Bintang 5</option>
            <option value="4">Bintang 4</option>
            <option value="3">Bintang 3</option>
            <option value="2">Bintang 2</option>
            <option value="1">Bintang 1</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-chester-pink"
          >
            <option value="all">Semua Status</option>
            <option value="waiting">Menunggu Balasan</option>
            <option value="replied">Sudah Dibalas</option>
            <option value="hidden">Disembunyikan</option>
          </select>

          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Cari produk/pelanggan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-chester-pink"
            />
            <Search
              className="absolute left-3 top-2.5 text-gray-400"
              size={16}
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-100">
              <tr>
                <th className="px-6 py-4">Pelanggan & Produk</th>
                <th className="px-6 py-4">Penilaian</th>
                <th className="px-6 py-4">Komentar</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredReviews.length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    Tidak ada data.
                  </td>
                </tr>
              ) : (
                filteredReviews.map((rev) => (
                  <tr
                    key={rev.id}
                    className={`hover:bg-gray-50/50 transition-colors ${rev.is_hidden ? "opacity-60 bg-gray-50" : ""}`}
                  >
                    <td className="px-6 py-4">
                      <p className="font-bold text-gray-800">
                        {rev.customer_name || "Pengguna"}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 truncate w-40">
                        {rev.product_name}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center text-yellow-400">
                        <Star size={14} fill="currentColor" />
                        <span className="text-gray-700 font-bold ml-1">
                          {rev.rating}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p
                        className="text-gray-600 truncate w-48"
                        title={rev.comment}
                      >
                        {rev.comment || "-"}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      {rev.is_hidden ? (
                        <span className="inline-flex items-center px-2 py-1 rounded text-[10px] font-bold bg-gray-200 text-gray-600">
                          Disembunyikan
                        </span>
                      ) : rev.admin_reply ? (
                        <span className="inline-flex items-center px-2 py-1 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700">
                          Dibalas
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded text-[10px] font-bold bg-amber-100 text-amber-700">
                          Menunggu
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() =>
                            handleToggleVisibility(rev.id, rev.is_hidden)
                          }
                          title={
                            rev.is_hidden
                              ? "Tampilkan Ulasan"
                              : "Sembunyikan Ulasan"
                          }
                          className={`p-1.5 rounded-lg transition-colors ${rev.is_hidden ? "bg-gray-200 text-gray-600 hover:bg-gray-300" : "bg-rose-50 text-rose-500 hover:bg-rose-100"}`}
                        >
                          {rev.is_hidden ? (
                            <Eye size={16} />
                          ) : (
                            <EyeOff size={16} />
                          )}
                        </button>

                        <button
                          onClick={() => handleOpenModal(rev)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${rev.admin_reply ? "bg-gray-100 text-gray-600 hover:bg-gray-200" : "bg-chester-pink text-white hover:bg-pink-600"}`}
                        >
                          <MessageCircle size={14} />
                          {rev.admin_reply ? "Edit" : "Balas"}
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

      {replyModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50">
              <h3 className="font-bold text-gray-800">
                Balas Ulasan Pelanggan
              </h3>
              <button
                onClick={() => setReplyModal({ ...replyModal, isOpen: false })}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmitReply} className="p-5">
              <div className="mb-4 bg-blue-50/50 p-4 rounded-xl border border-blue-100 text-sm">
                <p className="font-semibold text-blue-900 mb-1">
                  {replyModal.customerName}
                </p>
                <p className="text-gray-700 italic">"{replyModal.comment}"</p>
              </div>
              <div className="mb-5">
                <textarea
                  required
                  rows={4}
                  value={replyModal.replyText}
                  onChange={(e) =>
                    setReplyModal({ ...replyModal, replyText: e.target.value })
                  }
                  placeholder="Ketik balasan Anda..."
                  className="w-full p-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-chester-pink"
                ></textarea>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setReplyModal({ ...replyModal, isOpen: false })
                  }
                  className="px-5 py-2.5 text-sm font-bold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={replyModal.isSubmitting}
                  className="px-5 py-2.5 text-sm font-bold text-white bg-chester-pink rounded-lg hover:bg-pink-600"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
