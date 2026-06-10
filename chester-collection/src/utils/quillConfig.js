// Konfigurasi Toolbar global untuk semua Editor di aplikasi
export const quillModules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["blockquote", "code-block"],
    [{ align: [] }],
    [{ color: [] }, { background: [] }],
    ["link", "image", "video", "clean"],
    // Silakan tambahkan atau kurangi susunan ini sesuai seleramu tadi
  ],
};
