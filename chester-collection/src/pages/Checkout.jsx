import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  MapPin,
  Truck,
  CreditCard,
  ChevronLeft,
  CheckCircle,
  ShoppingBag,
} from "lucide-react";
import axios from "axios";

const formatRupiah = (angka) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(angka);
};

export default function Checkout() {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [myVouchers, setMyVouchers] = useState([]);
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [showVoucherModal, setShowVoucherModal] = useState(false);

  // Status courier dihilangkan karena sekarang diurus backend
  const [shippingOptions, setShippingOptions] = useState([]);
  const [selectedShipping, setSelectedShipping] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("transfer");

  const [isLoading, setIsLoading] = useState(true);
  const [issubmitting, setIsSubmitting] = useState(false);
  const [shippingLoading, setShippingLoading] = useState(false); // Indikator khusus ongkir

  const customerUser = JSON.parse(
    localStorage.getItem("customerUser") ||
      sessionStorage.getItem("customerUser"),
  );

  useEffect(() => {
    if (!customerUser) {
      navigate("/login");
      return;
    }
    initCheckoutData();
  }, []);

  const initCheckoutData = async () => {
    setIsLoading(true);
    try {
      const cartRes = await axios.get(
        `${import.meta.env.VITE_API_URL}/carts/${customerUser.id}`,
      );
      const addrRes = await axios.get(
        `${import.meta.env.VITE_API_URL}/users/${customerUser.id}/addresses`,
      );

      if (cartRes.data.success) {
        const formatted = cartRes.data.data.map((item) => {
          const baseP = item.variant_id
            ? Number(item.variant_price || 0)
            : Number(item.base_price || 0);
          const origP = item.variant_id
            ? Number(item.variant_original_price || 0)
            : Number(item.base_original_price || 0);

          const finalSellingPrice = origP > 0 ? origP : baseP;

          return {
            id: item.id,
            name: item.name,
            price: finalSellingPrice,
            qty: item.quantity,
            variant: item.variant_key || "Standar",
            weight: 200,
          };
        });

        setCartItems(formatted);
        if (formatted.length === 0) {
          navigate("/products");
          return;
        }

        // Tambahkan ini di dalam initCheckoutData setelah memuat keranjang
        const voucherRes = await axios.get(
          `${import.meta.env.VITE_API_URL}/vouchers/storefront/${customerUser.id}`,
        );
        if (voucherRes.data.success) {
          setMyVouchers(voucherRes.data.data.my_vouchers);
        }
      }

      if (addrRes.data.success && addrRes.data.data.length > 0) {
        setAddresses(addrRes.data.data);
        setSelectedAddress(addrRes.data.data[0]);
      }
    } catch (error) {
      console.error("Gagal memuat data checkout:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedAddress && cartItems.length > 0) {
      calculateShipping();
    }
  }, [selectedAddress, cartItems]); // 'courier' dihapus dari dependencies

  const calculateShipping = async () => {
    // 1. Validasi: Pastikan alamat dan kodepos tersedia
    if (!selectedAddress || !selectedAddress.postal_code) {
      console.warn("Kodepos belum lengkap, tidak bisa hitung ongkir.");
      return;
    }

    setShippingLoading(true);
    setShippingOptions([]);

    // 2. Sanitasi data: Pastikan weight dan price minimal 1 agar tidak ditolak API
    const totalWeight = cartItems.reduce(
      (total, item) => total + Math.max(item.weight || 200, 1) * item.qty,
      0,
    );

    const cartTotalValue = cartItems.reduce(
      (total, item) => total + Math.max(item.price || 10000, 1000) * item.qty,
      0,
    );

    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/shipping-cost`,
        {
          postal_code: String(selectedAddress.postal_code), // Pastikan jadi String
          city: selectedAddress.city,
          province: selectedAddress.province,
          total_weight: totalWeight,
          courier: "",
          cart_items: cartItems.map((item) => ({
            ...item,
            weight: Math.max(item.weight || 200, 1), // Pastikan berat minimal 1g
            price: Math.max(item.price || 10000, 1000), // Pastikan harga minimal
          })),
          cart_value: cartTotalValue,
        },
      );

      if (res.data.success) {
        setShippingOptions(res.data.data);
        if (res.data.data.length > 0) {
          setSelectedShipping(res.data.data[0]);
        }
      } else {
        console.error("API Shipping gagal:", res.data.message);
      }
    } catch (error) {
      console.error(
        "Error Detail dari Backend:",
        error.response?.data || error.message,
      );
    } finally {
      setShippingLoading(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress) return alert("Silakan pilih alamat pengiriman!");
    if (!selectedShipping) return alert("Opsi pengiriman belum tersedia!");

    setIsSubmitting(true);
    setTimeout(() => {
      alert("Pesanan Berhasil Dibuat! Mengalihkan ke halaman pembayaran...");
      setIsSubmitting(false);
      navigate("/orders");
    }, 1500);
  };

  const cartTotal = cartItems.reduce(
    (total, item) => total + item.price * item.qty,
    0,
  );
  const shippingCost = selectedShipping ? selectedShipping.cost : 0;
  const grandTotal = cartTotal + shippingCost;

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-2">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-chester-pink"></div>
        <p className="text-sm text-gray-500">
          Menyiapkan halaman pembayaran...
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50/50 min-h-screen font-lora py-10">
      <div className="container mx-auto px-4 max-w-6xl">
        <Link
          to="/products"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-chester-pink mb-8 transition font-medium"
        >
          <ChevronLeft size={16} /> Kembali Belanja
        </Link>

        <h1 className="text-2xl lg:text-3xl font-bold text-chester-text mb-8">
          Checkout
        </h1>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          <div className="w-full lg:w-2/3 flex flex-col gap-6">
            {/* SECTION 1: ALAMAT PENGIRIMAN */}
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3 mb-4 border-b border-gray-50 pb-3">
                <div className="w-8 h-8 rounded-lg bg-pink-50 text-chester-pink flex items-center justify-center">
                  <MapPin size={18} />
                </div>
                <h2 className="text-base font-bold text-chester-text uppercase tracking-wider">
                  Alamat Pengiriman
                </h2>
              </div>

              {addresses.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500 mb-3">
                    Anda belum menyimpan alamat.
                  </p>
                  <Link
                    to="/addresses"
                    className="px-4 py-2 bg-chester-pink text-white rounded-lg text-xs font-bold"
                  >
                    Tambah Alamat Baru
                  </Link>
                </div>
              ) : (
                <div>
                  <div className="border border-chester-pink bg-pink-50/10 p-4 rounded-xl relative">
                    <span className="absolute top-4 right-4 bg-chester-pink text-white text-[10px] font-bold px-2 py-0.5 rounded">
                      Alamat Terpilih
                    </span>
                    <p className="font-bold text-sm text-chester-text mb-1">
                      {selectedAddress.recipient_name}{" "}
                      <span className="font-normal text-gray-500">
                        ({selectedAddress.phone})
                      </span>
                    </p>
                    <p className="text-xs text-gray-600 leading-relaxed max-w-md">
                      {selectedAddress.full_address}, {selectedAddress.district}
                      , {selectedAddress.city}, {selectedAddress.province},{" "}
                      {selectedAddress.postal_code}
                    </p>
                  </div>

                  {addresses.length > 1 && (
                    <select
                      onChange={(e) =>
                        setSelectedAddress(
                          addresses.find(
                            (a) => a.id === Number(e.target.value),
                          ),
                        )
                      }
                      className="mt-4 w-full px-4 py-2.5 border border-gray-200 rounded-lg text-xs font-semibold text-gray-600 focus:outline-none focus:border-chester-pink"
                    >
                      {addresses.map((addr) => (
                        <option key={addr.id} value={addr.id}>
                          Ganti Alamat: {addr.full_address.substring(0, 40)}...
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}
            </div>

            {/* SECTION 2: JASA PENGIRIMAN (KURIR) - DINAMIS */}
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3 mb-4 border-b border-gray-50 pb-3">
                <div className="w-8 h-8 rounded-lg bg-pink-50 text-chester-pink flex items-center justify-center">
                  <Truck size={18} />
                </div>
                <h2 className="text-base font-bold text-chester-text uppercase tracking-wider">
                  Opsi Pengiriman
                </h2>
              </div>

              {shippingLoading ? (
                <div className="text-center py-6 text-sm text-gray-400">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-200 border-t-chester-pink mx-auto mb-2"></div>
                  Menghitung tarif ongkos kirim...
                </div>
              ) : shippingOptions.length === 0 ? (
                <div className="text-center py-6 text-sm text-red-400">
                  {selectedAddress
                    ? "Gagal memuat tarif kurir atau API Key belum dikonfigurasi."
                    : "Pilih alamat terlebih dahulu untuk melihat ongkos kirim."}
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {shippingOptions.map((opt, idx) => (
                    <label
                      key={idx}
                      className={`flex items-center justify-between p-4 border rounded-xl cursor-pointer transition ${selectedShipping?.service === opt.service ? "border-chester-pink bg-pink-50/20" : "border-gray-100 hover:border-gray-300"}`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="shipping_service"
                          checked={selectedShipping?.service === opt.service}
                          onChange={() => setSelectedShipping(opt)}
                          className="accent-chester-pink w-4 h-4"
                        />
                        <div>
                          <p className="text-xs font-bold text-chester-text uppercase">
                            {opt.service}
                          </p>
                          <p className="text-[11px] text-gray-400 mt-0.5">
                            Estimasi Tiba: {opt.etd}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-chester-text">
                        {formatRupiah(opt.cost)}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* SECTION 3: METODE PEMBAYARAN */}
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3 mb-4 border-b border-gray-50 pb-3">
                <div className="w-8 h-8 rounded-lg bg-pink-50 text-chester-pink flex items-center justify-center">
                  <CreditCard size={18} />
                </div>
                <h2 className="text-base font-bold text-chester-text uppercase tracking-wider">
                  Metode Pembayaran
                </h2>
              </div>

              <div className="flex flex-col gap-2">
                <label
                  className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer ${paymentMethod === "transfer" ? "border-chester-pink bg-pink-50/20" : "border-gray-100"}`}
                >
                  <input
                    type="radio"
                    checked={paymentMethod === "transfer"}
                    onChange={() => setPaymentMethod("transfer")}
                    className="accent-chester-pink w-4 h-4"
                  />
                  <span className="text-xs font-bold text-chester-text">
                    Manual Bank Transfer (BCA / Mandiri)
                  </span>
                </label>
                <label
                  className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer ${paymentMethod === "qris" ? "border-chester-pink bg-pink-50/20" : "border-gray-100"}`}
                >
                  <input
                    type="radio"
                    checked={paymentMethod === "qris"}
                    onChange={() => setPaymentMethod("qris")}
                    className="accent-chester-pink w-4 h-4"
                  />
                  <span className="text-xs font-bold text-chester-text">
                    Instant QRIS (OVO, Dana, GoPay, ShopeePay)
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* KOLOM KANAN: Ringkasan Sticky */}
          <div className="w-full lg:w-1/3 lg:sticky lg:top-28">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-gray-50 bg-gray-50/50 flex items-center gap-2">
                <ShoppingBag size={16} className="text-gray-400" />
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                  Ringkasan Pesanan
                </h3>
              </div>

              {/* Item List */}
              <div className="p-5 max-h-60 overflow-y-auto divide-y divide-gray-50 flex flex-col gap-3">
                {cartItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-start pt-3 first:pt-0 gap-4"
                  >
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-chester-text line-clamp-1">
                        {item.name}
                      </span>
                      <span className="text-[10px] text-gray-400 mt-0.5">
                        Var: {item.variant} &bull; Qty: {item.qty}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-chester-text flex-shrink-0">
                      {formatRupiah(item.price * item.qty)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Kalkulasi */}
              <div className="p-5 bg-gray-50/30 border-t border-gray-50 text-xs flex flex-col gap-3">
                <div className="flex justify-between text-gray-500 font-medium">
                  <span>Subtotal Belanja</span>
                  <span>{formatRupiah(cartTotal)}</span>
                </div>
                <div className="flex justify-between text-gray-500 font-medium">
                  <span>Biaya Pengiriman</span>
                  <span>
                    {shippingLoading
                      ? "Menghitung..."
                      : shippingCost > 0
                        ? formatRupiah(shippingCost)
                        : "Belum dihitung"}
                  </span>
                </div>
                <div className="flex justify-between items-center py-3 border-t border-gray-50">
                  <span className="text-xs font-bold text-gray-500">
                    Voucher
                  </span>
                  <button
                    onClick={() => setShowVoucherModal(true)}
                    className="text-xs text-chester-pink font-bold hover:underline"
                  >
                    {selectedVoucher ? selectedVoucher.name : "Pilih Voucher"}
                  </button>
                </div>

                {/* Logika potongan harga */}
                {selectedVoucher && (
                  <div className="flex justify-between text-xs text-emerald-600 font-bold mb-2">
                    <span>Diskon Voucher</span>
                    <span>-{formatRupiah(selectedVoucher.discount_value)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-black text-chester-text pt-3 border-t border-gray-200">
                  <span>Total Bayar</span>
                  <span className="text-chester-pink text-lg">
                    {formatRupiah(grandTotal)}
                  </span>
                </div>
              </div>

              {/* Action Button */}
              <div className="p-5">
                <button
                  onClick={handlePlaceOrder}
                  disabled={
                    issubmitting || !selectedShipping || shippingLoading
                  }
                  className="w-full bg-chester-pink text-white h-14 font-bold rounded-xl text-sm uppercase tracking-widest hover:bg-pink-600 transition shadow-md flex items-center justify-center gap-2 disabled:bg-gray-300"
                >
                  {issubmitting ? "Memproses..." : "Konfirmasi & Bayar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      {showVoucherModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-2xl w-full max-w-sm max-h-[80vh] overflow-y-auto">
            <h3 className="font-bold mb-4">Voucher Saya</h3>
            {myVouchers.map((v) => (
              <button
                key={v.id}
                onClick={() => {
                  setSelectedVoucher(v);
                  setShowVoucherModal(false);
                }}
                className="w-full p-3 border rounded-xl mb-2 text-left hover:bg-pink-50"
              >
                <p className="text-sm font-bold">{v.name}</p>
                <p className="text-[10px] text-gray-500">
                  Berlaku sampai {v.end_date}
                </p>
              </button>
            ))}
            <button
              onClick={() => setShowVoucherModal(false)}
              className="w-full mt-4 text-xs text-gray-400"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
