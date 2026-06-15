import { useState, useEffect } from "react";
import {
  Ticket,
  Plus,
  Trash2,
  Edit,
  CheckCircle,
  AlertCircle,
  X,
  Calendar,
  Users,
  Zap,
  Percent,
  DollarSign,
  Truck,
  AlertTriangle,
} from "lucide-react";
import axios from "axios";

export default function VoucherList() {
  const [vouchers, setVouchers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [customAlert, setCustomAlert] = useState({
    show: false,
    message: "",
    type: "success",
  });

  // State untuk Modal Konfirmasi Hapus
  const [confirmDelete, setConfirmDelete] = useState({
    show: false,
    id: null,
    code: "",
  });

  const initialFormState = {
    code: "",
    name: "",
    discount_type: "fixed",
    discount_value: "",
    max_discount: "",
    min_purchase: "",
    target_buyer: "all",
    is_claimable: false,
    is_auto_apply: false,
    quota: "",
    start_date: "",
    end_date: "",
  };

  const [newVoucher, setNewVoucher] = useState(initialFormState);

  useEffect(() => {
    fetchVouchers();
  }, []);

  const fetchVouchers = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/vouchers`,
      );
      if (response.data.success) setVouchers(response.data.data);
    } catch (error) {
      showAlert("Gagal memuat data voucher.", "error");
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

  const formatForInput = (dateString) => {
    if (!dateString) return "";
    const d = new Date(dateString);
    const pad = (n) => n.toString().padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewVoucher((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleEditClick = (voucher) => {
    setNewVoucher({
      ...voucher,
      start_date: formatForInput(voucher.start_date),
      end_date: formatForInput(voucher.end_date),
    });
    setEditingId(voucher.id);
    setShowAddForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCloseForm = () => {
    setShowAddForm(false);
    setEditingId(null);
    setNewVoucher(initialFormState);
  };

  const handleSaveVoucher = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload = {
        ...newVoucher,
        start_date: newVoucher.start_date.replace("T", " ") + ":00",
        end_date: newVoucher.end_date.replace("T", " ") + ":00",
      };

      let response;
      if (editingId) {
        response = await axios.put(
          `${import.meta.env.VITE_API_URL}/vouchers/${editingId}`,
          payload,
        );
      } else {
        response = await axios.post(
          `${import.meta.env.VITE_API_URL}/vouchers`,
          payload,
        );
      }

      if (response.data.success) {
        showAlert(response.data.message, "success");
        handleCloseForm();
        fetchVouchers();
      }
    } catch (error) {
      showAlert(
        error.response?.data?.message || "Gagal menyimpan voucher.",
        "error",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    try {
      await axios.put(`${import.meta.env.VITE_API_URL}/vouchers/${id}/status`, {
        is_active: !currentStatus,
      });
      setVouchers(
        vouchers.map((v) =>
          v.id === id ? { ...v, is_active: !currentStatus } : v,
        ),
      );
      showAlert("Status voucher diperbarui.", "success");
    } catch (error) {
      showAlert("Gagal mengubah status.", "error");
    }
  };

  // Fungsi untuk membuka Modal Konfirmasi (menggantikan window.confirm)
  const initiateDelete = (id, code) => {
    setConfirmDelete({ show: true, id, code });
  };

  // Fungsi eksekusi hapus yang dipanggil dari Modal
  const executeDelete = async () => {
    try {
      const response = await axios.delete(
        `${import.meta.env.VITE_API_URL}/vouchers/${confirmDelete.id}`,
      );
      if (response.data.success) {
        showAlert("Voucher berhasil dihapus.", "success");
        if (editingId === confirmDelete.id) handleCloseForm();
        fetchVouchers();
      }
    } catch (error) {
      showAlert("Gagal menghapus voucher.", "error");
    } finally {
      setConfirmDelete({ show: false, id: null, code: "" }); // Tutup modal
    }
  };

  const formatRupiah = (number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(number);
  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

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

      {/* MODAL KONFIRMASI HAPUS KUSTOM */}
      {confirmDelete.show && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl transform scale-100">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-14 h-14 rounded-full bg-red-100 text-red-500 flex items-center justify-center">
                <AlertTriangle size={28} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800">
                  Hapus Promo?
                </h3>
                <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                  Anda yakin ingin menghapus voucher{" "}
                  <span className="font-bold text-gray-800">
                    {confirmDelete.code}
                  </span>
                  ? Tindakan ini tidak dapat dibatalkan.
                </p>
              </div>
              <div className="flex gap-3 w-full mt-4">
                <button
                  onClick={() =>
                    setConfirmDelete({ show: false, id: null, code: "" })
                  }
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 font-bold text-gray-600 hover:bg-gray-50 transition"
                >
                  Batal
                </button>
                <button
                  onClick={executeDelete}
                  className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 font-bold text-white transition shadow-sm hover:shadow-md"
                >
                  Ya, Hapus
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-chester-text mb-1 flex items-center gap-2">
            <Ticket size={24} className="text-chester-pink" /> Kupon & Voucher
            Diskon
          </h1>
          <p className="text-sm text-gray-500">
            Kelola promosi, potongan ongkir, dan diskon untuk pelanggan.
          </p>
        </div>
        <button
          onClick={showAddForm ? handleCloseForm : () => setShowAddForm(true)}
          className="bg-chester-pink hover:bg-pink-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition shadow-sm"
        >
          {showAddForm ? <X size={18} /> : <Plus size={18} />}
          {showAddForm ? "Batal" : "Buat Voucher Baru"}
        </button>
      </div>

      {/* FORM BUAT / EDIT VOUCHER */}
      {showAddForm && (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-100 shadow-sm mb-8 animate-fade-in border-l-4 border-l-chester-pink">
          <h2 className="text-lg font-bold text-gray-800 mb-6 pb-4 border-b flex items-center gap-2">
            {editingId ? (
              <Edit size={20} className="text-chester-pink" />
            ) : (
              <Plus size={20} className="text-chester-pink" />
            )}
            {editingId
              ? "Edit Konfigurasi Voucher"
              : "Konfigurasi Voucher Baru"}
          </h2>
          <form onSubmit={handleSaveVoucher} className="flex flex-col gap-6">
            {/* Baris 1: Info Dasar */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Kode Voucher (Unik)
                </label>
                <input
                  type="text"
                  name="code"
                  value={newVoucher.code}
                  onChange={handleInputChange}
                  disabled={!!editingId}
                  placeholder="Misal: ONGKIRMERDEKA"
                  required
                  className="w-full border px-4 py-2.5 rounded-lg focus:outline-none focus:border-chester-pink uppercase disabled:bg-gray-100 disabled:text-gray-500"
                />
                {editingId && (
                  <p className="text-[10px] text-gray-400 mt-1">
                    Kode voucher tidak dapat diubah setelah dibuat.
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Nama Promo (Tampil ke pembeli)
                </label>
                <input
                  type="text"
                  name="name"
                  value={newVoucher.name}
                  onChange={handleInputChange}
                  placeholder="Misal: Diskon Ongkir s/d 10rb"
                  required
                  className="w-full border px-4 py-2.5 rounded-lg focus:outline-none focus:border-chester-pink"
                />
              </div>
            </div>

            {/* Baris 2: Nilai Diskon */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-5 bg-gray-50 rounded-xl border border-gray-100">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Tipe Potongan
                </label>
                <select
                  name="discount_type"
                  value={newVoucher.discount_type}
                  onChange={handleInputChange}
                  className="w-full border px-4 py-2.5 rounded-lg bg-white focus:outline-none focus:border-chester-pink"
                >
                  <option value="fixed">Potongan Harga (Rp)</option>
                  <option value="percent">Diskon Persen (%)</option>
                  <option value="shipping">Potongan Ongkir (Rp)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Nilai Potongan
                </label>
                <input
                  type="number"
                  name="discount_value"
                  value={newVoucher.discount_value}
                  onChange={handleInputChange}
                  placeholder={
                    newVoucher.discount_type === "percent"
                      ? "Misal: 10"
                      : "Misal: 20000"
                  }
                  required
                  className="w-full border px-4 py-2.5 rounded-lg focus:outline-none focus:border-chester-pink"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Maks. Diskon (Opsional)
                </label>
                <input
                  type="number"
                  name="max_discount"
                  value={newVoucher.max_discount}
                  onChange={handleInputChange}
                  placeholder={
                    newVoucher.discount_type === "percent"
                      ? "Maksimal Rupiah"
                      : "Hanya untuk persen"
                  }
                  disabled={newVoucher.discount_type !== "percent"}
                  className="w-full border px-4 py-2.5 rounded-lg disabled:bg-gray-100 disabled:text-gray-400 focus:outline-none focus:border-chester-pink"
                />
              </div>
            </div>

            {/* Baris 3: Syarat & Target */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Minimal Belanja (Opsional)
                </label>
                <input
                  type="number"
                  name="min_purchase"
                  value={newVoucher.min_purchase}
                  onChange={handleInputChange}
                  placeholder="Misal: 100000"
                  className="w-full border px-4 py-2.5 rounded-lg focus:outline-none focus:border-chester-pink"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Target Pengguna
                </label>
                <select
                  name="target_buyer"
                  value={newVoucher.target_buyer}
                  onChange={handleInputChange}
                  className="w-full border px-4 py-2.5 rounded-lg bg-white focus:outline-none focus:border-chester-pink"
                >
                  <option value="all">Semua Orang</option>
                  <option value="new_customer">Khusus Pelanggan Baru</option>
                </select>
              </div>
            </div>

            {/* Baris 4: Masa Berlaku & Kuota */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Berlaku Dari (Jam)
                </label>
                <input
                  type="datetime-local"
                  name="start_date"
                  value={newVoucher.start_date}
                  onChange={handleInputChange}
                  required
                  className="w-full border px-4 py-2.5 rounded-lg focus:outline-none focus:border-chester-pink"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Berakhir Pada (Jam)
                </label>
                <input
                  type="datetime-local"
                  name="end_date"
                  value={newVoucher.end_date}
                  onChange={handleInputChange}
                  required
                  className="w-full border px-4 py-2.5 rounded-lg focus:outline-none focus:border-chester-pink"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Batas Kuota
                </label>
                <input
                  type="number"
                  name="quota"
                  value={newVoucher.quota}
                  onChange={handleInputChange}
                  placeholder="Isi 0 jika tanpa batas"
                  className="w-full border px-4 py-2.5 rounded-lg focus:outline-none focus:border-chester-pink"
                />
              </div>
            </div>

            {/* Baris 5: Perilaku Voucher (Checkboxes) */}
            <div className="flex flex-col sm:flex-row gap-6 p-5 bg-blue-50/50 rounded-xl border border-blue-100">
              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="relative flex items-center justify-center mt-0.5">
                  <input
                    type="checkbox"
                    name="is_claimable"
                    checked={newVoucher.is_claimable}
                    onChange={handleInputChange}
                    className="w-5 h-5 cursor-pointer accent-chester-pink"
                  />
                </div>
                <div>
                  <p className="font-bold text-sm text-gray-800 group-hover:text-chester-pink transition-colors">
                    Tampilkan di Halaman Promo (Klaim)
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5 max-w-xs">
                    Pelanggan bisa melihat dan menyimpan voucher ini.
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="relative flex items-center justify-center mt-0.5">
                  <input
                    type="checkbox"
                    name="is_auto_apply"
                    checked={newVoucher.is_auto_apply}
                    onChange={handleInputChange}
                    className="w-5 h-5 cursor-pointer accent-chester-pink"
                  />
                </div>
                <div>
                  <p className="font-bold text-sm text-gray-800 group-hover:text-chester-pink transition-colors">
                    Voucher Otomatis (Auto-Apply)
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5 max-w-xs">
                    Akan otomatis terpilih saat checkout (tanpa perlu diklaim).
                  </p>
                </div>
              </label>
            </div>

            <div className="flex justify-end mt-4 pt-6 border-t gap-3">
              <button
                type="button"
                onClick={handleCloseForm}
                className="bg-white border text-gray-600 px-6 py-3 rounded-xl text-sm font-bold transition hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="bg-gray-900 hover:bg-black text-white px-8 py-3 rounded-xl text-sm font-bold flex items-center gap-2 transition shadow-md disabled:opacity-70"
              >
                <Ticket size={18} />{" "}
                {isSaving
                  ? "Menyimpan..."
                  : editingId
                    ? "Simpan Perubahan"
                    : "Simpan Voucher Baru"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TABEL DAFTAR VOUCHER */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-gray-50/70 border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wider font-bold">
                <th className="p-4 w-44">Kode Promo</th>
                <th className="p-4">Detail Diskon</th>
                <th className="p-4">Syarat & Perilaku</th>
                <th className="p-4">Masa Berlaku</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-center w-28">Aksi</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-gray-50">
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="p-16 text-center text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <div className="h-6 w-6 border-2 border-chester-pink border-t-transparent rounded-full animate-spin"></div>
                      Memuat data voucher...
                    </div>
                  </td>
                </tr>
              ) : vouchers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-16 text-center text-gray-400">
                    <Ticket size={44} className="mx-auto mb-3 text-gray-300" />
                    <p className="font-medium">Belum ada promo yang dibuat.</p>
                  </td>
                </tr>
              ) : (
                vouchers.map((v) => (
                  <tr
                    key={v.id}
                    className={`transition-colors group ${!v.is_active ? "bg-gray-50/50 opacity-70" : "hover:bg-pink-50/10"}`}
                  >
                    <td className="p-4 align-top">
                      <p className="font-black text-gray-800 bg-gray-100 border px-2 py-1 inline-block rounded text-sm tracking-widest">
                        {v.code}
                      </p>
                      <p className="text-xs font-bold text-gray-500 mt-2">
                        {v.name}
                      </p>
                    </td>
                    <td className="p-4 align-top">
                      <div className="flex flex-col gap-1.5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border w-max ${
                            v.discount_type === "shipping"
                              ? "bg-blue-50 text-blue-600 border-blue-200"
                              : v.discount_type === "percent"
                                ? "bg-purple-50 text-purple-600 border-purple-200"
                                : "bg-emerald-50 text-emerald-600 border-emerald-200"
                          }`}
                        >
                          {v.discount_type === "shipping" ? (
                            <Truck size={10} />
                          ) : v.discount_type === "percent" ? (
                            <Percent size={10} />
                          ) : (
                            <DollarSign size={10} />
                          )}
                          {v.discount_type === "shipping"
                            ? "POTONGAN ONGKIR"
                            : v.discount_type === "percent"
                              ? "DISKON PERSEN"
                              : "POTONGAN HARGA"}
                        </span>
                        <p className="font-bold text-gray-800 text-base">
                          {v.discount_type === "percent"
                            ? `${parseFloat(v.discount_value)}%`
                            : formatRupiah(v.discount_value)}
                        </p>
                        {v.discount_type === "percent" &&
                          parseFloat(v.max_discount) > 0 && (
                            <p className="text-[11px] text-gray-500">
                              Maks. {formatRupiah(v.max_discount)}
                            </p>
                          )}
                      </div>
                    </td>
                    <td className="p-4 align-top">
                      <div className="flex flex-col gap-2 text-xs">
                        <div className="flex items-center gap-1.5 text-gray-600">
                          <AlertCircle size={14} className="text-gray-400" />{" "}
                          Min. Belanja:{" "}
                          <span className="font-bold">
                            {parseFloat(v.min_purchase) > 0
                              ? formatRupiah(v.min_purchase)
                              : "Tanpa minimal"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-600">
                          <Users size={14} className="text-gray-400" /> Target:{" "}
                          <span className="font-bold">
                            {v.target_buyer === "new_customer"
                              ? "Pengguna Baru"
                              : "Semua Orang"}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {v.is_claimable ? (
                            <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] font-semibold border">
                              Perlu Klaim
                            </span>
                          ) : null}
                          {v.is_auto_apply ? (
                            <span className="px-1.5 py-0.5 bg-yellow-50 text-yellow-700 rounded text-[10px] font-semibold border border-yellow-200 flex items-center gap-1">
                              <Zap size={10} /> Otomatis
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 align-top">
                      <div className="flex flex-col gap-1.5 text-xs text-gray-600">
                        <div className="flex items-center gap-1.5">
                          <Calendar size={14} className="text-gray-400" />{" "}
                          {formatDate(v.start_date)}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Calendar size={14} className="text-red-400" />{" "}
                          {formatDate(v.end_date)}
                        </div>
                        <div className="mt-1 font-semibold">
                          Terpakai: {v.used_count} /{" "}
                          {v.quota > 0 ? v.quota : "∞"}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 align-top text-center">
                      <button
                        onClick={() => toggleStatus(v.id, v.is_active)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${v.is_active ? "bg-chester-pink" : "bg-gray-300"}`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${v.is_active ? "translate-x-6" : "translate-x-1"}`}
                        />
                      </button>
                      <p
                        className={`text-[10px] font-bold mt-1 ${v.is_active ? "text-chester-pink" : "text-gray-400"}`}
                      >
                        {v.is_active ? "AKTIF" : "NONAKTIF"}
                      </p>
                    </td>
                    <td className="p-4 align-top text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleEditClick(v)}
                          className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition"
                          title="Edit Voucher"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => initiateDelete(v.id, v.code)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                          title="Hapus Voucher"
                        >
                          <Trash2 size={18} />
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
  );
}
