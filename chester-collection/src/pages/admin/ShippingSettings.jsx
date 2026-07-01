import { useState, useEffect } from "react";
import { Truck, Save, AlertCircle, CheckCircle2 } from "lucide-react";
import axios from "axios";

export default function ShippingSettings() {
  const [activeCouriers, setActiveCouriers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // Daftar kurir resmi yang didukung oleh API Biteship (Berbasis Area ID)
  // Perbaikan: ID Express menggunakan 'ide', bukan 'idx'
  const availableCouriers = [
    { id: "jne", name: "JNE Express" },
    { id: "jnt", name: "J&T Express" },
    { id: "sicepat", name: "SiCepat" },
    { id: "pos", name: "POS Indonesia" },
    { id: "ninja", name: "Ninja Express" },
    { id: "anteraja", name: "AnterAja" },
    { id: "tiki", name: "TIKI" },
    { id: "lion", name: "Lion Parcel" },
    { id: "wahana", name: "Wahana Prestasi Logistik" },
    { id: "sap", name: "SAP Express" },
    { id: "paxel", name: "Paxel (Next Day)" },
    { id: "ide", name: "ID Express" },
  ];

  // Mengambil pengaturan kurir yang saat ini aktif dari database
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/settings`);
      if (res.data.success && res.data.data.active_couriers) {
        // Memecah teks "jne,jnt,pos" menjadi array ["jne", "jnt", "pos"]
        const savedCouriers = res.data.data.active_couriers.split(",");
        setActiveCouriers(savedCouriers);
      }
    } catch (error) {
      console.error("Gagal memuat pengaturan:", error);
      setMessage({
        type: "error",
        text: "Gagal mengambil data pengaturan dari server.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fungsi untuk membalik status On/Off saat slider diklik
  const handleToggle = (courierId) => {
    setActiveCouriers((prev) => {
      if (prev.includes(courierId)) {
        return prev.filter((id) => id !== courierId); // Matikan (Hapus dari daftar)
      } else {
        return [...prev, courierId]; // Nyalakan (Tambahkan ke daftar)
      }
    });
  };

  // Menyimpan perubahan ke tabel Settings
  const handleSave = async () => {
    setIsSaving(true);
    setMessage({ type: "", text: "" });

    try {
      // Menggabungkan kembali array menjadi teks "jne,jnt,pos" untuk Biteship
      const couriersString = activeCouriers.join(",");

      const payload = {
        active_couriers: couriersString,
      };

      const res = await axios.put(
        `${import.meta.env.VITE_API_URL}/settings`,
        payload,
      );

      if (res.data.success) {
        setMessage({
          type: "success",
          text: "Pengaturan ekspedisi berhasil disimpan!",
        });
        // Sembunyikan pesan sukses setelah 3 detik
        setTimeout(() => setMessage({ type: "", text: "" }), 3000);
      }
    } catch (error) {
      console.error("Gagal menyimpan:", error);
      setMessage({
        type: "error",
        text: "Terjadi kesalahan saat menyimpan pengaturan.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-chester-pink"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl font-lora">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-chester-text flex items-center gap-3">
          <Truck size={28} className="text-chester-pink" />
          Pengaturan Ekspedisi Pengiriman
        </h1>
        <p className="text-sm text-gray-500 mt-2">
          Pilih layanan ekspedisi logistik dari Biteship yang ingin Anda
          aktifkan untuk pelanggan saat Checkout.
        </p>
      </div>

      {message.text && (
        <div
          className={`p-4 mb-6 rounded-xl flex items-center gap-3 text-sm font-bold ${
            message.type === "success"
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 size={18} />
          ) : (
            <AlertCircle size={18} />
          )}
          {message.text}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
          <h2 className="font-bold text-gray-700 uppercase tracking-wider text-sm">
            Daftar Kurir Tersedia
          </h2>
          <span className="text-xs font-bold text-chester-pink bg-pink-50 px-3 py-1 rounded-full">
            {activeCouriers.length} Kurir Aktif
          </span>
        </div>

        <div className="divide-y divide-gray-100">
          {availableCouriers.map((courier) => {
            const isActive = activeCouriers.includes(courier.id);

            return (
              <div
                key={courier.id}
                className="p-5 flex items-center justify-between hover:bg-gray-50 transition"
              >
                <div>
                  <h3 className="font-bold text-chester-text text-base">
                    {courier.name}
                  </h3>
                  <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest">
                    Kode API: {courier.id}
                  </p>
                </div>

                {/* Tombol Slider (Toggle) */}
                <button
                  onClick={() => handleToggle(courier.id)}
                  className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none ${
                    isActive ? "bg-chester-pink" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                      isActive ? "translate-x-8" : "translate-x-1"
                    } shadow-sm`}
                  />
                </button>
              </div>
            );
          })}
        </div>

        <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-3 bg-chester-text text-white rounded-xl font-bold text-sm hover:bg-black transition flex items-center gap-2 disabled:bg-gray-400"
          >
            {isSaving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
            ) : (
              <Save size={18} />
            )}
            Simpan Pengaturan
          </button>
        </div>
      </div>
    </div>
  );
}
