const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// Mengizinkan browser mengakses folder 'uploads' secara langsung untuk pratinjau gambar
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Konfigurasi Koneksi Database MySQL
const db = mysql
  .createPool({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_DATABASE || "chester",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  })
  .promise();

// =======================================================================
// CONFIGURATION MULTER (UNGGAH GAMBAR PRODUK)
// =======================================================================
// Memastikan folder 'uploads/products' tersedia di server
const uploadDir = "./uploads/products";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Menamai file: produk-timestamp-acak.ekstensi
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname),
    );
  },
});

// Filter jenis file (Hanya mengizinkan gambar)
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Hanya file gambar yang diizinkan!"), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 7 * 1024 * 1024 }, // Maksimal 7MB per file
});

// Menyiapkan slot unggahan gambar: 1 Gambar Utama (primaryImage), 4 Gambar Pendukung (supportingImages)
const cpUpload = upload.fields([
  { name: "primaryImage", maxCount: 1 },
  { name: "supportingImages", maxCount: 4 },
]);

// =======================================================================
// ENDPOINT: TAMBAH PRODUK BARU (POST /api/products)
// =======================================================================
app.post("/api/products", cpUpload, async (req, res) => {
  // Karena data teks dikirim bersamaan dengan file (multipart/form-data),
  // kita harus mem-parsing string JSON dari req.body
  try {
    const productData = JSON.parse(req.body.data);

    const {
      name,
      category,
      description,
      price,
      original_price,
      stock,
      weight,
      sku,
      status,
      hasVariant,
      variantTypes,
      variantMatrix,
      wholesales,
      seo_title,
      seo_description,
      seo_keywords,
    } = productData;

    if (!name) {
      return res
        .status(400)
        .json({ success: false, message: "Nama produk wajib diisi!" });
    }

    // --- PROSES TRANSAKSI DATABASE ---
    // Menggunakan Transaction agar jika salah satu tabel gagal disimpan, seluruh data dibatalkan otomatis (keamanan data)
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // 1. Simpan Data Induk Produk ke tabel `products`
      const [productResult] = await connection.query(
        `INSERT INTO products (
          name, category_id, description, status, price, original_price, 
          stock, weight, sku, has_variant, variant_types_json, 
          seo_title, seo_description, seo_keywords
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ? )`,
        [
          name,
          category || null,
          description || null,
          status || "available",
          hasVariant ? 0 : price || 0,
          hasVariant ? 0 : original_price || 0,
          hasVariant ? 0 : stock || 0,
          hasVariant ? 0 : weight || 0,
          hasVariant ? null : sku || null,
          hasVariant ? 1 : 0,
          hasVariant ? JSON.stringify(variantTypes) : null,
          seo_title || null,
          seo_description || null,
          seo_keywords || null,
        ],
      );

      const productId = productResult.insertId;

      // 2. Simpan Data Gambar ke tabel `product_images`
      // Ambil file Gambar Utama jika diunggah
      if (req.files["primaryImage"]) {
        const primaryFile = req.files["primaryImage"][0];
        const primaryUrl = `/uploads/products/${primaryFile.filename}`;
        await connection.query(
          `INSERT INTO product_images (product_id, image_url, is_primary) VALUES (?, ?, 1)`,
          [productId, primaryUrl],
        );
      }

      // Ambil berkas Gambar Pendukung jika diunggah
      if (req.files["supportingImages"]) {
        for (const file of req.files["supportingImages"]) {
          const supportingUrl = `/uploads/products/${file.filename}`;
          await connection.query(
            `INSERT INTO product_images (product_id, image_url, is_primary) VALUES (?, ?, 0)`,
            [productId, supportingUrl],
          );
        }
      }

      // 3. Simpan Data Variasi (Jika hasVariant aktif) ke tabel `product_variants`
      if (hasVariant && variantMatrix && variantMatrix.length > 0) {
        for (const variant of variantMatrix) {
          await connection.query(
            `INSERT INTO product_variants (product_id, variant_key, price, original_price, stock, weight, sku) 
             VALUES (?, ?, ?, ?, ?, ?, ? )`,
            [
              productId,
              variant.key, // Contoh: "M-Merah"
              variant.price || 0,
              variant.original_price || 0,
              variant.stock || 0,
              variant.weight || 0,
              variant.sku || null,
            ],
          );
        }
      }

      // 4. Simpan Data Harga Grosir ke tabel `product_wholesales`
      if (wholesales && wholesales.length > 0) {
        for (const ws of wholesales) {
          if (ws.minQty && ws.price) {
            await connection.query(
              `INSERT INTO product_wholesales (product_id, min_qty, wholesale_price) VALUES (?, ?, ? )`,
              [productId, ws.minQty, ws.price],
            );
          }
        }
      }

      // Jika seluruh baris eksekusi SQL di atas berhasil tanpa error, kunci data secara permanen!
      await connection.commit();
      connection.release();

      return res.status(201).json({
        success: true,
        message: "Produk tingkat mahir berhasil disimpan ke database!",
        productId: productId,
      });
    } catch (dbError) {
      // Jika terjadi kegagalan di tengah jalan, batalkan semua simpanan SQL di atas (Rollback)
      await connection.rollback();
      connection.release();
      throw dbError;
    }
  } catch (error) {
    console.error("Error pada server saat menyimpan produk:", error);
    return res.status(500).json({
      success: false,
      message: "Gagal menyimpan produk ke server internal.",
      error: error.message,
    });
  }
});

// =======================================================================
// ROUTE AUTHENTICATION YANG SUDAH ADA SEBELUMNYA
// =======================================================================
app.post("/api/admin/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const [rows] = await db.query("SELECT * FROM admins WHERE email = ?", [
      email,
    ]);
    if (rows.length === 0) {
      return res
        .status(401)
        .json({ success: false, message: "Email tidak terdaftar!" });
    }
    const admin = rows[0];
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Kata sandi salah!" });
    }
    const token = jwt.sign(
      { id: admin.id, role: admin.role },
      process.env.JWT_SECRET || "chester_secret_key_123",
      { expiresIn: "1d" },
    );
    res.json({
      success: true,
      message: "Login Berhasil!",
      token,
      admin: {
        id: admin.id,
        fullname: admin.fullname,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

// Menyalakan Mesin Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server Backend berjalan di http://localhost:${PORT}`);
});
