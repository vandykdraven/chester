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
// ENDPOINT: AMBIL SEMUA PRODUK (GET /api/products)
// =======================================================================
app.get("/api/products", async (req, res) => {
  try {
    // Query ini menggabungkan 3 tabel: Induk Produk, Foto Utama, dan Data Variasi (Harga & Stok)
    const [rows] = await db.query(`
      SELECT 
        p.id, 
        p.name, 
        p.category_id, 
        p.price, 
        p.stock, 
        p.status, 
        p.has_variant, 
        p.sku,
        p.created_at,
        pi.image_url AS primary_image,
        MIN(pv.price) AS min_v_price,
        MAX(pv.price) AS max_v_price,
        SUM(pv.stock) AS total_v_stock
      FROM products p
      LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = 1
      LEFT JOIN product_variants pv ON p.id = pv.product_id
      GROUP BY p.id, pi.image_url
      ORDER BY p.created_at DESC
    `);

    return res.status(200).json({
      success: true,
      message: "Berhasil mengambil daftar produk",
      data: rows,
    });
  } catch (error) {
    console.error("Gagal mengambil data produk:", error);
    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server saat mengambil data produk.",
    });
  }
});

// =======================================================================
// ENDPOINT: HAPUS PRODUK (REVISI: TANPA HAPUS FILE GAMBAR FISIK)
// =======================================================================
app.delete("/api/products/:id", async (req, res) => {
  const productId = req.params.id;

  try {
    // Menghapus produk dari database.
    // Berkat relasi ON DELETE CASCADE, data di tabel product_images, product_variants,
    // dan product_wholesales akan otomatis ikut terhapus dari MySQL.
    // *Catatan: File fisik gambar (JPG/PNG) di folder server TETAP AMAN untuk modul Galeri nanti.
    const [result] = await db.query("DELETE FROM products WHERE id = ?", [
      productId,
    ]);

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Produk tidak ditemukan!" });
    }

    return res.json({
      success: true,
      message:
        "Data produk berhasil dihapus, file gambar tetap tersimpan di Galeri Server!",
    });
  } catch (error) {
    console.error("Gagal menghapus produk:", error);
    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server saat menghapus produk.",
    });
  }
});

// =======================================================================
// ENDPOINT: AMBIL DETAIL 1 PRODUK UNTUK DI-EDIT (GET /api/products/:id)
// =======================================================================
app.get("/api/products/:id", async (req, res) => {
  const productId = req.params.id;
  try {
    const [products] = await db.query("SELECT * FROM products WHERE id = ?", [
      productId,
    ]);
    if (products.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Produk tidak ditemukan!" });
    }
    const product = products[0];

    const [images] = await db.query(
      "SELECT id, image_url, is_primary FROM product_images WHERE product_id = ?",
      [productId],
    );
    const [variants] = await db.query(
      "SELECT * FROM product_variants WHERE product_id = ?",
      [productId],
    );
    const [wholesales] = await db.query(
      "SELECT * FROM product_wholesales WHERE product_id = ?",
      [productId],
    );

    return res.status(200).json({
      success: true,
      data: { ...product, images, variants, wholesales },
    });
  } catch (error) {
    console.error("Gagal mengambil detail produk:", error);
    return res
      .status(500)
      .json({ success: false, message: "Terjadi kesalahan server." });
  }
});

