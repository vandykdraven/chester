import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  MapPin,
  Truck,
  CreditCard,
  ChevronLeft,
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

  const [shippingOptions, setShippingOptions] = useState([]);
  const [selectedShipping, setSelectedShipping] = useState(null);

  // STATE BARU: Menampung rekening dari database
  const [bankAccounts, setBankAccounts] = useState([]);
  const [selectedPayment, setSelectedPayment] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shippingLoading, setShippingLoading] = useState(false);
  const [shippingError, setShippingError] = useState(null);

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
            product_id: item.product_id,
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

  // FETCH PEMBAYARAN
  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const fetchPaymentMethods = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/settings`,
      );
      if (response.data.success) {
        // Data dari backend sekarang berupa objek tunggal, kita perlu memastikan cara aksesnya benar
        // Karena di skrip Anda sebelumnya Anda menggunakan Array.find, mari kita sesuaikan agar aman.

        let paymentStringData = "";

        if (Array.isArray(response.data.data)) {
          // Jika backend mengembalikan array
          const paymentSetting = response.data.data.find(
            (item) => item.setting_key === "payment_accounts",
          );
          if (paymentSetting) paymentStringData = paymentSetting.setting_value;
        } else {
          // Jika backend mengembalikan object (perbaikan terbaru)
          paymentStringData = response.data.data.payment_accounts;
        }

        if (paymentStringData) {
          const parsedAccounts = JSON.parse(paymentStringData);
          setBankAccounts(parsedAccounts);

          if (parsedAccounts.length > 0) {
            setSelectedPayment(parsedAccounts[0].bank_name);
          }
        }
      }
    } catch (error) {
      console.error("Gagal memuat metode pembayaran:", error);
    }
  };

  useEffect(() => {
    if (selectedAddress && cartItems.length > 0) {
      calculateShipping();
    }
  }, [selectedAddress, cartItems]);

  const calculateShipping = async () => {
    if (!selectedAddress || !selectedAddress.city_id) {
      setShippingError(
        "Wilayah pengiriman tidak valid. Harap perbarui alamat Anda agar sistem logistik dapat menjangkau tujuan.",
      );
      return;
    }

    setShippingLoading(true);
    setShippingOptions([]);
    setShippingError(null);
    setSelectedShipping(null);

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
          city_id: selectedAddress.city_id,
          total_weight: totalWeight,
          courier: "",
          cart_items: cartItems.map((item) => ({
            ...item,
            weight: Math.max(item.weight || 200, 1),
            price: Math.max(item.price || 10000, 1000),
          })),
          cart_value: cartTotalValue,
        },
      );

      if (res.data.success) {
        const rawOptions = res.data.data;
        const grouped = {};

        rawOptions.forEach((opt) => {
          const courierName = opt.service.split(" ")[0] || "LAINNYA";
          const serviceName = opt.service.substring(courierName.length).trim();

          if (!grouped[courierName]) {
            grouped[courierName] = [];
          }

          grouped[courierName].push({
            fullService: opt.service,
            serviceName: serviceName,
            cost: opt.cost,
            etd: opt.etd,
          });
        });

        const groupedArray = Object.keys(grouped).map((courier) => ({
          courierName: courier,
          services: grouped[courier],
        }));

        setShippingOptions(groupedArray);

        if (groupedArray.length > 0 && groupedArray[0].services.length > 0) {
          setSelectedShipping(groupedArray[0].services[0]);
        }
      } else {
        setShippingError(res.data.message || "Gagal memproses tarif.");
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        "Terjadi kesalahan pada server Logistik. Rute tidak ditemukan.";
      setShippingError(errorMessage);
    } finally {
      setShippingLoading(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress) return alert("Silakan pilih alamat pengiriman!");
    if (!selectedShipping) return alert("Opsi pengiriman belum tersedia!");
    if (!selectedPayment)
      return alert("Silakan pilih metode pembayaran terlebih dahulu!");

    setIsSubmitting(true);

    const orderPayload = {
      user_id: customerUser.id,
      address: selectedAddress,
      shipping_option: {
        courierName: selectedShipping.fullService.split(" ")[0],
        serviceName: selectedShipping.serviceName,
      },
      cart_items: cartItems.map((item) => ({
        product_id: item.product_id,
        name: item.name,
        variant: item.variant,
        price: item.price,
        qty: item.qty,
        weight: item.weight || 200,
      })),
      subtotal: cartTotal,
      shipping_cost: shippingCost,
      discount_amount: discountAmount,
      grand_total: grandTotal,
    };

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/orders`,
        orderPayload,
      );

      if (response.data.success) {
        // RESET KERANJANG BELANJA
        window.dispatchEvent(new Event("cartUpdated"));

        localStorage.setItem(
          `payment_for_${response.data.orderId}`,
          selectedPayment,
        );

        // PINDAH HALAMAN
        navigate(`/payment-confirmation/${response.data.orderId}`);
      }
    } catch (error) {
      console.error("Gagal men-checkout pesanan:", error);
      alert("Gagal memproses pesanan. Periksa koneksi Anda.");
      setIsSubmitting(false);
    }
  };

  const cartTotal = cartItems.reduce(
    (total, item) => total + item.price * item.qty,
    0,
  );

  const shippingCost = selectedShipping ? selectedShipping.cost : 0;

  let discountAmount = 0;
  if (selectedVoucher) {
    if (cartTotal >= Number(selectedVoucher.min_purchase || 0)) {
      if (selectedVoucher.discount_type === "percent") {
        let calcDiscount =
          (cartTotal * Number(selectedVoucher.discount_value)) / 100;
        const maxDiscount = Number(selectedVoucher.max_discount || 0);
        if (maxDiscount > 0 && calcDiscount > maxDiscount) {
          calcDiscount = maxDiscount;
        }
        discountAmount = calcDiscount;
      } else {
        discountAmount = Number(selectedVoucher.discount_value);
      }
    }
  }

  const grandTotal = Math.max(cartTotal + shippingCost - discountAmount, 0);

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
                      , {selectedAddress.city}, {selectedAddress.province}
                      {selectedAddress.postal_code
                        ? `, ${selectedAddress.postal_code}`
                        : ""}
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

            {/* SECTION 2: JASA PENGIRIMAN (KURIR) */}
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
                <div className="text-center py-6 text-sm text-red-500 px-4">
                  {shippingError ? (
                    <span className="font-semibold">{shippingError}</span>
                  ) : selectedAddress ? (
                    "Gagal memuat tarif kurir atau API Key belum dikonfigurasi."
                  ) : (
                    "Pilih alamat terlebih dahulu untuk melihat ongkos kirim."
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {shippingOptions.map((group, groupIdx) => {
                    const currentSelectedInGroup = group.services.find(
                      (s) => s.fullService === selectedShipping?.fullService,
                    );

                    return (
                      <div
                        key={groupIdx}
                        className={`p-4 border rounded-xl transition ${
                          currentSelectedInGroup
                            ? "border-chester-pink bg-pink-50/10"
                            : "border-gray-100"
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-black text-gray-800 uppercase tracking-wide">
                              {group.courierName} Express
                            </p>
                            {currentSelectedInGroup && (
                              <p className="text-[11px] text-chester-pink font-semibold mt-0.5">
                                Terpilih: {selectedShipping.serviceName} &bull;
                                Estimasi {selectedShipping.etd}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-3 w-full sm:w-auto">
                            <select
                              value={
                                currentSelectedInGroup
                                  ? selectedShipping.fullService
                                  : ""
                              }
                              onChange={(e) => {
                                const matchedService = group.services.find(
                                  (s) => s.fullService === e.target.value,
                                );
                                if (matchedService) {
                                  setSelectedShipping(matchedService);
                                }
                              }}
                              className="w-full sm:w-56 px-3 py-2 border border-gray-200 rounded-lg text-xs font-bold text-gray-700 bg-white outline-none focus:border-chester-pink"
                            >
                              <option value="" disabled>
                                -- Pilih Layanan {group.courierName} --
                              </option>
                              {group.services.map((srv, srvIdx) => (
                                <option key={srvIdx} value={srv.fullService}>
                                  {srv.serviceName} ({formatRupiah(srv.cost)})
                                </option>
                              ))}
                            </select>

                            <span className="text-sm font-extrabold text-gray-900 shrink-0 min-w-[80px] text-right">
                              {currentSelectedInGroup
                                ? formatRupiah(selectedShipping.cost)
                                : "-"}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* SECTION 3: METODE PEMBAYARAN */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm mt-6">
              <div className="flex items-center gap-3 mb-4 border-b border-gray-50 pb-3">
                <div className="w-8 h-8 rounded-lg bg-pink-50 text-chester-pink flex items-center justify-center">
                  <CreditCard size={18} />
                </div>
                <h2 className="text-base font-bold text-chester-text uppercase tracking-wider">
                  Metode Pembayaran
                </h2>
              </div>

              <div className="flex flex-col gap-3">
                {bankAccounts.length > 0 ? (
                  bankAccounts.map((bank, index) => (
                    <label
                      key={index}
                      className={`flex items-center justify-between p-4 border rounded-xl cursor-pointer transition-all ${
                        selectedPayment === bank.bank_name
                          ? "border-pink-500 bg-pink-50"
                          : "border-gray-200 hover:border-pink-300"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="payment_method"
                          value={bank.bank_name}
                          checked={selectedPayment === bank.bank_name}
                          onChange={(e) => setSelectedPayment(e.target.value)}
                          className="w-4 h-4 text-pink-600 focus:ring-pink-500 cursor-pointer"
                        />
                        <div>
                          <p className="text-sm font-bold text-gray-800">
                            Transfer {bank.bank_name}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            a.n. {bank.bank_owner}
                          </p>
                        </div>
                      </div>
                    </label>
                  ))
                ) : (
                  <div className="text-sm text-gray-500 text-center py-6 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    Sistem belum mengatur rekening pembayaran.
                  </div>
                )}
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

                <div className="flex justify-between items-center py-2 border-y border-dashed border-gray-200 my-1">
                  <span className="text-xs font-bold text-gray-500">
                    Voucher Diskon
                  </span>
                  <button
                    onClick={() => setShowVoucherModal(true)}
                    className="text-xs text-chester-pink font-bold hover:underline bg-pink-50 px-3 py-1 rounded-full"
                  >
                    {selectedVoucher ? "Ganti Voucher" : "Pilih Voucher"}
                  </button>
                </div>

                {selectedVoucher && (
                  <div className="flex justify-between text-emerald-600 font-bold mb-1">
                    <span>Promo: {selectedVoucher.name}</span>
                    <span>
                      {cartTotal < Number(selectedVoucher.min_purchase || 0)
                        ? "Minimal belanja belum tercapai"
                        : `-${formatRupiah(discountAmount)}`}
                    </span>
                  </div>
                )}

                <div className="flex justify-between text-gray-500 font-medium mt-1">
                  <span>Biaya Pengiriman</span>
                  <span>
                    {shippingLoading
                      ? "Menghitung..."
                      : shippingCost > 0
                        ? formatRupiah(shippingCost)
                        : "Belum dihitung"}
                  </span>
                </div>

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
                    isSubmitting ||
                    !selectedShipping ||
                    shippingLoading ||
                    !selectedPayment
                  }
                  className="w-full bg-chester-pink text-white h-14 font-bold rounded-xl text-sm uppercase tracking-widest hover:bg-pink-600 transition shadow-md flex items-center justify-center gap-2 disabled:bg-gray-300"
                >
                  {isSubmitting ? "Memproses..." : "Konfirmasi & Bayar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL VOUCHER */}
      {showVoucherModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white p-6 rounded-2xl w-full max-w-sm max-h-[80vh] flex flex-col shadow-2xl">
            <h3 className="font-bold text-lg text-chester-text mb-4 border-b pb-3">
              Voucher Saya
            </h3>

            <div className="overflow-y-auto flex-1 flex flex-col gap-3 custom-scrollbar pr-2">
              {myVouchers.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">
                  Belum ada voucher yang Anda simpan/klaim.
                </div>
              ) : (
                myVouchers.map((v) => {
                  const isEligible = cartTotal >= Number(v.min_purchase || 0);

                  return (
                    <button
                      key={v.id}
                      disabled={!isEligible}
                      onClick={() => {
                        setSelectedVoucher(v);
                        setShowVoucherModal(false);
                      }}
                      className={`w-full p-4 border rounded-xl text-left transition relative ${
                        isEligible
                          ? "hover:border-chester-pink hover:bg-pink-50 cursor-pointer border-gray-200"
                          : "bg-gray-50 border-gray-100 opacity-60 cursor-not-allowed"
                      } ${
                        selectedVoucher?.id === v.id
                          ? "border-chester-pink ring-1 ring-chester-pink bg-pink-50/50"
                          : ""
                      }`}
                    >
                      <p className="text-sm font-bold text-chester-text">
                        {v.name}
                      </p>
                      {v.discount_type === "percent" ? (
                        <p className="text-xs text-chester-pink font-bold mt-1">
                          Diskon {v.discount_value}%
                        </p>
                      ) : (
                        <p className="text-xs text-chester-pink font-bold mt-1">
                          Potongan {formatRupiah(v.discount_value)}
                        </p>
                      )}

                      <p className="text-[10px] text-gray-500 mt-2">
                        Min. Belanja: {formatRupiah(v.min_purchase || 0)}
                      </p>

                      {!isEligible && (
                        <div className="absolute inset-0 bg-white/40 flex items-center justify-center rounded-xl">
                          <span className="bg-black/70 text-white text-[10px] px-2 py-1 rounded font-bold">
                            Minimal Belanja Belum Tercapai
                          </span>
                        </div>
                      )}
                    </button>
                  );
                })
              )}
            </div>

            <div className="mt-4 pt-3 border-t flex flex-col gap-2">
              {selectedVoucher && (
                <button
                  onClick={() => {
                    setSelectedVoucher(null);
                    setShowVoucherModal(false);
                  }}
                  className="w-full text-xs text-red-500 font-bold py-2 hover:bg-red-50 rounded-lg"
                >
                  Batalkan Penggunaan Voucher
                </button>
              )}
              <button
                onClick={() => setShowVoucherModal(false)}
                className="w-full py-3 bg-gray-100 text-gray-600 rounded-xl text-xs font-bold hover:bg-gray-200 transition"
              >
                Tutup Jendela
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
