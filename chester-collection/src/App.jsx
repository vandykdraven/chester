import { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useNavigate,
  useLocation,
} from "react-router-dom";
import logo from "./assets/logo.png";
import { Search, User, ShoppingBag, Menu, X, Trash2 } from "lucide-react";
import axios from "axios";
import api from "./api";

// Import Halaman Pelanggan
import Home from "./pages/Home";
import Catalog from "./pages/Catalog";
import ProductPage from "./pages/ProductPage";
import AddressBook from "./pages/AddressBook";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ProfileCustomer from "./pages/Profile";
import PaymentConfirmation from "./pages/PaymentConfirmation";
import Orders from "./pages/Orders";
import Vouchers from "./pages/Vouchers";
import Wishlist from "./pages/Wishlist";
import Checkout from "./pages/Checkout";
import StaticPage from "./pages/StaticPage"; // Halaman Statis
import SEOTracker from "./components/SEOTracker";

// Import Halaman Admin
import AdminLayout from "./pages/admin/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import ProductList from "./pages/admin/ProductList";
import ProductAdd from "./pages/admin/ProductAdd";
import ProductTag from "./pages/admin/ProductTag";
import AdminLogin from "./pages/admin/AdminLogin";
import ProductEdit from "./pages/admin/ProductEdit";
import GalleryList from "./pages/admin/GalleryList";
import SizeGuideList from "./pages/admin/SizeGuideList";
import SizeGuideForm from "./pages/admin/SizeGuideForm";
import ProductCategory from "./pages/admin/ProductCategory";
import CustomerList from "./pages/admin/CustomerList";
import OrderList from "./pages/admin/OrderList";
import OrderDetail from "./pages/admin/OrderDetail";
import Settings from "./pages/admin/Settings";
import VoucherList from "./pages/admin/VoucherList";
import CustomerDetail from "./pages/admin/CustomerDetail";
import ShippingSettings from "./pages/admin/ShippingSettings";
import HomepageSettings from "./pages/admin/HomepageSettings";
import StaticPageEdit from "./pages/admin/StaticPageEdit";
import AdminReviews from "./pages/admin/AdminReviews";

// Import Penjaga Rute
import AdminGuard from "./components/AdminGuard";

const formatRupiah = (angka) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(angka);
};