// =======================================================================
// ENDPOINT: SIMPAN PERUBAHAN EDIT PRODUK + UPDATE GAMBAR (PUT /api/products/:id)
// =======================================================================
app.put(
  "/api/products/:id",
  upload.fields([
    { name: "primaryImage", maxCount: 1 },
    { name: "supportingImages", maxCount: 4 },
  ]),
  async (req, res) => {
    const productId = req.params.id;

    // Karena menggunakan multipart/form-data, data teks dibungkus di dalam req.body.data
    if (!req.body.data) {
      return res
        .status(400)
        .json({ success: false, message: "Data produk tidak ditemukan." });
    }

    const {
      name,
      category_id,
      size_guide_id,
      description,
      status,
      price,
      original_price,
      stock,
      weight,
      sku,
      has_variant,
      variantTypes,
      variantMatrix,
      wholesales,
      existingImages, // Daftar gambar lama yang TIDAK diubah oleh admin
    } = JSON.parse(req.body.data);

    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // 1. Update data induk produk
      await connection.query(
        `
      UPDATE products SET 
        name = ?, category_id = ?, size_guide_id = ?, description = ?, status = ?, 
        price = ?, original_price = ?, stock = ?, weight = ?, sku = ?, 
        has_variant = ?, variant_types_json = ?
      WHERE id = ?
    `,
        [
          name,
          category_id,
          size_guide_id || null,
          description,
          status,
          has_variant ? 0 : price,
          has_variant ? 0 : original_price,
          has_variant ? 0 : stock,
          has_variant ? 0 : weight,
          sku,
          has_variant ? 1 : 0,
          has_variant ? JSON.stringify(variantTypes) : null,
          productId,
        ],
      );

      // 2. Update data Grosir (Hapus yang lama, ganti baru)
      await connection.query(
        "DELETE FROM product_wholesales WHERE product_id = ?",
        [productId],
      );
      if (wholesales && wholesales.length > 0) {
        for (const ws of wholesales) {
          if (ws.minQty && ws.price) {
            await connection.query(
              "INSERT INTO product_wholesales (product_id, min_qty, wholesale_price) VALUES (?, ?, ?)",
              [productId, ws.minQty, ws.price],
            );
          }
        }
      }

      // 3. Update data Variasi (Hapus yang lama, ganti baru)
      await connection.query(
        "DELETE FROM product_variants WHERE product_id = ?",
        [productId],
      );
      if (has_variant && variantMatrix && variantMatrix.length > 0) {
        for (const row of variantMatrix) {
          await connection.query(
            `
          INSERT INTO product_variants 
            (product_id, variant_key, price, original_price, stock, weight, sku) 
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
            [
              productId,
              row.key || row.variant_key || row.combination?.join("-"),
              row.price,
              row.original_price,
              row.stock,
              row.weight,
              row.sku,
            ],
          );
        }
      }

      // 4. LOGIKA PEMROSESAN GAMBAR (EDIT FOTO LIVE)
      // Ambil semua data relasi gambar yang lama di DB sebelum kita rombak
      const [oldDbImages] = await connection.query(
        "SELECT * FROM product_images WHERE product_id = ?",
        [productId],
      );

      // Hapus semua relasi gambar lama milik produk ini di DB (File fisik di server aman sesuai konsep Galeri)
      await connection.query(
        "DELETE FROM product_images WHERE product_id = ?",
        [productId],
      );

      // --- A. Proses Foto Utama ---
      if (req.files && req.files["primaryImage"]) {
        // Jika admin mengunggah FOTO UTAMA BARU dari PC
        const primaryFile = req.files["primaryImage"][0];
        const primaryUrl = `/uploads/products/${primaryFile.filename}`;
        await connection.query(
          "INSERT INTO product_images (product_id, image_url, is_primary) VALUES (?, ?, 1)",
          [productId, primaryUrl],
        );
      } else if (existingImages && existingImages[0]) {
        // Jika admin TIDAK mengubah foto utama, pertahankan gambar lama
        await connection.query(
          "INSERT INTO product_images (product_id, image_url, is_primary) VALUES (?, ?, 1)",
          [productId, existingImages[0].image_url],
        );
      }

      // --- B. Proses Foto Pendukung (Indeks 1 sampai 4) ---
      // Kita looping slot foto pendukung
      let newSupportingFileIndex = 0;
      for (let i = 1; i <= 4; i++) {
        // Cek apakah ada file baru yang diupload untuk slot pendukung ini
        // Multer mengelompokkan semua file pendukung dalam satu array 'supportingImages'
        const hasNewFile =
          req.files &&
          req.files["supportingImages"] &&
          req.files["supportingImages"][newSupportingFileIndex];

        if (hasNewFile) {
          const file = req.files["supportingImages"][newSupportingFileIndex];
          const url = `/uploads/products/${file.filename}`;
          await connection.query(
            "INSERT INTO product_images (product_id, image_url, is_primary) VALUES (?, ?, 0)",
            [productId, url],
          );
          newSupportingFileIndex++;
        } else if (existingImages && existingImages[i]) {
          // Jika slot ini tidak diisi file baru, tapi di data awal ada gambar lamanya dan tidak dihapus
          await connection.query(
            "INSERT INTO product_images (product_id, image_url, is_primary) VALUES (?, ?, 0)",
            [productId, existingImages[i].image_url],
          );
        }
      }

      await connection.commit();
      return res.json({
        success: true,
        message: "Produk dan media foto berhasil diperbarui!",
      });
    } catch (error) {
      await connection.rollback();
      console.error("Gagal mengupdate produk:", error);
      return res.status(500).json({
        success: false,
        message: "Gagal memperbarui data pada server.",
      });
    } finally {
      connection.release();
    }
  },
);

// =======================================================================
// ENDPOINT GALERI: AMBIL SEMUA MEDIA (GET /api/gallery)
// =======================================================================
app.get("/api/gallery", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM gallery_media ORDER BY created_at DESC",
    );
    return res.status(200).json({
      success: true,
      message: "Daftar galeri berhasil dimuat",
      data: rows,
    });
  } catch (error) {
    console.error("Gagal mengambil data galeri:", error);
    return res
      .status(500)
      .json({ success: false, message: "Terjadi kesalahan server." });
  }
});

// =======================================================================
// ENDPOINT GALERI: UPLOAD GAMBAR BARU KE GALERI (POST /api/gallery/upload)
// =======================================================================
// Kita gunakan middleware upload.single('galleryFile') bawaan multer yang sudah dikonfigurasi di atas
app.post(
  "/api/gallery/upload",
  upload.single("galleryFile"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res
          .status(400)
          .json({ success: false, message: "Tidak ada file yang diunggah." });
      }

      const filePath = `/uploads/products/${req.file.filename}`;
      const filename = req.file.originalname;
      const fileSize = req.file.size;

      // Simpan catatan manifest file ke database gallery_media
      const [result] = await db.query(
        "INSERT INTO gallery_media (filename, file_path, file_size) VALUES (?, ?, ?)",
        [filename, filePath, fileSize],
      );

      return res.status(201).json({
        success: true,
        message: "Gambar berhasil ditambahkan ke galeri server!",
        data: {
          id: result.insertId,
          filename,
          file_path: filePath,
          file_size: fileSize,
        },
      });
    } catch (error) {
      console.error("Gagal mengunggah ke galeri:", error);
      return res
        .status(500)
        .json({ success: false, message: "Gagal memproses unggahan gambar." });
    }
  },
);

// =======================================================================
// ENDPOINT GALERI: HAPUS GAMBAR PERMANEN DARI GALERI (DELETE /api/gallery/:id)
// =======================================================================
app.delete("/api/gallery/:id", async (req, res) => {
  const mediaId = req.params.id;
  try {
    // 1. Cari nama file fisiknya dulu
    const [rows] = await db.query(
      "SELECT file_path FROM gallery_media WHERE id = ?",
      [mediaId],
    );
    if (rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Media tidak ditemukan." });
    }

    const media = rows[0];

    // 2. Hapus data dari database
    await db.query("DELETE FROM gallery_media WHERE id = ?", [mediaId]);

    // 3. Hapus file fisik dari penyimpanan komputer server
    const filePath = path.join(__dirname, media.file_path);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    return res.json({
      success: true,
      message: "Gambar berhasil dihapus permanen dari server!",
    });
  } catch (error) {
    console.error("Gagal menghapus media galeri:", error);
    return res
      .status(500)
      .json({
        success: false,
        message: "Terjadi kesalahan server saat menghapus gambar.",
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
