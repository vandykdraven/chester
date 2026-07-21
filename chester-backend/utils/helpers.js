// File: utils/helpers.js

/**
 * Fungsi untuk menyensor kata-kata kotor dalam teks.
 * @param {string} text - Komentar asli dari pengguna.
 * @param {string} badWordsString - Daftar kata kotor dari database (dipisahkan koma).
 * @returns {string} - Teks yang sudah disensor dengan '***'.
 */
const filterProfanity = (text, badWordsString) => {
  if (!text || !badWordsString) return text;

  // Memecah string menjadi array dan menghilangkan spasi kosong
  const badWordsList = badWordsString
    .split(",")
    .map((word) => word.trim().toLowerCase());
  let filteredText = text;

  // Melakukan pencarian dan penggantian setiap kata kotor
  badWordsList.forEach((word) => {
    if (word) {
      // RegExp \b memastikan hanya kata yang sama persis yang disensor
      // 'gi' berarti pencarian mengabaikan huruf besar/kecil (case-insensitive)
      const regex = new RegExp(`\\b${word}\\b`, "gi");
      filteredText = filteredText.replace(regex, "***");
    }
  });

  return filteredText;
};

module.exports = { filterProfanity };
