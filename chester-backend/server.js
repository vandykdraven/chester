const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Koneksi Database
let db;
async function connectDB() {
  try {
    db = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });
    console.log('✔ Terhubung ke Database phpMyAdmin (MySQL)');
    
    // Otomatis buat tabel admin jika belum ada
    await initDatabase();
  } catch (error) {
    console.error('❌ Gagal terhubung ke Database:', error.message);
    process.exit(1);
  }
}

// Fungsi Inisialisasi Tabel & Akun Admin Default
async function initDatabase() {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS \`admins\` (
      \`id\` INT AUTO_INCREMENT PRIMARY KEY,
      \`fullname\` VARCHAR(100) NOT NULL,
      \`email\` VARCHAR(100) NOT NULL UNIQUE,
      \`password\` VARCHAR(255) NOT NULL,
      \`role\` ENUM('Superadmin', 'Editor') DEFAULT 'Superadmin',
      \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  await db.query(createTableQuery);

  // Cek apakah sudah ada admin di database
  const [rows] = await db.query('SELECT * FROM admins WHERE email = ?', ['admin@chester.com']);
  if (rows.length === 0) {
    // Jika belum ada, buat admin default dengan password aman (di-hash)
    const hashedPassword = await bcrypt.hash('password123', 10);
    await db.query(
      'INSERT INTO admins (fullname, email, password, role) VALUES (?, ?, ?, ?)',
      ['Administrator Chester', 'admin@chester.com', hashedPassword, 'Superadmin']
    );
    console.log('🎁 Akun Admin Default berhasil dibuat: admin@chester.com | password123');
  }
}

// ==========================================
// ENDPOINT API: LOGIN ADMINISTRATOR (SECURE)
// ==========================================
app.post('/api/admin/login', async (req, res) => {
  const { email, password } = req.body;

  // 1. Validasi Input Kosong
  if (!email || !password) {
    return res.status(400).json({ message: 'Email dan kata sandi wajib diisi!' });
  }

  try {
    // 2. Cari admin berdasarkan email
    const [rows] = await db.query('SELECT * FROM admins WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.status(401).json({ message: 'Email atau kata sandi salah!' });
    }

    const admin = rows[0];

    // 3. Verifikasi Kata Sandi menggunakan Bcrypt (Membandingkan input dengan hash di DB)
    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Email atau kata sandi salah!' });
    }

    // 4. Generate Token Keamanan (JWT Token) berlaku selama 1 hari
    const token = jwt.sign(
      { id: admin.id, email: admin.email, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    // 5. Kirim data sukses ke Frontend
    res.json({
      message: 'Login Berhasil!',
      token: token,
      admin: {
        id: admin.id,
        fullname: admin.fullname,
        email: admin.email,
        role: admin.role
      }
    });

  } catch (error) {
    console.error('Error saat login:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server backend!' });
  }
});

// Jalankan Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server Backend berjalan di http://localhost:${PORT}`);
  connectDB();
});