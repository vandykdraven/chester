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
        lora: ["Lora", "serif"],
      },
    },
  },
  plugins: [],
};