// =======================================================================
// KOMPONEN HEADER
// =======================================================================
const Header = ({ setIsCartOpen, cartCount }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [customerName, setCustomerName] = useState("");

  const [activeVouchers, setActiveVouchers] = useState([]);
  const [currentVoucherIndex, setCurrentVoucherIndex] = useState(0);

  const [dynamicMenus, setDynamicMenus] = useState([]);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const token =
      localStorage.getItem("customerToken") ||
      sessionStorage.getItem("customerToken");
    const userStr =
      localStorage.getItem("customerUser") ||
      sessionStorage.getItem("customerUser");

    setIsLoggedIn(!!token);

    if (userStr) {
      const userObj = JSON.parse(userStr);
      setCustomerName(userObj.fullname.split(" ")[0]);
    } else {
      setCustomerName("");
    }
  }, [location.pathname]);

  useEffect(() => {
    const fetchHeaderData = async () => {
      try {
        const voucherRes = await axios.get(
          `${import.meta.env.VITE_API_URL}/vouchers`,
        );
        if (voucherRes.data.success && voucherRes.data.data.length > 0) {
          const now = new Date();

          const validVouchers = voucherRes.data.data.filter((v) => {
            const isActive =
              v.status === "active" ||
              v.is_active === 1 ||
              v.is_active === true;
            const expiryDateStr = v.end_date || v.valid_until || v.expired_at;
            const isNotExpired = expiryDateStr
              ? new Date(expiryDateStr) >= now
              : true;

            return isActive && isNotExpired;
          });

          setActiveVouchers(validVouchers);
        }

        const [catRes, setRes] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_URL}/categories`),
          axios.get(`${import.meta.env.VITE_API_URL}/settings`),
        ]);

        let activeMenuIds = [];
        if (setRes.data.success) {
          const apiData = setRes.data.data;
          let settingsMap = {};
          if (Array.isArray(apiData)) {
            apiData.forEach(
              (i) => (settingsMap[i.setting_key] = i.setting_value),
            );
          } else {
            settingsMap = apiData;
          }

          if (settingsMap.frontend_active_menus) {
            try {
              const parsedMenus = JSON.parse(settingsMap.frontend_active_menus);
              if (Array.isArray(parsedMenus)) {
                activeMenuIds = parsedMenus.map(String);
              }
            } catch (e) {
              console.error("Gagal parse pengaturan menu", e);
            }
          }
        }

        if (catRes.data.success && activeMenuIds.length > 0) {
          const allCategories = catRes.data.data;
          const filteredMenus = allCategories.filter((cat) =>
            activeMenuIds.includes(String(cat.id)),
          );
          setDynamicMenus(filteredMenus);
        }
      } catch (error) {
        console.error("Gagal menarik data Header:", error);
      }
    };

    fetchHeaderData();
  }, []);

  useEffect(() => {
    if (activeVouchers.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentVoucherIndex((prev) => (prev + 1) % activeVouchers.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [activeVouchers.length]);

  const handleProfileClick = () => {
    if (isLoggedIn) {
      navigate("/profile");
    } else {
      navigate("/login", { state: { from: location.pathname } });
    }
  };

  return (
    <>
      <header className="bg-white border-b border-gray-100 font-lora sticky top-0 z-40">
        {/* VOUCHER BAR: Hanya dirender (ditampilkan) jika ada voucher aktif */}
        {activeVouchers.length > 0 && (
          <div className="bg-chester-pink text-white text-xs py-2 px-4 relative overflow-hidden min-h-[36px] flex justify-center items-center">
            {activeVouchers.map((voucher, index) => (
              <div
                key={voucher.id || index}
                className={`absolute flex justify-center items-center gap-2 w-full transition-all duration-700 ease-in-out ${
                  index === currentVoucherIndex
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 -translate-y-full pointer-events-none"
                }`}
              >
                <span>
                  Spesial! Gunakan kode voucher{" "}
                  <b className="bg-white/20 px-2 py-0.5 rounded tracking-wider">
                    {voucher.code}
                  </b>
                </span>
                <Link
                  to="/vouchers"
                  className="underline font-bold hover:text-pink-200 transition bg-white text-chester-pink px-2 py-0.5 rounded-full ml-2"
                >
                  Klaim Voucher
                </Link>
              </div>
            ))}
          </div>
        )}

        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center">
            <button
              className="lg:hidden mr-4"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="h-6 w-6 text-chester-text" />
            </button>
            <Link to="/">
              <img
                src={logo}
                alt="Chester Collection Logo"
                className="h-12 lg:h-16"
              />
            </Link>
          </div>

          <nav className="hidden lg:flex flex-grow justify-center items-center gap-8">
            <Link
              to="/"
              className="text-sm font-bold text-chester-text hover:text-chester-pink transition"
            >
              Beranda
            </Link>
            <Link
              to="/products"
              className="text-sm font-bold text-chester-text hover:text-chester-pink transition"
            >
              Katalog
            </Link>

            {/* MENU KATEGORI DINAMIS DARI DATABASE */}
            {dynamicMenus.map((menu) => (
              <Link
                key={menu.slug}
                to={`/products?category=${menu.slug}`}
                className="text-sm font-bold text-chester-text hover:text-chester-pink transition"
              >
                {menu.name}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-4 lg:gap-5">
            <button>
              <Search className="h-5 w-5 text-chester-text hover:text-chester-pink transition" />
            </button>
            <button
              onClick={handleProfileClick}
              className="flex items-center gap-1.5 hover:text-chester-pink transition cursor-pointer"
              title={isLoggedIn ? "Profil Saya" : "Masuk Akun"}
            >
              <User className="h-5 w-5 text-inherit" />
              {isLoggedIn && customerName && (
                <span className="text-sm font-bold hidden sm:block">
                  Hai, {customerName}
                </span>
              )}
            </button>
            <button
              onClick={() => setIsCartOpen(true)}
              className="flex items-center gap-1 group relative"
            >
              <ShoppingBag className="h-5 w-5 text-chester-text group-hover:text-chester-pink transition" />
              <span className="absolute -top-1.5 -right-2 bg-chester-pink text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center shadow">
                {cartCount}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* MOBILE MENU */}
      <div
        className={`fixed inset-0 z-50 bg-black/50 lg:hidden transition-opacity duration-300 ${isMobileMenuOpen ? "opacity-100 visible" : "opacity-0 invisible"}`}
        onClick={() => setIsMobileMenuOpen(false)}
      >
        <div
          className={`absolute top-0 left-0 bottom-0 w-3/4 max-w-sm bg-white p-6 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-10 border-b border-gray-100 pb-4">
            <img src={logo} alt="Logo" className="h-8" />
            <button onClick={() => setIsMobileMenuOpen(false)}>
              <X className="h-6 w-6 text-gray-400 hover:text-chester-pink" />
            </button>
          </div>
          <nav className="flex flex-col gap-6 font-lora">
            <Link
              to="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-lg font-bold text-chester-text hover:text-chester-pink"
            >
              Beranda
            </Link>
            <Link
              to="/products"
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-lg font-bold text-chester-text hover:text-chester-pink"
            >
              Katalog
            </Link>

            {dynamicMenus.map((menu) => (
              <Link
                key={menu.id}
                to={`/products?category=${menu.id}`}
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-lg font-bold text-chester-text hover:text-chester-pink"
              >
                {menu.name}
              </Link>
            ))}

            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                handleProfileClick();
              }}
              className="text-lg font-bold text-left text-chester-text hover:text-chester-pink mt-4 pt-4 border-t border-gray-100 w-full"
            >
              {isLoggedIn ? "Profil Saya" : "Akun Saya / Masuk"}
            </button>
          </nav>
        </div>
      </div>
    </>
  );
};

