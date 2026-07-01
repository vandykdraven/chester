import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, MapPin, Save, ChevronLeft } from "lucide-react";
import axios from "axios";

export default function AddAddress() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    label: "Rumah",
    recipient_name: "",
    phone: "",
    full_address: "",
    city_id: "", // Ini akan menampung Area ID lengkap (IDZ...)
  });

  // State untuk Pencarian Area
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const dropdownRef = useRef(null);

  // Penanganan Pencarian (dengan fitur debounce sederhana)
  const handleSearch = async (e) => {
    const value = e.target.value;
    setSearchQuery(value);

    if (value.length < 3) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    setIsSearching(true);
    setShowDropdown(true);
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/shipping/areas?search=${value}`,
      );
      if (res.data.success) {
        setSearchResults(res.data.data);
      }
    } catch (err) {
      console.error("Error pencarian:", err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectArea = (area) => {
    // Pastikan semua data hirarki dari Biteship ikut masuk ke state formData
    setFormData({
      ...formData,
      city_id: area.id,
      city_name: area.city_name,
      province_name: area.province_name,
      postal_code: area.postal_code,
    });
    setSearchQuery(area.name);
    setShowDropdown(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.city_id) {
      alert("Harap pilih lokasi dari hasil pencarian!");
      return;
    }

    try {
      const user = JSON.parse(localStorage.getItem("customerUser"));
      await axios.post(
        `${import.meta.env.VITE_API_URL}/users/${user.id}/addresses`,
        formData,
      );
      alert("Alamat berhasil ditambahkan!");
      navigate("/addresses");
    } catch (err) {
      alert("Gagal menyimpan alamat.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 font-lora">
      <div className="max-w-2xl mx-auto px-4">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center text-sm text-gray-500 hover:text-black"
        >
          <ChevronLeft size={16} /> Kembali
        </button>

        <form
          onSubmit={handleSubmit}
          className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-6"
        >
          <h2 className="text-xl font-bold">Tambah Alamat Baru</h2>

          {/* Label & Nama */}
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Label (ex: Rumah)"
              className="border p-3 rounded-xl w-full"
              onChange={(e) =>
                setFormData({ ...formData, label: e.target.value })
              }
              required
            />
            <input
              type="text"
              placeholder="Nama Penerima"
              className="border p-3 rounded-xl w-full"
              onChange={(e) =>
                setFormData({ ...formData, recipient_name: e.target.value })
              }
              required
            />
          </div>

          <input
            type="text"
            placeholder="No. Telepon"
            className="border p-3 rounded-xl w-full"
            onChange={(e) =>
              setFormData({ ...formData, phone: e.target.value })
            }
            required
          />

          {/* Pencarian Area */}
          <div className="relative" ref={dropdownRef}>
            <label className="text-xs font-bold text-gray-500 mb-1 block">
              Cari Kecamatan/Kota
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearch}
                className="w-full border p-3 pl-10 rounded-xl"
                placeholder="Cari lokasi (min 3 huruf)..."
              />
              <Search
                className="absolute left-3 top-3.5 text-gray-400"
                size={18}
              />
            </div>

            {/* Dropdown Hasil */}
            {showDropdown && (
              <div className="absolute z-50 w-full mt-2 bg-white border rounded-xl shadow-lg max-h-60 overflow-y-auto">
                {searchResults.map((area) => (
                  <div
                    key={area.id}
                    onClick={() => handleSelectArea(area)}
                    className="p-3 hover:bg-pink-50 cursor-pointer flex items-center gap-3 border-b"
                  >
                    <MapPin size={16} className="text-chester-pink" />
                    <span className="text-sm">{area.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <textarea
            placeholder="Alamat Lengkap (Jalan, No Rumah, RT/RW)"
            className="border p-3 rounded-xl w-full h-24"
            onChange={(e) =>
              setFormData({ ...formData, full_address: e.target.value })
            }
            required
          />

          <button
            type="submit"
            className="bg-chester-pink text-white py-3 rounded-xl font-bold hover:bg-pink-600 transition"
          >
            <Save size={18} className="inline mr-2" /> Simpan Alamat
          </button>
        </form>
      </div>
    </div>
  );
}
