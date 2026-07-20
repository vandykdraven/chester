import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";

export default function SEOTracker() {
  const location = useLocation();
  const [trackingIds, setTrackingIds] = useState({
    metaPixel: "",
    googleAnalytics: "",
    siteVerification: "",
  });
  const [isInitialized, setIsInitialized] = useState(false);

  // 1. Mengambil pengaturan dari Database saat aplikasi pertama kali dimuat
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/settings`,
        );
        if (response.data.success) {
          let apiData = response.data.data;
          let settingsMap = {};

          if (Array.isArray(apiData)) {
            apiData.forEach(
              (i) => (settingsMap[i.setting_key] = i.setting_value),
            );
          } else {
            settingsMap = apiData;
          }

          setTrackingIds({
            metaPixel: settingsMap.meta_pixel_id || "",
            googleAnalytics: settingsMap.google_analytics_id || "",
            siteVerification: settingsMap.google_site_verification || "",
          });
        }
      } catch (error) {
        console.error("Gagal menarik pengaturan pelacakan SEO");
      }
    };
    fetchSettings();
  }, []);

  // 2. Menyuntikkan Skrip ke dalam <head> HTML setelah ID didapatkan
  useEffect(() => {
    if (isInitialized) return;

    // Suntikkan Google Site Verification
    if (trackingIds.siteVerification) {
      let metaTag = document.querySelector(
        'meta[name="google-site-verification"]',
      );
      if (!metaTag) {
        metaTag = document.createElement("meta");
        metaTag.name = "google-site-verification";
        document.head.appendChild(metaTag);
      }
      metaTag.content = trackingIds.siteVerification;
    }

    // Suntikkan Skrip Google Analytics / Google Ads
    if (trackingIds.googleAnalytics) {
      const gaScript = document.createElement("script");
      gaScript.async = true;
      gaScript.src = `https://www.googletagmanager.com/gtag/js?id=${trackingIds.googleAnalytics}`;
      document.head.appendChild(gaScript);

      const gaInline = document.createElement("script");
      gaInline.innerHTML = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${trackingIds.googleAnalytics}');
      `;
      document.head.appendChild(gaInline);
    }

    // Suntikkan Skrip Meta Pixel
    if (trackingIds.metaPixel) {
      const fbInline = document.createElement("script");
      fbInline.innerHTML = `
        !function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window, document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');
        fbq('init', '${trackingIds.metaPixel}');
      `;
      document.head.appendChild(fbInline);
    }

    // Tandai bahwa skrip sudah disuntikkan agar tidak terjadi duplikasi
    if (
      trackingIds.googleAnalytics ||
      trackingIds.metaPixel ||
      trackingIds.siteVerification
    ) {
      setIsInitialized(true);
    }
  }, [trackingIds, isInitialized]);

  // 3. Melacak perpindahan halaman (Page View) setiap kali URL berubah
  useEffect(() => {
    if (!isInitialized) return;

    // Kirim event PageView ke Meta Pixel
    if (window.fbq && trackingIds.metaPixel) {
      window.fbq("track", "PageView");
    }

    // Kirim event page_view ke Google Analytics
    if (window.gtag && trackingIds.googleAnalytics) {
      window.gtag("config", trackingIds.googleAnalytics, {
        page_path: location.pathname + location.search,
      });
    }
  }, [location, isInitialized, trackingIds]);

  // Komponen ini berjalan di latar belakang, tidak menampilkan UI apapun
  return null;
}
