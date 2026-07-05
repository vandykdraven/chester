import { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "react-router-dom";
import { Save, CheckCircle, AlertCircle, FileText } from "lucide-react";
import axios from "axios";

// PENGGUNAAN QUILL MURNI
import Quill from "quill";
import "quill/dist/quill.snow.css";
import { quillModules } from "../../utils/quillConfig";

export default function StaticPageEdit() {
  const { pageId } = useParams();
  const location = useLocation();

  const [content, setContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [customAlert, setCustomAlert] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const editorRef = useRef(null);
  const quillInstance = useRef(null);

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
  } else {
    pageTitle = "Halaman Tidak Dikenal";
  }

  // 1. PENGAMBILAN DATA DARI API
  useEffect(() => {
    if (!settingKey) return;

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

          setContent(apiData[settingKey] || "");
        }
      } catch (e) {
        console.error(`Gagal memuat halaman ${pageTitle}:`, e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPageContent();
  }, [pageId, settingKey]);

  // 2. INISIALISASI QUILL SECARA TERISOLASI
  useEffect(() => {
    if (isLoading || !editorRef.current) return;

    // Bersihkan HTML sebelum inisialisasi ulang
    editorRef.current.innerHTML = "";

    quillInstance.current = new Quill(editorRef.current, {
      theme: "snow",
      placeholder: `Mulai ketik isi ${pageTitle} di sini...`,
      modules: quillModules,
    });

    quillInstance.current.root.innerHTML = content;

    quillInstance.current.on("text-change", () => {
      setContent(quillInstance.current.root.innerHTML);
    });

    // Membersihkan instance saat komponen diunmount atau pageId berubah
    return () => {
      if (quillInstance.current) {
        quillInstance.current = null;
      }
    };
  }, [isLoading, pageId]); // Tambahkan pageId sebagai dependency

  const showAlert = (message, type = "success") => {
    setCustomAlert({ show: true, message, type });
    setTimeout(
      () => setCustomAlert({ show: false, message: "", type: "success" }),
      3000,
    );
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload = {
        [settingKey]: content,
      };

      const res = await axios.put(
        `${import.meta.env.VITE_API_URL}/settings`,
        payload,
      );
      if (res.data.success) {
        showAlert(`Halaman ${pageTitle} berhasil diperbarui!`, "success");
      }
    } catch (err) {
      showAlert("Gagal menyimpan perubahan halaman.", "error");
    }
    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-20">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-chester-pink border-t-transparent"></div>
      </div>
    );
  }

  if (!settingKey) {
    return (
      <div className="p-8 text-center text-red-500 font-bold">
        Halaman tidak ditemukan.
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-12 relative font-lora animate-fade-in">
      {customAlert.show && (
        <div className="fixed top-6 right-6 z-50 animate-bounce">
          <div
            className={`flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-xl border text-sm font-semibold text-white ${customAlert.type === "success" ? "bg-emerald-500 border-emerald-400" : "bg-rose-500 border-rose-400"}`}
          >
            {customAlert.type === "success" ? (
              <CheckCircle size={20} />
            ) : (
              <AlertCircle size={20} />
            )}
            <span>{customAlert.message}</span>
          </div>
        </div>
      )}

      <div className="mb-6 flex items-center gap-3">
        <div className="w-12 h-12 bg-pink-50 text-chester-pink rounded-xl flex items-center justify-center">
          <FileText size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-chester-text mb-1">
            Edit: {pageTitle}
          </h1>
          <p className="text-sm text-gray-500">
            Format tulisan Anda menggunakan tombol editor di bawah untuk
            tampilan halaman statis yang rapi.
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSave}
        className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-6"
      >
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-3">
            Isi Konten Halaman
          </label>
          <div className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-xs">
            <div
              ref={editorRef}
              className="min-h-[350px] font-lora bg-white"
            ></div>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-100 flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="bg-chester-pink text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg hover:bg-pink-600 transition w-full md:w-max justify-center cursor-pointer"
          >
            <Save size={20} /> {isSaving ? "Menyimpan..." : "Simpan Halaman"}
          </button>
        </div>
      </form>
    </div>
  );
}
