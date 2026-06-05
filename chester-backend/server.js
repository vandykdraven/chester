const express = require("express");
const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

let db;
async function connectDB() {
  try {
    db = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });
    console.log("✔ Terhubung ke Database phpMyAdmin (MySQL)");

    // Panggil fungsi seed admin setelah koneksi berhasil
    await seedDefaultAdmin();
  } catch (error) {
    console.error("❌ Gagal terhubung ke Database:", error.message);
    process.exit(1);
  }
}

// Fungsi ini HANYA menyisipkan data admin default JIKA tabelnya sudah ada (dibuat via migrasi)
async function seedDefaultAdmin() {
  try {
    const [rows] = await db.query("SELECT * FROM admins WHERE email = ?", [
      "admin@chester.com",
    ]);
    if (rows.length === 0) {
      const hashedPassword = await bcrypt.hash("password123", 10);
      await db.query(
        "INSERT INTO admins (fullname, email, password, role) VALUES (?, ?, ?, ?)",
        [
          "Administrator Chester",
          "admin@chester.com",
          hashedPassword,
          "Superadmin",
        ],
      );
      console.log(
        "🎁 Akun Admin Default berhasil dibuat: admin@chester.com | password123",
      );
    }
  } catch (error) {
    // Akan muncul peringatan ini jika Anda belum menjalankan perintah "npx db-migrate up"
    console.log("⏳ Menunggu migrasi tabel dijalankan...");
  }
}

// API Login Admin
app.post("/api/admin/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ message: "Email dan kata sandi wajib diisi!" });
  }

  try {
    const [rows] = await db.query("SELECT * FROM admins WHERE email = ?", [
      email,
    ]);
    if (rows.length === 0) {
      return res.status(401).json({ message: "Email atau kata sandi salah!" });
    }

    const admin = rows[0];
    const isPasswordValid = await bcrypt.compare(password, admin.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Email atau kata sandi salah!" });
    }

    const token = jwt.sign(
      { id: admin.id, email: admin.email, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" },
    );

    res.json({
      message: "Login Berhasil!",
      token: token,
      admin: {
        id: admin.id,
        fullname: admin.fullname,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error("Error saat login:", error);
    res.status(500).json({ message: "Terjadi kesalahan pada server backend!" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server Backend berjalan di http://localhost:${PORT}`);
  connectDB();
});
