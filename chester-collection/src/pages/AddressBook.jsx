import { useState, useEffect, useRef } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import {
  User,
  ShoppingBag,
  MapPin,
  Ticket,
  Heart,
  LogOut,
  Plus,
  Trash2,
  Search,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import axios from "axios";

export default function AddressBook() {
  const navigate = useNavigate();
  const location = useLocation();

  const [userData, setUserData] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- STATE CUSTOM ALERT ---
  const [customAlert, setCustomAlert] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const [searchKeyword, setSearchKeyword] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef(null);

  const [addressForm, setAddressForm] = useState({
    label: "",
    recipient_name: "",
    phone: "",
    province_id: "BITESHIP",
    province_name: "",
    city_id: "",
    city_name: "",
    postal_code: "",
    full_address: "",
  });

  const BASE_URL = import.meta.env.VITE_API_URL.replace("/api", "");

  useEffect(() => {
    const storedUser = JSON.parse(
      localStorage.getItem("customerUser") ||
        sessionStorage.getItem("customerUser"),
    );
    if (!storedUser) {
      navigate("/login");
      return;
    }
    setUserData(storedUser);
    if (storedUser.avatar) setAvatarPreview(`${BASE_URL}${storedUser.avatar}`);

    loadAddresses(storedUser.id);
  }, [navigate, BASE_URL]);

  const loadAddresses = async (userId) => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/users/${userId}/addresses`,
      );
      setAddresses(response.data.data || []);
    } catch (error) {
      console.error("Gagal memuat alamat");
    } finally {
      setLoading(false);
    }
  };

  // --- FUNGSI PEMANGGIL CUSTOM ALERT ---
  const showAlert = (message, type = "success") => {
    setCustomAlert({ show: true, message, type });
    setTimeout(
      () => setCustomAlert({ show: false, message: "", type: "success" }),
      4000,
    );
  };

  const handleSearchArea = (e) => {
    const keyword = e.target.value;
    setSearchKeyword(keyword);

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (keyword.length < 3) {
      setSearchResults([]);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/logistic/search-area?keyword=${keyword}`,
        );
        setSearchResults(response.data.data || []);
      } catch (error) {
        console.error("Gagal mencari area");
      } finally {
        setIsSearching(false);
      }
    }, 800);
  };

  const selectArea = (item) => {
    setAddressForm({
      ...addressForm,
      city_id: item.id,
      city_name: `${item.name}, ${item.administrative_division_level_2_name}`,
      province_name: item.administrative_division_level_1_name,
      postal_code: item.postal_code || "",
    });
    setSearchKeyword(
      `${item.name}, ${item.administrative_division_level_2_name}, ${item.administrative_division_level_1_name}`,
    );
    setSearchResults([]);
  };

  const handleAddressSubmit = async (e) => {
    e.preventDefault();

    if (!addressForm.city_id) {
      showAlert(
        "Mohon klik/pilih wilayah dari daftar hasil pencarian yang muncul.",
        "error",
      );
      return;
    }

    setIsSubmitting(true);
    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/users/${userData.id}/addresses`,
        addressForm,
      );
      setShowForm(false);
      setAddressForm({
        label: "",
        recipient_name: "",
        phone: "",
        province_id: "BITESHIP",
        province_name: "",
        city_id: "",
        city_name: "",
        postal_code: "",
        full_address: "",
      });
      setSearchKeyword("");
      loadAddresses(userData.id);

      showAlert("Alamat baru berhasil disimpan ke buku alamat!", "success");
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Gagal menyimpan alamat ke database.";
      showAlert(errorMessage, "error");
      console.error("Error Simpan Alamat:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const setAsPrimary = async (addressId) => {
    try {
      await axios.put(
        `${import.meta.env.VITE_API_URL}/users/${userData.id}/addresses/${addressId}/primary`,
      );
      loadAddresses(userData.id);
      showAlert("Alamat utama berhasil diperbarui.", "success");
    } catch (error) {
      showAlert("Gagal mengubah alamat utama.", "error");
    }
  };

  const deleteAddress = async (addressId) => {
    if (window.confirm("Yakin ingin menghapus alamat ini?")) {
      try {
        await axios.delete(
          `${import.meta.env.VITE_API_URL}/users/${userData.id}/addresses/${addressId}`,
        );
        loadAddresses(userData.id);
        showAlert("Alamat berhasil dihapus.", "success");
      } catch (error) {
        showAlert("Gagal menghapus alamat.", "error");
      }
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    navigate("/login");
  };

  if (!userData) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-10 font-lora relative">
      {/* CUSTOM ALERTS MENGGANTIKAN WINDOW.ALERT */}
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

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="md:col-span-3">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-6 text-center border-b border-gray-100 bg-gray-950 text-white">
                <div className="w-16 h-16 mx-auto rounded-full bg-gray-800 border-2 border-chester-pink overflow-hidden mb-3">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xl font-bold uppercase">
                      {userData.fullname.charAt(0)}
                    </div>
                  )}
                </div>
                <h3 className="font-bold text-sm truncate">
                  {userData.fullname}
                </h3>
              </div>

              <nav className="flex flex-col p-2 gap-1 text-sm font-semibold">
                <Link
                  to="/profile"
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${location.pathname === "/profile" ? "bg-pink-50 text-chester-pink" : "text-gray-600 hover:bg-gray-50"}`}
                >
                  <User size={18} /> Profil Saya
                </Link>
                <Link
                  to="/addresses"
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${location.pathname === "/addresses" ? "bg-pink-50 text-chester-pink" : "text-gray-600 hover:bg-gray-50"}`}
                >
                  <MapPin size={18} /> Buku Alamat
                </Link>
                <Link
                  to="/orders"
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${location.pathname === "/orders" ? "bg-pink-50 text-chester-pink" : "text-gray-600 hover:bg-gray-50"}`}
                >
                  <ShoppingBag size={18} /> Pesanan Saya
                </Link>
                <Link
                  to="/vouchers"
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${location.pathname === "/vouchers" ? "bg-pink-50 text-chester-pink" : "text-gray-600 hover:bg-gray-50"}`}
                >
                  <Ticket size={18} /> Voucher Saya
                </Link>
                <Link
                  to="/wishlist"
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${location.pathname === "/wishlist" ? "bg-pink-50 text-chester-pink" : "text-gray-600 hover:bg-gray-50"}`}
                >
                  <Heart size={18} /> Wishlist
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 transition-colors text-left mt-2 border-t border-gray-100"
                >
                  <LogOut size={18} /> Keluar Akun
                </button>
              </nav>
            </div>
          </div>

          <div className="md:col-span-9 space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
              {showForm ? (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-8">
                    Tambah Alamat Baru
                  </h2>
                  <form onSubmit={handleAddressSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-xs font-bold uppercase text-gray-500 mb-2">
                          Label Alamat (Cth: Rumah/Kantor)
                        </label>
                        <input
                          type="text"
                          required
                          value={addressForm.label}
                          onChange={(e) =>
                            setAddressForm({
                              ...addressForm,
                              label: e.target.value,
                            })
                          }
                          className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl text-sm outline-none focus:border-chester-pink"
                          placeholder="Contoh: Rumah"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase text-gray-500 mb-2">
                          Nama Penerima
                        </label>
                        <input
                          type="text"
                          required
                          value={addressForm.recipient_name}
                          onChange={(e) =>
                            setAddressForm({
                              ...addressForm,
                              recipient_name: e.target.value,
                            })
                          }
                          className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl text-sm outline-none focus:border-chester-pink"
                          placeholder="Nama penerima paket"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold uppercase text-gray-500 mb-2">
                          Nomor Telepon
                        </label>
                        <input
                          type="tel"
                          required
                          value={addressForm.phone}
                          onChange={(e) =>
                            setAddressForm({
                              ...addressForm,
                              phone: e.target.value,
                            })
                          }
                          className="w-full md:w-1/2 bg-gray-50 border border-gray-200 p-3 rounded-xl text-sm outline-none focus:border-chester-pink"
                          placeholder="Nomor aktif"
                        />
                      </div>

                      <div className="md:col-span-2 relative">
                        <label className="block text-xs font-bold uppercase text-gray-500 mb-2">
                          Kecamatan / Wilayah Pengiriman
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            required
                            value={searchKeyword}
                            onChange={handleSearchArea}
                            className="w-full bg-gray-50 border border-gray-200 p-3 pl-10 rounded-xl text-sm focus:border-chester-pink outline-none"
                            placeholder="Ketik minimal 3 huruf nama kecamatan atau wilayah Anda..."
                          />
                          <Search
                            className="absolute left-3 top-3.5 text-gray-400"
                            size={18}
                          />
                        </div>

                        {isSearching && (
                          <div className="absolute z-10 w-full mt-1 bg-white border rounded-xl shadow-lg p-3 text-sm text-gray-500">
                            Mencari wilayah...
                          </div>
                        )}
                        {searchResults.length > 0 && (
                          <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                            {searchResults.map((item, index) => (
                              <li
                                key={`${item.id}-${index}`}
                                onClick={() => selectArea(item)}
                                className="p-3 hover:bg-pink-50 cursor-pointer border-b border-gray-50 text-sm last:border-0"
                              >
                                <div className="font-bold text-gray-800">
                                  {item.name}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {item.administrative_division_level_2_name},{" "}
                                  {item.administrative_division_level_1_name}{" "}
                                  {item.postal_code && `- ${item.postal_code}`}
                                </div>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-gray-500 mb-2">
                        Alamat Lengkap (Jalan, RT/RW, Patokan)
                      </label>
                      <textarea
                        required
                        rows="3"
                        value={addressForm.full_address}
                        onChange={(e) =>
                          setAddressForm({
                            ...addressForm,
                            full_address: e.target.value,
                          })
                        }
                        className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl text-sm outline-none focus:border-chester-pink"
                        placeholder="Tuliskan nama jalan, nomor rumah, RT/RW, dan patokan..."
                      ></textarea>
                    </div>

                    <div className="flex gap-4 pt-4 border-t border-gray-100">
                      <button
                        type="button"
                        onClick={() => setShowForm(false)}
                        className="px-6 py-3 rounded-xl text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 w-full sm:w-auto transition-colors"
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="bg-gray-950 hover:bg-black text-white px-6 py-3 rounded-xl text-sm font-bold w-full sm:w-auto disabled:opacity-70 transition-colors"
                      >
                        {isSubmitting ? "Menyimpan..." : "Simpan Alamat"}
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div>
                  <div className="flex justify-between items-center mb-8 border-b border-gray-100 pb-4">
                    <h2 className="text-xl font-bold text-gray-900">
                      Buku Alamat Saya
                    </h2>
                    <button
                      onClick={() => setShowForm(true)}
                      className="flex items-center gap-2 bg-gray-950 text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-black transition-colors"
                    >
                      <Plus size={16} /> Tambah Alamat
                    </button>
                  </div>

                  {loading ? (
                    <p className="text-sm text-gray-500 animate-pulse">
                      Memuat data alamat...
                    </p>
                  ) : addresses.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
                      <MapPin
                        size={40}
                        className="mx-auto text-gray-300 mb-3"
                      />
                      <p className="text-sm text-gray-500">
                        Anda belum memiliki alamat tersimpan.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {addresses.map((addr) => (
                        <div
                          key={addr.id}
                          className={`p-5 border rounded-2xl flex flex-col sm:flex-row justify-between items-start gap-4 ${addr.is_primary ? "border-chester-pink bg-pink-50/30" : "border-gray-100"}`}
                        >
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-bold text-gray-900">
                                {addr.label}
                              </span>
                              {addr.is_primary && (
                                <span className="text-[10px] bg-chester-pink text-white px-2.5 py-1 rounded-full uppercase tracking-wider font-bold">
                                  Utama
                                </span>
                              )}
                            </div>
                            <p className="text-sm font-semibold text-gray-800 mb-1">
                              {addr.recipient_name} | {addr.phone}
                            </p>
                            <p className="text-sm text-gray-500 leading-relaxed">
                              {addr.full_address}
                              <br />
                              {addr.city_name}, {addr.province_name}{" "}
                              {addr.postal_code}
                            </p>
                          </div>
                          <div className="flex flex-row sm:flex-col gap-3 items-center sm:items-end w-full sm:w-auto pt-2 sm:pt-0">
                            {!addr.is_primary && (
                              <button
                                onClick={() => setAsPrimary(addr.id)}
                                className="text-xs font-bold text-chester-pink hover:underline"
                              >
                                Jadikan Utama
                              </button>
                            )}
                            <button
                              onClick={() => deleteAddress(addr.id)}
                              className="text-gray-400 hover:text-red-500 transition-colors p-1"
                              title="Hapus Alamat"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
