// config/biteship.js
const axios = require("axios");

// Aturan Ketat: Tidak ada hardcode URL statis. Semua diambil dari .env
const biteshipApi = axios.create({
  baseURL: process.env.BITESHIP_BASE_URL,
  headers: {
    Authorization: process.env.BITESHIP_API_KEY,
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

module.exports = biteshipApi;
