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
// ENDPOINT: TAMBAH PRODUK BARU + DUAL MEDIA SOURCE (POST /api/products)
// =======================================================================
app.post("/api/products", cpUpload, async (req, res) => {
  try {
    const productData = JSON.parse(req.body.data);

    const {
      name,
      category,
      size_guide_id, // Kolom panduan ukuran baru
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
      imagesConfig, // Menerima konfigurasi sumber media tiap slot [slot0, slot1, slot2, slot3, slot4]
    } = productData;

    if (!name) {
      return res
        .status(400)
        .json({ success: false, message: "Nama produk wajib diisi!" });
    }

    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // 1. Simpan Data Induk Produk ke tabel `products` (Termasuk size_guide_id)
      const [productResult] = await connection.query(
        `INSERT INTO products (
          name, category_id, size_guide_id, description, status, price, original_price, 
          stock, weight, sku, has_variant, variant_types_json, 
          seo_title, seo_description, seo_keywords
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ? )`,
        [
          name,
          category || null,
          size_guide_id || null, // Disimpan ke MySQL
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

      // 2. LOGIKA BARU: PROSES PEMILIHAN GAMBAR CAMPURAN (PC / SERVER)
      const imgCfg = imagesConfig || [];

      // --- A. Proses Slot 0 (Foto Utama) ---
      if (imgCfg[0]) {
        if (imgCfg[0].type === "pc" && req.files["primaryImage"]) {
          const primaryFile = req.files["primaryImage"][0];
          const primaryUrl = `/uploads/products/${primaryFile.filename}`;
          await connection.query(
            `INSERT INTO product_images (product_id, image_url, is_primary) VALUES (?, ?, 1)`,
            [productId, primaryUrl],
          );
        } else if (imgCfg[0].type === "server" && imgCfg[0].path) {
          await connection.query(
            `INSERT INTO product_images (product_id, image_url, is_primary) VALUES (?, ?, 1)`,
            [productId, imgCfg[0].path],
          );
        }
      }

      // --- B. Proses Slot 1-4 (Foto Pendukung) ---
      let pcUploadIndex = 0;
      for (let i = 1; i <= 4; i++) {
        const slotConfig = imgCfg[i];
        if (slotConfig) {
          if (
            slotConfig.type === "pc" &&
            req.files["supportingImages"] &&
            req.files["supportingImages"][pcUploadIndex]
          ) {
            const file = req.files["supportingImages"][pcUploadIndex];
            const supportingUrl = `/uploads/products/${file.filename}`;
            await connection.query(
              `INSERT INTO product_images (product_id, image_url, is_primary) VALUES (?, ?, 0)`,
              [productId, supportingUrl],
            );
            pcUploadIndex++;
          } else if (slotConfig.type === "server" && slotConfig.path) {
            await connection.query(
              `INSERT INTO product_images (product_id, image_url, is_primary) VALUES (?, ?, 0)`,
              [productId, slotConfig.path],
            );
          }
        }
      }

      // 3. Simpan Data Variasi ke tabel `product_variants`
      if (hasVariant && variantMatrix && variantMatrix.length > 0) {
        for (const variant of variantMatrix) {
          await connection.query(
            `INSERT INTO product_variants (product_id, variant_key, price, original_price, stock, weight, sku) 
             VALUES (?, ?, ?, ?, ?, ?, ? )`,
            [
              productId,
              variant.key,
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

      await connection.commit();
      connection.release();

      return res.status(201).json({
        success: true,
        message: "Produk tingkat mahir berhasil disimpan ke database!",
        productId: productId,
      });
    } catch (dbError) {
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
// ENDPOINT: AMBUL SEMUA PRODUK (GET /api/products)
// =======================================================================
app.get("/api/products", async (req, res) => {
  try {
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
// ENDPOINT: SIMPAN PERUBAHAN EDIT PRODUK + DUAL MEDIA (PUT /api/products/:id)
// =======================================================================
app.put(
  "/api/products/:id",
  upload.fields([
    { name: "primaryImage", maxCount: 1 },
    { name: "supportingImages", maxCount: 4 },
  ]),
  async (req, res) => {
    const productId = req.params.id;

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
      seo_title,
      seo_description,
      seo_keywords,
      imagesConfig, // Menerima susunan gambar baru (PC, Server, atau format lama)
    } = JSON.parse(req.body.data);

    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // 1. Update data induk produk
      await connection.query(
        `UPDATE products SET 
          name = ?, category_id = ?, size_guide_id = ?, description = ?, status = ?, 
          price = ?, original_price = ?, stock = ?, weight = ?, sku = ?, 
          has_variant = ?, variant_types_json = ?, seo_title = ?, seo_description = ?, seo_keywords = ?
        WHERE id = ?`,
        [
          name,
          category_id || null,
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
          seo_title || null,
          seo_description || null,
          seo_keywords || null,
          productId,
        ],
      );

      // 2. Update data Grosir
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

      // 3. Update data Variasi
      await connection.query(
        "DELETE FROM product_variants WHERE product_id = ?",
        [productId],
      );
      if (has_variant && variantMatrix && variantMatrix.length > 0) {
        for (const row of variantMatrix) {
          await connection.query(
            `INSERT INTO product_variants (product_id, variant_key, price, original_price, stock, weight, sku) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
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

      // 4. LOGIKA PEMROSESAN GAMBAR (DUAL-PATH & PERTAHANKAN GAMBAR LAMA)
      await connection.query(
        "DELETE FROM product_images WHERE product_id = ?",
        [productId],
      );

      const imgCfg = imagesConfig || [];

      // --- A. Proses Foto Utama (Slot 0) ---
      if (imgCfg[0]) {
        if (imgCfg[0].type === "pc" && req.files["primaryImage"]) {
          const primaryUrl = `/uploads/products/${req.files["primaryImage"][0].filename}`;
          await connection.query(
            "INSERT INTO product_images (product_id, image_url, is_primary) VALUES (?, ?, 1)",
            [productId, primaryUrl],
          );
        } else if (
          (imgCfg[0].type === "server" || imgCfg[0].type === "existing") &&
          imgCfg[0].path
        ) {
          await connection.query(
            "INSERT INTO product_images (product_id, image_url, is_primary) VALUES (?, ?, 1)",
            [productId, imgCfg[0].path],
          );
        }
      }

      // --- B. Proses Foto Pendukung (Slot 1-4) ---
      let pcUploadIndex = 0;
      for (let i = 1; i <= 4; i++) {
        const slotConfig = imgCfg[i];
        if (slotConfig) {
          if (
            slotConfig.type === "pc" &&
            req.files["supportingImages"] &&
            req.files["supportingImages"][pcUploadIndex]
          ) {
            const supportingUrl = `/uploads/products/${req.files["supportingImages"][pcUploadIndex].filename}`;
            await connection.query(
              "INSERT INTO product_images (product_id, image_url, is_primary) VALUES (?, ?, 0)",
              [productId, supportingUrl],
            );
            pcUploadIndex++;
          } else if (
            (slotConfig.type === "server" || slotConfig.type === "existing") &&
            slotConfig.path
          ) {
            await connection.query(
              "INSERT INTO product_images (product_id, image_url, is_primary) VALUES (?, ?, 0)",
              [productId, slotConfig.path],
            );
          }
        }
      }

      await connection.commit();
      return res.json({
        success: true,
        message: "Produk dan media berhasil diperbarui!",
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
// ENDPOINT GALERI: UPLOAD GAMBAR BARU KE GALERI (POST /api/gallery/upload)
// =======================================================================
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
// ENDPOINT GALERI: AMBIL MEDIA DENGAN PAGING & PENCARIAN (GET /api/gallery)
// =======================================================================
app.get("/api/gallery", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;
    const search = req.query.search || "";
    const offset = (page - 1) * limit;

    let queryCount = "SELECT COUNT(*) as total FROM gallery_media";
    let queryData = "SELECT * FROM gallery_media";
    const queryParams = [];

    if (search) {
      const searchPattern = `%${search}%`;
      queryCount += " WHERE filename LIKE ?";
      queryData += " WHERE filename LIKE ?";
      queryParams.push(searchPattern);
    }

    queryData += " ORDER BY created_at DESC LIMIT ? OFFSET ?";

    const [countResult] = await db.query(
      queryCount,
      search ? [queryParams[0]] : [],
    );
    const totalItems = countResult[0].total;
    const totalPages = Math.ceil(totalItems / limit);

    queryParams.push(limit, offset);
    const [rows] = await db.query(queryData, queryParams);

    return res.status(200).json({
      success: true,
      message: "Daftar galeri berhasil dimuat",
      data: rows,
      pagination: {
        totalItems,
        totalPages,
        currentPage: page,
        limit,
      },
    });
  } catch (error) {
    console.error("Gagal mengambil data galeri:", error);
    return res
      .status(500)
      .json({ success: false, message: "Terjadi kesalahan server." });
  }
});

// =======================================================================
// ENDPOINT GALERI: HAPUS MEDIA PERMANEN DARI GALERI
// =======================================================================
app.delete("/api/gallery/:id", async (req, res) => {
  const mediaId = req.params.id;
  try {
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
    await db.query("DELETE FROM gallery_media WHERE id = ?", [mediaId]);

    const filePath = path.join(__dirname, media.file_path);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    return res.json({
      success: true,
      message: "Gambar berhasil dihapus dari server!",
    });
  } catch (error) {
    console.error("Gagal menghapus media galeri:", error);
    return res
      .status(500)
      .json({ success: false, message: "Terjadi kesalahan server." });
  }
});

// =======================================================================
// ENDPOINT PANDUAN UKURAN (SIZE GUIDES)
// =======================================================================

// 1. Ambil semua daftar panduan ukuran (GET)
app.get("/api/size-guides", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM size_guides ORDER BY created_at DESC",
    );
    return res.status(200).json({ success: true, data: rows });
  } catch (error) {
    console.error("Gagal mengambil panduan ukuran:", error);
    return res
      .status(500)
      .json({ success: false, message: "Terjadi kesalahan server." });
  }
});

// 2. Tambah panduan ukuran baru (POST)
app.post("/api/size-guides", async (req, res) => {
  const { name, content, image_url } = req.body;

  if (!name) {
    return res
      .status(400)
      .json({ success: false, message: "Nama panduan wajib diisi!" });
  }

  try {
    await db.query(
      "INSERT INTO size_guides (name, content, image_url) VALUES (?, ?, ?)",
      [name, content || null, image_url || null],
    );
    return res
      .status(201)
      .json({ success: true, message: "Panduan ukuran berhasil ditambahkan!" });
  } catch (error) {
    console.error("Gagal menyimpan panduan ukuran:", error);
    return res
      .status(500)
      .json({ success: false, message: "Gagal menyimpan ke database." });
  }
});

// 3. Ambil detail 1 panduan ukuran untuk diedit (GET)
app.get("/api/size-guides/:id", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM size_guides WHERE id = ?", [
      req.params.id,
    ]);
    if (rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Data tidak ditemukan!" });
    }
    return res.status(200).json({ success: true, data: rows[0] });
  } catch (error) {
    console.error("Gagal mengambil detail panduan:", error);
    return res
      .status(500)
      .json({ success: false, message: "Terjadi kesalahan server." });
  }
});

// 4. Simpan perubahan edit panduan ukuran (PUT)
app.put("/api/size-guides/:id", async (req, res) => {
  const { name, content, image_url } = req.body;

  if (!name) {
    return res
      .status(400)
      .json({ success: false, message: "Nama panduan wajib diisi!" });
  }

  try {
    await db.query(
      "UPDATE size_guides SET name = ?, content = ?, image_url = ? WHERE id = ?",
      [name, content || null, image_url || null, req.params.id],
    );
    return res
      .status(200)
      .json({ success: true, message: "Panduan ukuran berhasil diperbarui!" });
  } catch (error) {
    console.error("Gagal mengupdate panduan ukuran:", error);
    return res
      .status(500)
      .json({ success: false, message: "Gagal memperbarui data." });
  }
});

// 5. Hapus panduan ukuran permanen (DELETE)
app.delete("/api/size-guides/:id", async (req, res) => {
  try {
    // Berkat relasi ON DELETE SET NULL yang kita buat di MySQL,
    // jika panduan ini dihapus, produk yang memakainya tidak akan error (hanya menjadi NULL)
    await db.query("DELETE FROM size_guides WHERE id = ?", [req.params.id]);
    return res
      .status(200)
      .json({ success: true, message: "Panduan ukuran berhasil dihapus!" });
  } catch (error) {
    console.error("Gagal menghapus panduan ukuran:", error);
    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server saat menghapus.",
    });
  }
});

// =======================================================================
// ENDPOINT: KATEGORI PRODUK (PRODUCT CATEGORIES)
// =======================================================================

// 1. Ambil Semua Kategori
app.get("/api/categories", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM product_categories ORDER BY created_at DESC",
    );
    return res.status(200).json({ success: true, data: rows });
  } catch (error) {
    console.error("Gagal mengambil kategori:", error);
    return res
      .status(500)
      .json({ success: false, message: "Terjadi kesalahan server." });
  }
});

// 2. Tambah Kategori Baru
app.post("/api/categories", async (req, res) => {
  const { name, description } = req.body;
  if (!name)
    return res
      .status(400)
      .json({ success: false, message: "Nama kategori wajib diisi!" });

  // Membuat slug otomatis (contoh: "Kemeja Pria" -> "kemeja-pria")
  const slug = name
    .toLowerCase()
    .replace(/ /g, "-")
    .replace(/[^\w-]+/g, "");

  try {
    await db.query(
      "INSERT INTO product_categories (name, slug, description) VALUES (?, ?, ?)",
      [name, slug, description || null],
    );
    return res
      .status(201)
      .json({ success: true, message: "Kategori berhasil ditambahkan!" });
  } catch (error) {
    console.error("Gagal menyimpan kategori:", error);
    return res
      .status(500)
      .json({ success: false, message: "Gagal menyimpan ke database." });
  }
});

// 3. Edit Kategori
app.put("/api/categories/:id", async (req, res) => {
  const { name, description } = req.body;
  if (!name)
    return res
      .status(400)
      .json({ success: false, message: "Nama kategori wajib diisi!" });

  const slug = name
    .toLowerCase()
    .replace(/ /g, "-")
    .replace(/[^\w-]+/g, "");

  try {
    await db.query(
      "UPDATE product_categories SET name = ?, slug = ?, description = ? WHERE id = ?",
      [name, slug, description || null, req.params.id],
    );
    return res
      .status(200)
      .json({ success: true, message: "Kategori berhasil diperbarui!" });
  } catch (error) {
    console.error("Gagal mengupdate kategori:", error);
    return res
      .status(500)
      .json({ success: false, message: "Gagal memperbarui data." });
  }
});

// 4. Hapus Kategori
app.delete("/api/categories/:id", async (req, res) => {
  try {
    await db.query("DELETE FROM product_categories WHERE id = ?", [
      req.params.id,
    ]);
    return res
      .status(200)
      .json({ success: true, message: "Kategori berhasil dihapus!" });
  } catch (error) {
    console.error("Gagal menghapus kategori:", error);
    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server saat menghapus.",
    });
  }
});

// =======================================================================
// ENDPOINT: TAG & LABEL PRODUK (PRODUCT TAGS)
// =======================================================================

// 1. Ambil Semua Tag
app.get("/api/tags", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM product_tags ORDER BY created_at DESC",
    );
    return res.status(200).json({ success: true, data: rows });
  } catch (error) {
    console.error("Gagal mengambil tag:", error);
    return res
      .status(500)
      .json({ success: false, message: "Terjadi kesalahan server." });
  }
});

// 2. Tambah Tag Baru
app.post("/api/tags", async (req, res) => {
  const { name } = req.body;
  if (!name)
    return res
      .status(400)
      .json({ success: false, message: "Nama tag wajib diisi!" });

  try {
    await db.query("INSERT INTO product_tags (name) VALUES (?)", [name]);
    return res
      .status(201)
      .json({ success: true, message: "Tag berhasil ditambahkan!" });
  } catch (error) {
    // Tangkap error jika nama tag duplikat (UNIQUE constraint)
    if (error.code === "ER_DUP_ENTRY") {
      return res
        .status(400)
        .json({ success: false, message: "Tag ini sudah ada di database!" });
    }
    console.error("Gagal menyimpan tag:", error);
    return res
      .status(500)
      .json({ success: false, message: "Gagal menyimpan ke database." });
  }
});

// 3. Edit Tag
app.put("/api/tags/:id", async (req, res) => {
  const { name } = req.body;
  if (!name)
    return res
      .status(400)
      .json({ success: false, message: "Nama tag wajib diisi!" });

  try {
    await db.query("UPDATE product_tags SET name = ? WHERE id = ?", [
      name,
      req.params.id,
    ]);
    return res
      .status(200)
      .json({ success: true, message: "Tag berhasil diperbarui!" });
  } catch (error) {
    console.error("Gagal mengupdate tag:", error);
    return res
      .status(500)
      .json({ success: false, message: "Gagal memperbarui data." });
  }
});

// 4. Hapus Tag
app.delete("/api/tags/:id", async (req, res) => {
  try {
    await db.query("DELETE FROM product_tags WHERE id = ?", [req.params.id]);
    return res
      .status(200)
      .json({ success: true, message: "Tag berhasil dihapus!" });
  } catch (error) {
    console.error("Gagal menghapus tag:", error);
    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server saat menghapus.",
    });
  }
});

// =======================================================================
// ENDPOINT: MANAJEMEN PELANGGAN (CUSTOMERS)
// =======================================================================

// 1. Ambil Daftar Pelanggan (Paging & Search)
app.get("/api/customers", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;
    const search = req.query.search || "";
    const offset = (page - 1) * limit;

    let queryCount = "SELECT COUNT(*) as total FROM users";
    // Sengaja tidak melakukan SELECT password demi keamanan data (Security Best Practice)
    let queryData =
      "SELECT id, fullname, email, phone, status, created_at FROM users";
    const queryParams = [];

    // Logika Pencarian Pintar (Cari berdasarkan nama ATAU email)
    if (search) {
      queryCount += " WHERE fullname LIKE ? OR email LIKE ?";
      queryData += " WHERE fullname LIKE ? OR email LIKE ?";
      queryParams.push(`%${search}%`, `%${search}%`);
    }

    queryData += " ORDER BY created_at DESC LIMIT ? OFFSET ?";

    const [countResult] = await db.query(
      queryCount,
      search ? [queryParams[0], queryParams[1]] : [],
    );
    const totalItems = countResult[0].total;
    const totalPages = Math.ceil(totalItems / limit);

    // limit & offset wajib bentuk integer saat dikirim ke db.query
    queryParams.push(limit, offset);
    const [rows] = await db.query(queryData, queryParams);

    return res.status(200).json({
      success: true,
      message: "Data pelanggan berhasil dimuat",
      data: rows,
      pagination: { totalItems, totalPages, currentPage: page, limit },
    });
  } catch (error) {
    console.error("Gagal mengambil daftar pelanggan:", error);
    return res
      .status(500)
      .json({ success: false, message: "Terjadi kesalahan server." });
  }
});

// 2. Ambil Profil Detail Pelanggan + Buku Alamat
app.get("/api/customers/:id", async (req, res) => {
  try {
    // Ambil data profil dasar
    const [users] = await db.query(
      "SELECT id, fullname, email, phone, status, created_at FROM users WHERE id = ?",
      [req.params.id],
    );

    if (users.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Pelanggan tidak ditemukan" });
    }

    // Ambil buku alamat (Urutkan yang utama/primary di paling atas)
    const [addresses] = await db.query(
      "SELECT * FROM user_addresses WHERE user_id = ? ORDER BY is_primary DESC, created_at DESC",
      [req.params.id],
    );

    // *Catatan: Kelak saat Modul Pesanan (Orders) sudah dibuat,
    // kita akan menambahkan query ke tabel orders di sini untuk menampilkan riwayat belanja mereka.

    return res.status(200).json({
      success: true,
      data: {
        ...users[0],
        addresses,
      },
    });
  } catch (error) {
    console.error("Gagal mengambil detail pelanggan:", error);
    return res
      .status(500)
      .json({ success: false, message: "Terjadi kesalahan server." });
  }
});

// 3. Ubah Status Akun Pelanggan (Blokir / Buka Blokir)
app.put("/api/customers/:id/status", async (req, res) => {
  try {
    const { status } = req.body; // Akan berisi 'active' atau 'suspended'

    // Validasi input keamanan
    if (!["active", "suspended"].includes(status)) {
      return res
        .status(400)
        .json({ success: false, message: "Status tidak valid." });
    }

    await db.query("UPDATE users SET status = ? WHERE id = ?", [
      status,
      req.params.id,
    ]);

    return res.status(200).json({
      success: true,
      message: `Akun pelanggan berhasil ${status === "active" ? "diaktifkan" : "diblokir"}.`,
    });
  } catch (error) {
    console.error("Gagal ubah status pelanggan:", error);
    return res
      .status(500)
      .json({ success: false, message: "Gagal memproses permintaan." });
  }
});

// =======================================================================
// ENDPOINT: MANAJEMEN PESANAN (ORDERS & LOGISTIK KIRIMINAJA)
// =======================================================================

// 1. Ambil Daftar Pesanan untuk Dashboard Admin (Paging, Search, & Filter Status)
app.get("/api/orders", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";
    const statusFilter = req.query.status || ""; // 'pending', 'paid', 'shipping', etc.
    const offset = (page - 1) * limit;

    let queryCount =
      "SELECT COUNT(*) as total FROM orders o JOIN users u ON o.user_id = u.id";
    let queryData = `
      SELECT o.id, o.invoice_number, o.total_amount, o.status, o.courier_name, o.airway_bill, o.created_at, u.fullname 
      FROM orders o 
      JOIN users u ON o.user_id = u.id
    `;

    const queryParams = [];
    let whereClauses = [];

    // Filter berdasarkan Pencarian (No. Invoice atau Nama Pelanggan)
    if (search) {
      whereClauses.push("(o.invoice_number LIKE ? OR u.fullname LIKE ?)");
      queryParams.push(`%${search}%`, `%${search}%`);
    }

    // Filter berdasarkan Tab Status (Cepat)
    if (statusFilter) {
      whereClauses.push("o.status = ?");
      queryParams.push(statusFilter);
    }

    // Satukan klausa WHERE jika ada
    if (whereClauses.length > 0) {
      const whereSQL = " WHERE " + whereClauses.join(" AND ");
      queryCount += whereSQL;
      queryData += whereSQL;
    }

    queryData += " ORDER BY o.created_at DESC LIMIT ? OFFSET ?";

    // Ambil total item untuk paginasi
    const [countResult] = await db.query(
      queryCount,
      queryParams.slice(0, whereClauses.length * 2 || whereClauses.length),
    );
    const totalItems = countResult[0].total;
    const totalPages = Math.ceil(totalItems / limit);

    // Masukkan limit & offset (Wajib Integer)
    queryParams.push(limit, offset);
    const [rows] = await db.query(queryData, queryParams);

    return res.status(200).json({
      success: true,
      data: rows,
      pagination: { totalItems, totalPages, currentPage: page, limit },
    });
  } catch (error) {
    console.error("Gagal mengambil daftar pesanan:", error);
    return res
      .status(500)
      .json({ success: false, message: "Terjadi kesalahan server." });
  }
});

// 2. Ambil Rincian Detail Pesanan (Keranjang Belanja + Alamat + Info KiriminAja)
app.get("/api/orders/:id", async (req, res) => {
  try {
    // Ambil data transaksi induk & info pelanggan
    const [orders] = await db.query(
      `
      SELECT o.*, u.fullname as customer_name, u.email as customer_email 
      FROM orders o 
      JOIN users u ON o.user_id = u.id 
      WHERE o.id = ?
    `,
      [req.params.id],
    );

    if (orders.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Pesanan tidak ditemukan." });
    }

    // Ambil barang-barang produk yang dibeli di dalam pesanan ini
    const [items] = await db.query(
      `
      SELECT oi.*, p.sku as product_sku 
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
    `,
      [req.params.id],
    );

    return res.status(200).json({
      success: true,
      data: {
        ...orders[0],
        items: items,
      },
    });
  } catch (error) {
    console.error("Gagal mengambil rincian pesanan:", error);
    return res
      .status(500)
      .json({ success: false, message: "Terjadi kesalahan server." });
  }
});

// 3. Manual Override Status / Input Resi Jaga-jaga (Sebelum KiriminAja otomatisasi penuh jalan)
app.put("/api/orders/:id/status", async (req, res) => {
  try {
    const { status, airway_bill } = req.body;
    const allowedStatus = [
      "pending",
      "paid",
      "shipping",
      "completed",
      "cancelled",
    ];

    if (!allowedStatus.includes(status)) {
      return res
        .status(400)
        .json({ success: false, message: "Status pesanan tidak valid." });
    }

    let queryUpdate = "UPDATE orders SET status = ?";
    const params = [status];

    // Jika admin memasukkan nomor resi secara manual (opsional fallback)
    if (airway_bill) {
      queryUpdate += ", airway_bill = ?";
      params.push(airway_bill);
    }

    queryUpdate += " WHERE id = ?";
    params.push(req.params.id);

    await db.query(queryUpdate, params);

    return res.status(200).json({
      success: true,
      message: `Status pesanan berhasil diubah menjadi ${status}.`,
    });
  } catch (error) {
    console.error("Gagal mengubah status pesanan:", error);
    return res
      .status(500)
      .json({ success: false, message: "Gagal memproses permintaan." });
  }
});

// =======================================================================
// ENDPOINT: PENGATURAN TOKO & INTEGRASI (SETTINGS)
// =======================================================================

// 1. Ambil Semua Pengaturan
app.get("/api/settings", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT setting_key, setting_value FROM settings",
    );

    // Ubah format Array [{key: 'shop_name', value: 'Chester'}]
    // Menjadi Object { shop_name: 'Chester' } agar mudah dipakai di React
    const settingsObject = {};
    rows.forEach((row) => {
      settingsObject[row.setting_key] = row.setting_value;
    });

    return res.status(200).json({ success: true, data: settingsObject });
  } catch (error) {
    console.error("Gagal mengambil pengaturan:", error);
    return res
      .status(500)
      .json({ success: false, message: "Terjadi kesalahan server." });
  }
});

// 2. Simpan/Update Pengaturan Massal
app.put("/api/settings", async (req, res) => {
  try {
    const settingsData = req.body; // Contoh: { shop_name: "Chester Baru", kiriminaja_api_key: "abc" }

    // Loop melalui setiap key di object dan update database
    for (const [key, value] of Object.entries(settingsData)) {
      await db.query(
        "INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?",
        [key, value, value],
      );
    }

    return res
      .status(200)
      .json({ success: true, message: "Pengaturan berhasil disimpan." });
  } catch (error) {
    console.error("Gagal menyimpan pengaturan:", error);
    return res
      .status(500)
      .json({ success: false, message: "Gagal menyimpan pengaturan." });
  }
});

// =======================================================================
// ENDPOINT INTERNAL: MANAJEMEN STAF / ADMIN & PROFIL
// =======================================================================

// 1. Ambil Semua Daftar Admin Asli dari Database
app.get("/api/admins", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id, fullname, email, role, created_at FROM admins ORDER BY id DESC",
    );
    return res.status(200).json({ success: true, data: rows });
  } catch (error) {
    console.error("Gagal mengambil daftar admin:", error);
    return res
      .status(500)
      .json({ success: false, message: "Terjadi kesalahan server." });
  }
});

// 2. Tambah Akun Admin Baru (Pendaftaran Staf)
app.post("/api/admins", async (req, res) => {
  try {
    const { fullname, email, password, role } = req.body;

    if (!fullname || !email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Semua kolom wajib diisi." });
    }

    // Cek apakah email sudah dipakai oleh admin/staf lain
    const [existing] = await db.query("SELECT id FROM admins WHERE email = ?", [
      email,
    ]);
    if (existing.length > 0) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Email sudah terdaftar sebagai admin.",
        });
    }

    // Amankan password dengan enkripsi bcrypt sebelum disimpan
    const hashedPassword = await bcrypt.hash(password, 10);

    // Masukkan ke database
    await db.query(
      "INSERT INTO admins (fullname, email, password, role) VALUES (?, ?, ?, ?)",
      [fullname, email, hashedPassword, role || "Editor"],
    );

    return res
      .status(201)
      .json({ success: true, message: "Akun admin baru berhasil dibuat!" });
  } catch (error) {
    console.error("Gagal menambah admin baru:", error);
    return res
      .status(500)
      .json({ success: false, message: "Gagal menyimpan data staf baru." });
  }
});

// 3. Hapus Akun Admin / Staf
app.delete("/api/admins/:id", async (req, res) => {
  try {
    const adminId = req.params.id;

    // FITUR KEAMANAN KRUSIAL: Jangan ijinkan menghapus Superadmin Utama (ID 1)
    // Agar kamu tidak terkunci keluar sistem secara tidak sengaja!
    if (parseInt(adminId) === 1) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Admin Utama (Superadmin) tidak boleh dihapus!",
        });
    }

    await db.query("DELETE FROM admins WHERE id = ?", [adminId]);
    return res
      .status(200)
      .json({
        success: true,
        message: "Akun staf berhasil dihapus dari sistem.",
      });
  } catch (error) {
    console.error("Gagal menghapus admin:", error);
    return res
      .status(500)
      .json({ success: false, message: "Gagal menghapus staf." });
  }
});

// 4. Perbarui Profil & Password Admin yang Sedang Login
app.put("/api/admins/profile", async (req, res) => {
  try {
    const { id, fullname, currentPassword, newPassword } = req.body;

    if (!id || !fullname) {
      return res
        .status(400)
        .json({ success: false, message: "Data ID dan Nama wajib diisi." });
    }

    // Ambil password lama di DB untuk dicocokkan
    const [admin] = await db.query("SELECT password FROM admins WHERE id = ?", [
      id,
    ]);
    if (admin.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Akun tidak ditemukan." });
    }

    let queryUpdate = "UPDATE admins SET fullname = ?";
    const params = [fullname];

    // Logika jika admin berniat mengganti passwordnya
    if (currentPassword && newPassword) {
      const isMatch = await bcrypt.compare(currentPassword, admin[0].password);
      if (!isMatch) {
        return res
          .status(400)
          .json({
            success: false,
            message: "Kata sandi lama yang Anda masukkan salah!",
          });
      }

      // Hash password barunya jika password lama cocok
      const hashedNewPassword = await bcrypt.hash(newPassword, 10);
      queryUpdate += ", password = ?";
      params.push(hashedNewPassword);
    }

    queryUpdate += " WHERE id = ?";
    params.push(id);

    await db.query(queryUpdate, params);
    return res
      .status(200)
      .json({ success: true, message: "Profil Anda berhasil diperbarui." });
  } catch (error) {
    console.error("Gagal memperbarui profil admin:", error);
    return res
      .status(500)
      .json({
        success: false,
        message: "Terjadi kesalahan server saat memperbarui profil.",
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