// =======================================================================
// KOMPONEN FOOTER (KEMBALI KE STRUKTUR AWAL)
// =======================================================================
const Footer = () => {
  const [socials, setSocials] = useState({});

  useEffect(() => {
    const fetchFooterSettings = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/settings`,
        );
        if (response.data.success) {
          let apiData = response.data.data;
          if (Array.isArray(apiData)) {
            const mapped = {};
            apiData.forEach((i) => (mapped[i.setting_key] = i.setting_value));
            apiData = mapped;
          }
          setSocials({
            facebook: apiData.social_facebook || "",
            instagram: apiData.social_instagram || "",
            tiktok: apiData.social_tiktok || "",
            twitter: apiData.social_twitter || "",
          });
        }
      } catch (e) {
        console.error("Gagal menarik pengaturan footer");
      }
    };
    fetchFooterSettings();
  }, []);

  return (
    <footer className="bg-chester-pink text-white py-8 font-lora mt-auto">
      <div className="container mx-auto px-4">
        {/* Struktur Orisinal: Terpusat secara horizontal */}
        <div className="flex flex-col md:flex-row flex-wrap justify-center items-center gap-6 md:gap-10 mb-8">
          {/* 1. Bagian Logo */}
          <div className="bg-white rounded-full p-1.5 shadow-sm">
            <img
              src={logo}
              alt="Chester Collection"
              className="h-10 w-10 object-contain"
            />
          </div>

          {/* 2. Bagian Menu Statis */}
          <div className="flex flex-wrap justify-center gap-6 text-sm font-medium opacity-90">
            <Link
              to="/page/privacy"
              className="hover:opacity-100 hover:scale-105 transition-all duration-300"
            >
              Kebijakan Privasi
            </Link>
            <Link
              to="/page/faq"
              className="hover:opacity-100 hover:scale-105 transition-all duration-300"
            >
              FAQ
            </Link>
            <Link
              to="/page/terms"
              className="hover:opacity-100 hover:scale-105 transition-all duration-300"
            >
              Syarat & Ketentuan
            </Link>
          </div>

          {/* 3. Bagian Ikon Media Sosial (Dengan data dinamis) */}
          <div className="flex items-center gap-5 md:ml-4">
            {socials.facebook && (
              <a
                href={socials.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="opacity-80 hover:opacity-100 hover:scale-110 transition-all duration-300"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                </svg>
              </a>
            )}
            {socials.instagram && (
              <a
                href={socials.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="opacity-80 hover:opacity-100 hover:scale-110 transition-all duration-300"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
              </a>
            )}
            {socials.tiktok && (
              <a
                href={socials.tiktok}
                target="_blank"
                rel="noopener noreferrer"
                className="opacity-80 hover:opacity-100 hover:scale-110 transition-all duration-300"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
                </svg>
              </a>
            )}
            {socials.twitter && (
              <a
                href={socials.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="opacity-80 hover:opacity-100 hover:scale-110 transition-all duration-300"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5v3a3 3 0 0 1-3-3v11a7 7 0 1 1-7-7v3"></path>
                </svg>
              </a>
            )}
          </div>
        </div>

        {/* 4. Bagian Copyright dan Template by ServerMaya */}
        <div className="text-center text-xs opacity-80 border-t border-white/20 pt-6 max-w-5xl mx-auto flex flex-col items-center gap-1">
          <p>
            &copy; {new Date().getFullYear()} Chester Collection. Hak Cipta
            Dilindungi.
          </p>
          <p>
            Template by{" "}
            <a
              href="https://servermaya.web.id"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold hover:underline hover:text-white transition"
            >
              ServerMaya
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
};

// =======================================================================
// KOMPONEN TRACKER BACKGROUND
// =======================================================================
function PageTracker() {
  const location = useLocation();

  useEffect(() => {
    const sendTrackingData = async () => {
      try {
        let productId = null;

        if (location.pathname.startsWith("/product/")) {
          const pathParts = location.pathname.split("/");
          productId = pathParts[pathParts.length - 1];
        }

        await axios.post(`${import.meta.env.VITE_API_URL}/analytics/track`, {
          page_url: location.pathname,
          product_id: productId || null,
        });
      } catch (error) {
        console.error("Gagal mengirim log aktivitas pembeli:", error);
      }
    };

    sendTrackingData();
  }, [location.pathname]);

  return null;
}

// =======================================================================
// KOMPONEN BARU: PENYUNTIK SCRIPT MARKETING (GA4, PIXEL, GSC)
// =======================================================================
function MarketingScripts() {
  useEffect(() => {
    const injectScripts = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/settings`,
        );
        if (response.data.success) {
          let settingsMap = {};
          response.data.data.forEach(
            (i) => (settingsMap[i.setting_key] = i.setting_value),
          );

          const gaId = settingsMap.google_analytics_id;
          const pixelId = settingsMap.meta_pixel_id;
          const gscTag = settingsMap.gsc_verification_tag;

          // 1. Google Analytics (GA4) Injection
          if (gaId && !document.getElementById("ga-script-manager")) {
            const script1 = document.createElement("script");
            script1.id = "ga-script-manager";
            script1.async = true;
            script1.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
            document.head.appendChild(script1);

            const script2 = document.createElement("script");
            script2.id = "ga-script-config";
            script2.innerHTML = `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${gaId}');
            `;
            document.head.appendChild(script2);
          }

          // 2. Meta Pixel Injection
          if (pixelId && !document.getElementById("meta-pixel-script")) {
            const script3 = document.createElement("script");
            script3.id = "meta-pixel-script";
            script3.innerHTML = `
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${pixelId}');
              fbq('track', 'PageView');
            `;
            document.head.appendChild(script3);
          }

          // 3. Google Search Console Verification Tag Injection
          if (gscTag && !document.getElementById("gsc-verification-meta")) {
            const meta = document.createElement("meta");
            meta.id = "gsc-verification-meta";
            meta.name = "google-site-verification";
            meta.content = gscTag;
            document.head.appendChild(meta);
          }
        }
      } catch (error) {
        console.error("Gagal menarik konfigurasi skrip marketing:", error);
      }
    };

    injectScripts();
  }, []); // Hanya dieksekusi sekali saat website pertama kali dibuka

  return null; // Komponen ini bekerja di latar belakang, tidak menampilkan apa-apa di layar
}

