import { useState, useEffect } from "react";
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
} from "lucide-react";
import axios from "axios";

export default function AddressBook() {
  const navigate = useNavigate();
  const location = useLocation();

  // --- STATE DATA PENGGUNA ---
  const [userData, setUserData] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  // --- STATE ALAMAT ---
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);

  const BASE_URL = import.meta.env.VITE_API_URL.replace("/api", "");

  useEffect(() => {
    // Muat data user untuk Sidebar
    const localUser = localStorage.getItem("customerUser");
    const sessionUser = sessionStorage.getItem("customerUser");
    const storedUser = localUser
      ? JSON.parse(localUser)
      : sessionUser
        ? JSON.parse(sessionUser)
        : null;

    if (!storedUser) {
      navigate("/login");
      return;
    }

    setUserData(storedUser);
    if (storedUser.avatar) {
      setAvatarPreview(`${BASE_URL}${storedUser.avatar}`);
    }

    // Muat daftar alamat
    loadAddresses(storedUser.id);
  }, [navigate, BASE_URL]);

  const loadAddresses = async (id) => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/users/${id}/addresses`,
      );
      setAddresses(response.data.data);
    } catch (error) {
      console.error("Gagal memuat alamat:", error);
    } finally {
      setLoading(false);
    }
  };

  const setAsPrimary = async (addressId) => {
    try {
      await axios.put(
        `${import.meta.env.VITE_API_URL}/users/${userData.id}/addresses/${addressId}/primary`,
      );
      loadAddresses(userData.id);
    } catch (error) {
      console.error("Gagal mengubah alamat utama:", error);
    }
  };

  const deleteAddress = async (addressId) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus alamat ini?")) {
      try {
        await axios.delete(
          `${import.meta.env.VITE_API_URL}/users/${userData.id}/addresses/${addressId}`,
        );
        loadAddresses(userData.id);
      } catch (error) {
        console.error("Gagal menghapus alamat:", error);
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
    <div className="min-h-screen bg-gray-50 py-10 font-lora">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* ========================================= */}
          {/* SIDEBAR NAVIGASI (SAMA PERSIS DENGAN PROFIL)*/}
          {/* ========================================= */}
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
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${location.pathname === "/addresses" || location.pathname === "/AddressForm" ? "bg-pink-50 text-chester-pink" : "text-gray-600 hover:bg-gray-50"}`}
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
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 text-left mt-2 border-t border-gray-100"
                >
                  <LogOut size={18} /> Keluar Akun
                </button>
              </nav>
            </div>
          </div>

          {/* ========================================= */}
          {/* AREA KONTEN UTAMA: BUKU ALAMAT             */}
          {/* ========================================= */}
          <div className="md:col-span-9">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h2 className="text-xl font-bold text-gray-900">
                  Buku Alamat Saya
                </h2>
                <button className="flex items-center gap-2 bg-gray-950 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-black transition-colors">
                  <Plus size={18} /> Tambah Alamat
                </button>
              </div>

              {loading ? (
                <p className="text-gray-500 text-sm">Memuat data alamat...</p>
              ) : addresses.length === 0 ? (
                <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-xl">
                  <p className="text-gray-500 text-sm">
                    Anda belum memiliki alamat tersimpan.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {addresses.map((addr) => (
                    <div
                      key={addr.id}
                      className={`p-4 border rounded-2xl flex flex-col sm:flex-row justify-between items-start gap-4 ${addr.is_primary ? "border-chester-pink bg-pink-50/30" : "border-gray-100"}`}
                    >
                      <div>
                        <p className="font-bold text-gray-900">
                          {addr.label}
                          {addr.is_primary && (
                            <span className="text-[10px] bg-chester-pink text-white px-2 py-0.5 rounded-full ml-2 uppercase tracking-wider">
                              Utama
                            </span>
                          )}
                        </p>
                        <p className="text-sm text-gray-800 mt-1 font-semibold">
                          {addr.recipient_name} | {addr.phone}
                        </p>
                        <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                          {addr.full_address}
                          <br />
                          {addr.city_name}, {addr.province_name}{" "}
                          {addr.postal_code}
                        </p>
                      </div>
                      <div className="flex flex-row sm:flex-col gap-3 items-center sm:items-end w-full sm:w-auto mt-2 sm:mt-0">
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
                          className="text-gray-400 hover:text-rose-500 transition-colors p-1"
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
          </div>
        </div>
      </div>
    </div>
  );
}
