/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        "chester-pink": "#ed8899",
        "chester-gray": "#f5f5f5",
        "chester-text": "#333333",
      },
      fontFamily: {
        // Hapus lora, ganti dengan geova
        // Kita beri fallback 'sans-serif' jika geova gagal dimuat
        geova: ["Geova", "sans-serif"],
      },
    },
  },
  plugins: [],
};