// =======================================================================
// KOMPONEN UTAMA (APP)
// =======================================================================
export default function App() {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState([]);

  const BASE_URL = import.meta.env.VITE_API_URL.replace("/api", "");

  const fetchCartItems = async () => {
    const userStr =
      localStorage.getItem("customerUser") ||
      sessionStorage.getItem("customerUser");
    if (!userStr) {
      setCartItems([]);
      return;
    }
    const user = JSON.parse(userStr);
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/carts/${user.id}`,
      );
      if (response.data.success) {
        const formattedItems = response.data.data.map((item) => {
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
            image: item.image ? `${BASE_URL}${item.image}` : "/placeholder.png",
          };
        });
        setCartItems(formattedItems);
      }
    } catch (error) {
      console.error("Gagal mengambil data keranjang:", error);
    }
  };

  useEffect(() => {
    fetchCartItems();
    window.addEventListener("cartUpdated", fetchCartItems);
    return () => window.removeEventListener("cartUpdated", fetchCartItems);
  }, []);

  const removeItem = async (id) => {
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/carts/${id}`);
      fetchCartItems();
    } catch (error) {
      console.error("Gagal menghapus produk dari keranjang:", error);
    }
  };

  const cartTotal = cartItems.reduce(
    (total, item) => total + item.price * item.qty,
    0,
  );
  const cartCount = cartItems.reduce((total, item) => total + item.qty, 0);

  return (
    <Router>
      <PageTracker />
      <SEOTracker />
      {/* MENGAKTIFKAN INJEKTOR SCRIPT MARKETING */}
      <MarketingScripts />

      <Routes>
        <Route path="/admin-login" element={<AdminLogin />} />

        <Route element={<AdminGuard />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="products" element={<ProductList />} />
            <Route path="products/add" element={<ProductAdd />} />
            <Route path="product-tags" element={<ProductTag />} />
            <Route path="customers" element={<CustomerList />} />
            <Route path="customers/:id" element={<CustomerDetail />} />
            <Route path="orders" element={<OrderList />} />
            <Route path="orders/:id" element={<OrderDetail />} />
            <Route path="settings" element={<Settings />} />
            <Route path="reviews" element={<AdminReviews />} />
            <Route path="product-categories" element={<ProductCategory />} />
            <Route path="products/edit/:slug" element={<ProductEdit />} />
            <Route path="products/gallery" element={<GalleryList />} />
            <Route path="size-guides" element={<SizeGuideList />} />
            <Route path="size-guides/add" element={<SizeGuideForm />} />
            <Route path="size-guides/edit/:id" element={<SizeGuideForm />} />
            <Route path="product-vouchers" element={<VoucherList />} />
            <Route path="product-shipping" element={<ShippingSettings />} />
            <Route path="homepage-settings" element={<HomepageSettings />} />
            <Route path="pages/:pageId" element={<StaticPageEdit />} />
          </Route>
        </Route>

        <Route
          path="/*"
          element={
            <div className="min-h-screen bg-white flex flex-col font-lora">
              <Header setIsCartOpen={setIsCartOpen} cartCount={cartCount} />

              <div className="flex-grow">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/products" element={<Catalog />} />
                  <Route path="/product/:slug" element={<ProductPage />} />
                  <Route path="/orders" element={<Orders />} />
                  <Route path="/vouchers" element={<Vouchers />} />
                  <Route path="/wishlist" element={<Wishlist />} />

                  {/* ROUTE HALAMAN STATIS */}
                  <Route path="/page/:pageId" element={<StaticPage />} />

                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/profile" element={<ProfileCustomer />} />
                  <Route path="/addresses" element={<AddressBook />} />
                  <Route path="/checkout" element={<Checkout />} />
                  <Route
                    path="/payment-confirmation/:orderId"
                    element={<PaymentConfirmation />}
                  />
                </Routes>
              </div>

              <Footer />

              {/* Laci Keranjang */}
              <div
                className={`fixed inset-0 z-50 bg-black/40 transition-opacity duration-300 ${isCartOpen ? "opacity-100 visible" : "opacity-0 invisible"}`}
                onClick={() => setIsCartOpen(false)}
              >
                <div
                  className={`absolute top-0 right-0 bottom-0 w-full max-w-md bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${isCartOpen ? "translate-x-0" : "translate-x-full"}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex justify-between items-center p-6 border-b border-gray-100">
                    <h2 className="text-lg font-bold text-chester-text uppercase tracking-widest">
                      Keranjang Belanja ({cartCount})
                    </h2>
                    <button
                      onClick={() => setIsCartOpen(false)}
                      className="text-gray-400 hover:text-chester-pink transition p-1"
                    >
                      <X size={24} />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 custom-scrollbar">
                    {cartItems.length === 0 ? (
                      <div className="text-center text-gray-500 mt-10">
                        Keranjang Anda masih kosong.
                      </div>
                    ) : (
                      cartItems.map((item) => (
                        <div key={item.id} className="flex gap-4 group">
                          <div className="w-24 aspect-[3/4] bg-gray-50 flex-shrink-0 rounded-lg overflow-hidden border border-gray-100">
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 flex flex-col justify-between py-1">
                            <div>
                              <div className="flex justify-between items-start mb-1">
                                <h3 className="text-sm font-bold text-chester-text line-clamp-2 pr-4 leading-tight">
                                  {item.name}
                                </h3>
                                <button
                                  onClick={() => removeItem(item.id)}
                                  className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition"
                                  title="Hapus"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                              <p className="text-[11px] font-semibold text-gray-500 bg-gray-100 w-max px-2 py-0.5 rounded border mb-1">
                                {item.variant}
                              </p>
                            </div>
                            <div className="flex justify-between items-end">
                              <span className="text-xs font-semibold text-gray-500 px-3 py-1 bg-gray-50 rounded-lg border border-gray-200">
                                Qty: {item.qty}
                              </span>
                              <span className="text-sm font-bold text-chester-pink">
                                {formatRupiah(item.price * item.qty)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {cartItems.length > 0 && (
                    <div className="border-t border-gray-100 p-6 bg-white shadow-[0_-4px_15px_rgba(0,0,0,0.02)]">
                      <div className="flex justify-between items-center mb-6">
                        <span className="text-sm font-bold text-gray-600 uppercase tracking-widest">
                          Total
                        </span>
                        <span className="text-xl font-black text-chester-text">
                          {formatRupiah(cartTotal)}
                        </span>
                      </div>

                      <div className="flex flex-col gap-3">
                        <Link
                          to="/checkout"
                          onClick={() => {
                            setIsCartOpen(false);
                            window.scrollTo(0, 0);
                          }}
                          className="w-full flex items-center justify-center bg-chester-pink text-white h-14 rounded-xl font-bold text-sm uppercase tracking-widest hover:bg-pink-600 transition shadow-sm"
                        >
                          Checkout Sekarang
                        </Link>
                        <button
                          onClick={() => setIsCartOpen(false)}
                          className="w-full bg-white text-gray-600 border border-gray-200 h-14 rounded-xl font-bold text-sm uppercase tracking-widest hover:bg-gray-50 transition"
                        >
                          Lanjut Belanja
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          }
        />
      </Routes>
    </Router>
  );
}
