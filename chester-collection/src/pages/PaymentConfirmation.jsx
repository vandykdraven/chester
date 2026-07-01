import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ChevronLeft,
  MessageSquare,
  CreditCard,
  Copy,
  Check,
} from "lucide-react";
import axios from "axios";

export default function PaymentConfirmation() {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const [orderData, setOrderData] = useState(null);
  const [shopPhone, setShopPhone] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    initConfirmationData();
  }, [orderId]);

  const initConfirmationData = async () => {
    setIsLoading(true);
    try {
      // 1. Ambil detail pesanan untuk mendapatkan total nominal & nama customer
      const orderRes = await axios.get(
        `${import.meta.env.VITE_API_URL}/orders/${orderId}`,
      );
      // 2. Ambil nomor HP toko yang sudah Anda atur di halaman Settings Admin
      const settingsRes = await axios.get(
        `${import.meta.env.VITE_API_URL}/settings`,
      );

      if (orderRes.data.success) setOrderData(orderRes.data.data);
      if (settingsRes.data.success)
        setShopPhone(settingsRes.data.data.shop_phone);
    } catch (error) {
      console.error("Gagal memuat data konfirmasi:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsAppRedirect = () => {
    if (!orderData || !shopPhone) {
      alert("Data belum siap, silakan coba sesaat lagi.");
      return;
    }

    // Bersihkan nomor WA dari karakter non-angka (misal spasi atau strip)
    let formattedPhone = shopPhone.replace(/[^0-60-9]/g, "");
    // Jika nomor diawali dengan '0', ubah menjadi kode negara '62'
    if (formattedPhone.startsWith("0")) {
      formattedPhone = "62" + formattedPhone.substring(1);
    }

    // Format Rupiah untuk teks WA
    const totalRupiah = new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(orderData.total_amount || orderData.grand_total);

    // Susun template teks pesan yang rapi dan profesional untuk Admin
    const textTemplate =
      `Halo Admin, saya ingin mengonfirmasi pembayaran pesanan saya.\n\n` +
      `*Detail Pesanan:*\n` +
      `• No. Pesanan : #${orderId}\n` +
      `• Nama Pembeli : ${orderData.customer_name || "Pelanggan"}\n` +
      `• Total Transfer: *${totalRupiah}*\n\n` +
      `Berikut saya lampirkan foto bukti transfernya. Mohon segera diproses ya Min, terima kasih!`;

    // Encode teks agar aman dibaca oleh URL browser
    const encodedText = encodeURIComponent(textTemplate);
    const waUrl = `https://wa.me/${formattedPhone}?text=${encodedText}`;

    // Buka WhatsApp di tab baru
    window.open(waUrl, "_blank");

    // Arahkan halaman user kembali ke daftar pesanan mereka
    navigate("/orders");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-chester-pink border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 font-lora">
      <div className="max-w-xl mx-auto px-4">
        <Link
          to="/orders"
          className="mb-6 inline-flex items-center text-sm text-gray-500 hover:text-black gap-1"
        >
          <ChevronLeft size={16} /> Kembali ke Pesanan Saya
        </Link>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8 flex flex-col gap-6">
          <div className="text-center border-b pb-5">
            <div className="w-12 h-12 bg-pink-50 text-chester-pink rounded-full flex items-center justify-center mx-auto mb-3">
              <CreditCard size={24} />
            </div>
            <h2 className="text-xl font-bold text-gray-900">
              Instruksi Pembayaran
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              Selesaikan transfer manual Anda di bawah ini
            </p>
          </div>

          {/* Rincian Rekening Bank Toko */}
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
              Rekening Tujuan
            </p>
            <div className="flex justify-between items-center bg-white p-3 rounded-lg border border-gray-100 shadow-xs mb-2">
              <div>
                <p className="text-xs font-bold text-gray-400">BANK BCA</p>
                <p className="text-sm font-black font-mono text-gray-800 tracking-wider">
                  731 0244 555
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  a.n. PT Chester Busana Indonesia
                </p>
              </div>
              <button
                onClick={() => copyToClipboard("7310244555")}
                className="p-2 text-gray-400 hover:text-chester-pink hover:bg-pink-50 rounded-lg transition"
                title="Salin No. Rekening"
              >
                {copied ? (
                  <Check size={18} className="text-emerald-500" />
                ) : (
                  <Copy size={18} />
                )}
              </button>
            </div>
          </div>

          {/* Rincian Nominal */}
          <div className="flex justify-between items-center border-y py-4">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase">
                Jumlah yang Harus Ditransfer
              </p>
              <p className="text-xs text-red-500 mt-0.5">
                *Mohon transfer tepat hingga digit terakhir
              </p>
            </div>
            <span className="text-lg font-black text-chester-pink">
              {new Intl.NumberFormat("id-ID", {
                style: "currency",
                currency: "IDR",
                minimumFractionDigits: 0,
              }).format(orderData?.total_amount || 0)}
            </span>
          </div>

          {/* Edukasi Alur Kerja */}
          <div className="text-xs text-gray-500 bg-amber-50 border border-amber-200 p-4 rounded-xl leading-relaxed">
            <p className="font-bold text-amber-700 mb-1">
              💡 Langkah Selanjutnya:
            </p>
            Klik tombol hijau di bawah untuk terhubung ke WhatsApp Admin. Sistem
            kami telah menyiapkan teks pesanan Anda secara otomatis. Anda hanya
            perlu **mengirimkan teks tersebut dan melampirkan foto bukti
            transfer Anda** langsung di dalam obrolan WhatsApp.
          </div>

          {/* Tombol Eksekusi Menuju WA */}
          <button
            onClick={handleWhatsAppRedirect}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-13 rounded-xl text-sm flex items-center justify-center gap-2 shadow-md transition-colors tracking-wide"
          >
            <MessageSquare size={18} className="fill-white/10" />
            Konfirmasi Bukti via WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
}
