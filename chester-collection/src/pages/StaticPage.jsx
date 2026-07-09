import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import axios from "axios";

export default function StaticPage() {
  const { pageId } = useParams(); // 'privacy', 'faq', atau 'terms'
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  let pageTitle = "";
  let settingKey = "";

  if (pageId === "privacy") {
    pageTitle = "Kebijakan Privasi";
    settingKey = "page_privacy";
  } else if (pageId === "faq") {
    pageTitle = "Tanya Jawab (FAQ)";
    settingKey = "page_faq";
  } else if (pageId === "terms") {
    pageTitle = "Syarat & Ketentuan";
    settingKey = "page_terms";
  }

  useEffect(() => {
    // Scroll ke atas setiap kali halaman berpindah
    window.scrollTo(0, 0);

    if (settingKey) {
      fetchPageContent();
    }
  }, [pageId]);

  const fetchPageContent = async () => {
    setIsLoading(true);
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

        setContent(
          apiData[settingKey] || "<p>Halaman ini belum memiliki konten.</p>",
        );
      }
    } catch (e) {
      console.error(`Gagal memuat halaman ${pageTitle}:`, e);
      setContent("<p>Terjadi kesalahan saat memuat halaman.</p>");
    } finally {
      setIsLoading(false);
    }
  };

  if (!settingKey) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center font-lora">
        <h1 className="text-2xl font-bold mb-4">Halaman Tidak Ditemukan</h1>
        <Link to="/" className="text-chester-pink hover:underline">
          Kembali ke Beranda
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-[60vh] font-lora">
      {/* Breadcrumb */}
      <div className="bg-gray-50 border-b border-gray-100">
        <div className="container mx-auto px-4 py-4 flex items-center gap-2 text-xs text-gray-500">
          <Link to="/" className="hover:text-chester-pink transition">
            Beranda
          </Link>
          <ChevronRight size={14} />
          <span className="text-gray-900 font-bold">{pageTitle}</span>
        </div>
      </div>

      {/* Konten Utama */}
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-3xl font-bold text-chester-text mb-8">
          {pageTitle}
        </h1>

        {isLoading ? (
          <div className="flex flex-col gap-4 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
          </div>
        ) : (
          <div
            className="prose max-w-none text-gray-600 leading-loose
                       [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-4 [&_h1]:text-gray-900
                       [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mb-3 [&_h2]:mt-6 [&_h2]:text-gray-900
                       [&_h3]:text-lg [&_h3]:font-bold [&_h3]:mb-2 [&_h3]:mt-4
                       [&_p]:mb-4
                       [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-4
                       [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-4
                       [&_a]:text-chester-pink [&_a]:underline
                       [&_blockquote]:border-l-4 [&_blockquote]:border-chester-pink [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:bg-gray-50 [&_blockquote]:p-4 [&_blockquote]:rounded-r-lg"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        )}
      </div>
    </div>
  );
}
