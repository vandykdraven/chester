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
  const [storeSettings, setStoreSettings] = useState({});
  const [storeBankAccounts, setStoreBankAccounts] = useState([]); // State khusus untuk array rekening

  const [isLoading, setIsLoading] = useState(true);
  const [copiedIndex, setCopiedIndex] = useState(null);

  useEffect(() => {
    initConfirmationData();
  }, [orderId]);

  const initConfirmationData = async () => {
    setIsLoading(true);
    try {
      const orderRes = await axios.get(
        `${import.meta.env.VITE_API_URL}/orders/${orderId}`,
      );
      const settingsRes = await axios.get(
        `${import.meta.env.VITE_API_URL}/settings`,
      );

      if (orderRes.data.success) {
        const orderData = orderRes.data.data;
        setOrderData(orderData);

        // ---> TAMBAHAN META PIXEL: Purchase <---
        // Merekam pembelian yang berhasil dengan total Rupiah yang tepat
        try {
          if (window.fbq) {
            // Mencegah konversi dicatat berulang kali jika user me-refresh halaman (opsional,
            // tapi praktik baik untuk data yang lebih akurat). Kita gunakan localStorage
            const pixelRecorded = localStorage.getItem(
              `pixel_purchase_recorded_${orderId}`,
            );

            if (!pixelRecorded) {
              window.fbq("track", "Purchase", {
                value: orderData.total_amount || orderData.grand_total,
                currency: "IDR",
                content_ids: [orderId], // Opsional: ID pesanan
                content_type: "product_group",
              });
              // Tandai agar tidak tercatat ganda jika di refresh
              localStorage.setItem(
                `pixel_purchase_recorded_${orderId}`,
                "true",
              );
            }
          }
        } catch (fbqError) {
          console.error("Meta Pixel Error (Purchase):", fbqError);
        }
        // ----------------------------------------
      }

      if (settingsRes.data.success) {
        const apiSettings = settingsRes.data.data;
        setStoreSettings(apiSettings);

        // Parse kembali ke bentuk Array
        if (apiSettings.payment_accounts) {
          try {
            const parsedAccounts = JSON.parse(apiSettings.payment_accounts);

            // LOGIKA FILTER: Ambil nama bank pilihan dari halaman Checkout
            const chosenBank = localStorage.getItem(`payment_for_${orderId}`);

            if (chosenBank) {
              // Jika ada pilihan, saring agar hanya bank tersebut yang tampil
              const filteredAccounts = parsedAccounts.filter(
                (acc) => acc.bank_name === chosenBank,
              );
              setStoreBankAccounts(
                filteredAccounts.length > 0 ? filteredAccounts : parsedAccounts,
              );
            } else {
              setStoreBankAccounts(parsedAccounts);
            }
          } catch (e) {
            console.error("Gagal parse data rekening toko:", e);
          }
        }
      }
    } catch (error) {
      console.error("Gagal memuat data konfirmasi:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text, index) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleWhatsAppRedirect = () => {
    const shopPhone = storeSettings.shop_phone;
    if (!orderData || !shopPhone) {
      alert("Data belum siap, silakan coba sesaat lagi.");
      return;
    }

    let formattedPhone = shopPhone.replace(/[^0-9]/g, "");
    if (formattedPhone.startsWith("0")) {
      formattedPhone = "62" + formattedPhone.substring(1);
    }

    const totalRupiah = new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(orderData.total_amount || orderData.grand_total);

    // Ambil nama bank yang tampil untuk dimasukkan ke teks laporan WA
    const bankTujuan =
      storeBankAccounts.length === 1 ? storeBankAccounts[0].bank_name : "Toko";

    const textTemplate =
      `Halo Admin, saya ingin mengonfirmasi pembayaran pesanan saya.\n\n` +
      `*Detail Pesanan:*\n` +
      `• No. Pesanan : #${orderId}\n` +
      `• Nama Pembeli : ${orderData.customer_name || "Pelanggan"}\n` +
      `• Bank Tujuan  : ${bankTujuan}\n` +
      `• Total Transfer: *${totalRupiah}*\n\n` +
      `Berikut saya lampirkan foto bukti transfernya. Mohon segera diproses ya Min, terima kasih!`;

    const encodedText = encodeURIComponent(textTemplate);
    const waUrl = `https://wa.me/${formattedPhone}?text=${encodedText}`;

    window.open(waUrl, "_blank");
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

          {/* MENAMPILKAN REKENING YANG DIPILIH SAJA */}
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
              Rekening Tujuan Transfer
            </p>

            <div className="flex flex-col gap-3">
              {storeBankAccounts.length > 0 ? (
                storeBankAccounts.map((acc, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center bg-white p-3 rounded-lg border border-gray-100 shadow-xs border-l-4 border-l-chester-pink"
                  >
                    <div>
                      <p className="text-xs font-bold text-gray-400">
                        {acc.bank_name || "NAMA BANK"}
                      </p>
                      <p className="text-sm font-black font-mono text-gray-800 tracking-wider">
                        {acc.bank_account || "000000000"}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        a.n. {acc.bank_owner || "Nama Pemilik"}
                      </p>
                    </div>
                    <button
                      onClick={() => copyToClipboard(acc.bank_account, index)}
                      className="p-2 text-gray-400 hover:text-chester-pink hover:bg-pink-50 rounded-lg transition"
                      title="Salin No. Rekening"
                    >
                      {copiedIndex === index ? (
                        <Check size={18} className="text-emerald-500" />
                      ) : (
                        <Copy size={18} />
                      )}
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-sm text-gray-500 p-4 text-center bg-white border border-gray-100 rounded-lg">
                  Data rekening tidak ditemukan.
                </div>
              )}
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
            Silakan lakukan transfer ke rekening di atas. Setelah selesai, klik
            tombol hijau di bawah untuk terhubung ke WhatsApp Admin. Anda hanya
            perlu **mengirimkan teks pesan dan melampirkan foto bukti transfer
            Anda** langsung di dalam obrolan WhatsApp.
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
