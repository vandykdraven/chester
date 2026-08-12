const express = require("express");
const router = express.Router();
const axios = require("axios");
const mysql = require("mysql2");
const { filterProfanity } = require("./utils/helpers");
const Notifier = require("./utils/notifier");
const crypto = require("crypto");
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

// Konfigurasi Koneksi Database MySQL Menggunakan Pool (Dengan Keep-Alive)
const db = mysql
  .createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,        // Mengaktifkan fitur anti-idle
    keepAliveInitialDelay: 10000, // Mengirim sinyal ping setiap 10 detik
  })
  .promise();

// =======================================================================
// CONFIGURATION MULTER (UNGGAH GAMBAR PRODUK & PROFIL)
// =======================================================================
const uploadDir = "./uploads/products";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const profileDir = "./uploads/profiles";
if (!fs.existsSync(profileDir)) {
  fs.mkdirSync(profileDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.fieldname === "avatar") {
      cb(null, profileDir);
    } else {
      cb(null, uploadDir);
    }
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname),
    );
  },
});

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

const cpUpload = upload.fields([
  { name: "primaryImage", maxCount: 1 },
  { name: "supportingImages", maxCount: 4 },
]);

// =======================================================================
// ENDPOINT: MANAJEMEN PRODUK (PRODUCTS)
// =======================================================================
app.post("/api/products", cpUpload, async (req, res) => {
  try {
    const productData = JSON.parse(req.body.data);
    const {
      name,
      category,
      size_guide_id,
      description,
      video_url,
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
      imagesConfig,
    } = productData;

    if (!name)
      return res
        .status(400)
        .json({ success: false, message: "Nama produk wajib diisi!" });

    // Membuat slug otomatis dari nama produk
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");

    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // Menambahkan kolom "slug" pada query INSERT
      const [productResult] = await connection.query(
        `INSERT INTO products (name, slug, category_id, size_guide_id, description, video_url, status, price, original_price, stock, weight, sku, has_variant, variant_types_json, seo_title, seo_description, seo_keywords) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          name,
          slug, // Memasukkan variabel slug ke database
          category || null,
          size_guide_id || null,
          description || null,
          video_url || null,
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
      const imgCfg = imagesConfig || [];

      // PROSES SLOT FOTO UTAMA
      if (imgCfg[0]) {
        if (imgCfg[0].type === "pc" && req.files["primaryImage"]) {
          const file = req.files["primaryImage"][0];
          const filePath = `/uploads/products/${file.filename}`;

          // 1. Simpan relasi ke tabel produk
          await connection.query(
            `INSERT INTO product_images (product_id, image_url, is_primary) VALUES (?, ?, 1)`,
            [productId, filePath],
          );
          
          // 2. PERBAIKAN: Daftarkan ke galeri server agar muncul di modal
          await connection.query(
            `INSERT INTO gallery_media (filename, file_path, file_size) VALUES (?, ?, ?)`,
            [file.originalname, filePath, file.size],
          );
        } else if (imgCfg[0].type === "server" && imgCfg[0].path) {
          await connection.query(
            `INSERT INTO product_images (product_id, image_url, is_primary) VALUES (?, ?, 1)`,
            [productId, imgCfg[0].path],
          );
        }
      }

      // PROSES SLOT FOTO PENDUKUNG (1-4)
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
            const filePath = `/uploads/products/${file.filename}`;

            // 1. Simpan relasi ke tabel produk
            await connection.query(
              `INSERT INTO product_images (product_id, image_url, is_primary) VALUES (?, ?, 0)`,
              [productId, filePath],
            );

            // 2. PERBAIKAN: Daftarkan ke galeri server
            await connection.query(
              `INSERT INTO gallery_media (filename, file_path, file_size) VALUES (?, ?, ?)`,
              [file.originalname, filePath, file.size],
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

      if (hasVariant && variantMatrix && variantMatrix.length > 0) {
        for (const variant of variantMatrix) {
          await connection.query(
            `INSERT INTO product_variants (product_id, variant_key, price, original_price, stock, weight, sku) VALUES (?, ?, ?, ?, ?, ?, ?)`,
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

      if (wholesales && wholesales.length > 0) {
        for (const ws of wholesales) {
          if (ws.minQty && ws.price) {
            await connection.query(
              `INSERT INTO product_wholesales (product_id, min_qty, wholesale_price) VALUES (?, ?, ?)`,
              [productId, ws.minQty, ws.price],
            );
          }
        }
      }

      await connection.commit();
      connection.release();
      return res.status(201).json({
        success: true,
        message: "Produk berhasil disimpan!",
        productId: productId,
      });
    } catch (dbError) {
      await connection.rollback();
      connection.release();
      throw dbError;
    }
  } catch (error) {
    console.error("Error menyimpan produk:", error);
    return res.status(500).json({
      success: false,
      message: "Gagal menyimpan produk.",
      error: error.message,
    });
  }
});

app.get("/api/products", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const search = req.query.search || "";
    // Menangkap parameter category (kini berupa slug, contoh: "tops,pants")
    const category = req.query.category || "";
    const maxPrice = req.query.maxPrice || 3000000;
    const availability = req.query.availability || "all";
    const sortBy = req.query.sortBy || "terbaru";

    const offset = (page - 1) * limit;

    // DIPERBARUI: Menambahkan LEFT JOIN ke tabel product_categories
    let baseQuery = `
      FROM products p
      LEFT JOIN product_categories pc ON p.category_id = pc.id
      LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = 1
      LEFT JOIN product_variants pv ON p.id = pv.product_id
    `;

    let whereClauses = [];
    let queryParams = [];

    if (search) {
      whereClauses.push("p.name LIKE ?");
      queryParams.push(`%${search}%`);
    }

    // DIPERBARUI: Logika filter menggunakan array slug (string)
    if (category) {
      const catArray = category
        .split(",")
        .map((slug) => slug.trim()) // Membersihkan spasi di sekitar slug
        .filter((slug) => slug.length > 0); // Memastikan slug tidak kosong

      if (catArray.length > 0) {
        // Menggunakan kolom pc.slug dari tabel product_categories
        whereClauses.push(`pc.slug IN (${catArray.map(() => "?").join(",")})`);
        queryParams.push(...catArray);
      }
    }

    // Menambahkan p.slug agar frontend bisa memakai data slug
    let selectClause = `
      SELECT p.id, p.name, p.slug, p.category_id, p.price, p.original_price, p.stock, p.status, p.has_variant, p.sku, p.created_at, 
      pi.image_url AS primary_image, 
      MIN(pv.price) AS min_v_price, MAX(pv.price) AS max_v_price, 
      MIN(pv.original_price) AS min_v_original_price, SUM(pv.stock) AS total_v_stock
    `;

    let whereString =
      whereClauses.length > 0 ? " WHERE " + whereClauses.join(" AND ") : "";
    let groupByString = " GROUP BY p.id, pi.image_url";

    let havingClauses = [];
    havingClauses.push(`(IF(p.has_variant = 1, min_v_price, p.price) <= ?)`);
    queryParams.push(maxPrice);

    if (availability === "instock") {
      havingClauses.push(`(p.stock > 0 OR total_v_stock > 0)`);
    }
    let havingString =
      havingClauses.length > 0 ? " HAVING " + havingClauses.join(" AND ") : "";

    let orderString = " ORDER BY p.created_at DESC";
    if (sortBy === "termurah") {
      orderString = " ORDER BY IF(p.has_variant = 1, min_v_price, p.price) ASC";
    } else if (sortBy === "termahal") {
      orderString =
        " ORDER BY IF(p.has_variant = 1, min_v_price, p.price) DESC";
    } else if (sortBy === "abjad") {
      orderString = " ORDER BY p.name ASC";
    }

    let countQuery = `SELECT COUNT(*) as total FROM (${selectClause} ${baseQuery} ${whereString} ${groupByString} ${havingString}) as count_table`;
    const [countResult] = await db.query(countQuery, queryParams);
    const totalItems = countResult[0].total;
    const totalPages = Math.ceil(totalItems / limit);

    let dataQuery = `${selectClause} ${baseQuery} ${whereString} ${groupByString} ${havingString} ${orderString} LIMIT ? OFFSET ?`;
    queryParams.push(limit, offset);
    const [rows] = await db.query(dataQuery, queryParams);

    return res.status(200).json({
      success: true,
      data: rows,
      pagination: { totalItems, totalPages, currentPage: page, limit },
    });
  } catch (error) {
    console.error("Gagal get produk server-side:", error);
    return res
      .status(500)
      .json({ success: false, message: "Gagal memuat produk." });
  }
});

app.delete("/api/products/:id", async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const productId = req.params.id;

    try {
      // LANGKAH 1: Selalu coba HARD DELETE terlebih dahulu untuk data anak dasar
      await connection.query("DELETE FROM product_images WHERE product_id = ?", [productId]);
      await connection.query("DELETE FROM product_variants WHERE product_id = ?", [productId]);
      await connection.query("DELETE FROM product_wholesales WHERE product_id = ?", [productId]);
      
      // Coba hapus produk utama
      const [deleteResult] = await connection.query("DELETE FROM products WHERE id = ?", [productId]);
      
      if (deleteResult.affectedRows === 0) {
        throw new Error("NOT_FOUND");
      }
      
      await connection.commit();
      return res.json({ success: true, message: "Produk belum memiliki riwayat transaksi. Berhasil dihapus permanen." });

    } catch (sqlError) {
      // LANGKAH 2: Tangkap error relasional MySQL.
      // ER_ROW_IS_REFERENCED_2 atau errno 1451 berarti produk sedang terikat di tabel lain (penjualan, keranjang, dll).
      if (sqlError.code === 'ER_ROW_IS_REFERENCED_2' || sqlError.errno === 1451) {
        
        // Eksekusi SOFT DELETE
        const timeStamp = Date.now();
        const deleteSuffix = `-del-${timeStamp}`;

        const [updateResult] = await connection.query(`
          UPDATE products 
          SET 
            is_deleted = 1, 
            slug = CONCAT(slug, ?),
            sku = IF(sku IS NOT NULL AND sku != '', CONCAT(sku, ?), sku)
          WHERE id = ?
        `, [deleteSuffix, deleteSuffix, productId]);

        if (updateResult.affectedRows === 0) {
          throw new Error("NOT_FOUND");
        }

        await connection.commit();
        return res.json({ success: true, message: "Produk memiliki riwayat penjualan/interaksi. Berhasil diarsipkan (Soft Delete)." });

      } else {
        // Jika errornya bukan karena relasi, lempar error ke blok catch utama
        throw sqlError;
      }
    }

  } catch (error) {
    await connection.rollback();
    
    if (error.message === "NOT_FOUND") {
      return res.status(404).json({ success: false, message: "Produk tidak ditemukan di database." });
    }

    console.error("Gagal melakukan Smart Delete:", error);
    return res.status(500).json({ success: false, message: "Terjadi kesalahan server. Cek log terminal Node.js Anda." });
  } finally {
    connection.release();
  }
});

// Merubah parameter dari :id menjadi :slug untuk detail produk
app.get("/api/products/:slug", async (req, res) => {
  try {
    // Cari berdasarkan kolom slug
    const [products] = await db.query("SELECT * FROM products WHERE slug = ?", [
      req.params.slug, // Menangkap parameter slug
    ]);
    if (products.length === 0)
      return res
        .status(404)
        .json({ success: false, message: "Produk tidak ditemukan!" });

    // Ambil ID aslinya untuk mencari relasi gambar dan varian
    const productId = products[0].id;

    const [images] = await db.query(
      "SELECT id, image_url, is_primary FROM product_images WHERE product_id = ?",
      [productId], // Gunakan productId
    );
    const [variants] = await db.query(
      "SELECT * FROM product_variants WHERE product_id = ?",
      [productId], // Gunakan productId
    );
    const [wholesales] = await db.query(
      "SELECT * FROM product_wholesales WHERE product_id = ?",
      [productId], // Gunakan productId
    );
    return res.status(200).json({
      success: true,
      data: { ...products[0], images, variants, wholesales },
    });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Terjadi kesalahan server." });
  }
});

app.put(
  "/api/products/:id",
  upload.fields([
    { name: "primaryImage", maxCount: 1 },
    { name: "supportingImages", maxCount: 4 },
  ]),
  async (req, res) => {
    if (!req.body.data)
      return res.status(400).json({ success: false, message: "Data produk tidak ditemukan." });

    const productId = req.params.id;
    const {
      name,
      category_id,
      size_guide_id,
      description,
      video_url,
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
      imagesConfig,
    } = JSON.parse(req.body.data);

    // Mencegah error jika name dari frontend tiba-tiba undefined
    const safeName = name || "Produk Tanpa Nama";
    const slug = safeName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");

    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // PERBAIKAN: Memastikan semua nilai numerik dikonversi dengan aman 
      // (Mencegah error string kosong "" masuk ke MySQL Strict Mode)
      const finalPrice = has_variant ? 0 : (Number(price) || 0);
      const finalOriginalPrice = has_variant ? 0 : (Number(original_price) || 0);
      const finalStock = has_variant ? 0 : (Number(stock) || 0);
      const finalWeight = has_variant ? 0 : (Number(weight) || 0);

      await connection.query(
        `UPDATE products SET name = ?, slug = ?, category_id = ?, size_guide_id = ?, description = ?, video_url = ?, status = ?, price = ?, original_price = ?, stock = ?, weight = ?, sku = ?, has_variant = ?, variant_types_json = ?, seo_title = ?, seo_description = ?, seo_keywords = ? WHERE id = ?`,
        [
          safeName,
          slug,
          category_id || null,
          size_guide_id || null,
          description || null,
          video_url || null,
          status || "available",
          finalPrice,
          finalOriginalPrice,
          finalStock,
          finalWeight,
          sku || null,
          has_variant ? 1 : 0,
          has_variant ? JSON.stringify(variantTypes) : null,
          seo_title || null,
          seo_description || null,
          seo_keywords || null,
          productId,
        ]
      );

      await connection.query("DELETE FROM product_wholesales WHERE product_id = ?", [productId]);
      if (wholesales && wholesales.length > 0) {
        for (const ws of wholesales) {
          if (ws.minQty && ws.price) {
            await connection.query(
              "INSERT INTO product_wholesales (product_id, min_qty, wholesale_price) VALUES (?, ?, ?)",
              [productId, Number(ws.minQty) || 0, Number(ws.price) || 0]
            );
          }
        }
      }

      await connection.query("DELETE FROM product_variants WHERE product_id = ?", [productId]);
      if (has_variant && variantMatrix && variantMatrix.length > 0) {
        for (const row of variantMatrix) {
          await connection.query(
            `INSERT INTO product_variants (product_id, variant_key, price, original_price, stock, weight, sku) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              productId,
              row.key || row.variant_key || row.combination?.join("-"),
              Number(row.price) || 0,
              Number(row.original_price) || 0,
              Number(row.stock) || 0,
              Number(row.weight) || 0,
              row.sku || null,
            ]
          );
        }
      }

      await connection.query("DELETE FROM product_images WHERE product_id = ?", [productId]);
      const imgCfg = imagesConfig || [];
      if (imgCfg[0]) {
        if (imgCfg[0].type === "pc" && req.files["primaryImage"]) {
          await connection.query(
            "INSERT INTO product_images (product_id, image_url, is_primary) VALUES (?, ?, 1)",
            [productId, `/uploads/products/${req.files["primaryImage"][0].filename}`]
          );
        } else if ((imgCfg[0].type === "server" || imgCfg[0].type === "existing") && imgCfg[0].path) {
          await connection.query(
            "INSERT INTO product_images (product_id, image_url, is_primary) VALUES (?, ?, 1)",
            [productId, imgCfg[0].path]
          );
        }
      }

      let pcUploadIndex = 0;
      for (let i = 1; i <= 4; i++) {
        const slotConfig = imgCfg[i];
        if (slotConfig) {
          if (slotConfig.type === "pc" && req.files["supportingImages"] && req.files["supportingImages"][pcUploadIndex]) {
            await connection.query(
              "INSERT INTO product_images (product_id, image_url, is_primary) VALUES (?, ?, 0)",
              [productId, `/uploads/products/${req.files["supportingImages"][pcUploadIndex].filename}`]
            );
            pcUploadIndex++;
          } else if ((slotConfig.type === "server" || slotConfig.type === "existing") && slotConfig.path) {
            await connection.query(
              "INSERT INTO product_images (product_id, image_url, is_primary) VALUES (?, ?, 0)",
              [productId, slotConfig.path]
            );
          }
        }
      }

      await connection.commit();
      return res.json({ success: true, message: "Produk dan media berhasil diperbarui!" });
    } catch (error) {
      await connection.rollback();
      console.error("Gagal update produk:", error);
      return res.status(500).json({ success: false, message: "Gagal memperbarui data pada server." });
    } finally {
      connection.release();
    }
  }
);

// =======================================================================
// ENDPOINT: [PELANGGAN] MENGAMBIL ULASAN PUBLIK PADA HALAMAN PRODUK
// =======================================================================
app.get("/api/products/:id/reviews", async (req, res) => {
  try {
    const productId = req.params.id;

    // Ambil ulasan, gabungkan dengan nama user untuk ditampilkan
    // Telah ditambahkan r.user_id untuk validasi kepemilikan di frontend
    // dan r.is_hidden = 0 untuk memfilter ulasan yang disembunyikan.
    const [reviews] = await db.query(
      `SELECT r.id, r.user_id, r.rating, r.comment, r.variant_name, r.admin_reply, r.created_at, r.updated_at, 
              u.fullname as customer_name, u.avatar 
       FROM product_reviews r
       JOIN users u ON r.user_id = u.id
       WHERE r.product_id = ? AND r.is_hidden = 0
       ORDER BY r.created_at DESC`,
      [productId],
    );

    // Hitung rata-rata rating
    let averageRating = 0;
    if (reviews.length > 0) {
      const totalRating = reviews.reduce((sum, rev) => sum + rev.rating, 0);
      averageRating = (totalRating / reviews.length).toFixed(1); // 1 angka di belakang koma
    }

    return res.status(200).json({
      success: true,
      data: reviews,
      summary: {
        averageRating: averageRating,
        totalReviews: reviews.length,
      },
    });
  } catch (error) {
    console.error("Gagal mengambil ulasan produk:", error);
    return res
      .status(500)
      .json({ success: false, message: "Terjadi kesalahan server." });
  }
});

// =======================================================================
// ENDPOINT: MEDIA GALERI (GALLERY)
// =======================================================================
app.post(
  "/api/gallery/upload",
  upload.single("galleryFile"),
  async (req, res) => {
    try {
      if (!req.file)
        return res
          .status(400)
          .json({ success: false, message: "Tidak ada file yang diunggah." });
      const filePath = `/uploads/products/${req.file.filename}`;
      const [result] = await db.query(
        "INSERT INTO gallery_media (filename, file_path, file_size) VALUES (?, ?, ?)",
        [req.file.originalname, filePath, req.file.size],
      );
      return res.status(201).json({
        success: true,
        message: "Gambar berhasil ditambahkan!",
        data: {
          id: result.insertId,
          filename: req.file.originalname,
          file_path: filePath,
          file_size: req.file.size,
        },
      });
    } catch (error) {
      return res
        .status(500)
        .json({ success: false, message: "Gagal memproses unggahan gambar." });
    }
  },
);

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
      queryCount += " WHERE filename LIKE ?";
      queryData += " WHERE filename LIKE ?";
      queryParams.push(`%${search}%`);
    }
    queryData += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
    const [countResult] = await db.query(
      queryCount,
      search ? [queryParams[0]] : [],
    );
    queryParams.push(limit, offset);
    const [rows] = await db.query(queryData, queryParams);

    return res.status(200).json({
      success: true,
      message: "Daftar galeri berhasil dimuat",
      data: rows,
      pagination: {
        totalItems: countResult[0].total,
        totalPages: Math.ceil(countResult[0].total / limit),
        currentPage: page,
        limit,
      },
    });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Terjadi kesalahan server." });
  }
});

app.delete("/api/gallery/:id", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT file_path FROM gallery_media WHERE id = ?",
      [req.params.id],
    );
    if (rows.length === 0)
      return res
        .status(404)
        .json({ success: false, message: "Media tidak ditemukan." });
    await db.query("DELETE FROM gallery_media WHERE id = ?", [req.params.id]);
    const filePath = path.join(__dirname, rows[0].file_path);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    return res.json({
      success: true,
      message: "Gambar berhasil dihapus dari server!",
    });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Terjadi kesalahan server." });
  }
});

// =======================================================================
// ENDPOINT: PANDUAN UKURAN (SIZE GUIDES)
// =======================================================================
app.get("/api/size-guides", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM size_guides ORDER BY created_at DESC",
    );
    return res.status(200).json({ success: true, data: rows });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Terjadi kesalahan server." });
  }
});

app.post("/api/size-guides", async (req, res) => {
  const { name, content, image_url } = req.body;
  if (!name)
    return res
      .status(400)
      .json({ success: false, message: "Nama panduan wajib diisi!" });
  try {
    await db.query(
      "INSERT INTO size_guides (name, content, image_url) VALUES (?, ?, ?)",
      [name, content || null, image_url || null],
    );
    return res
      .status(201)
      .json({ success: true, message: "Panduan ukuran berhasil ditambahkan!" });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Gagal menyimpan ke database." });
  }
});

app.get("/api/size-guides/:id", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM size_guides WHERE id = ?", [
      req.params.id,
    ]);
    if (rows.length === 0)
      return res
        .status(404)
        .json({ success: false, message: "Data tidak ditemukan!" });
    return res.status(200).json({ success: true, data: rows[0] });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Terjadi kesalahan server." });
  }
});

app.put("/api/size-guides/:id", async (req, res) => {
  const { name, content, image_url } = req.body;
  if (!name)
    return res
      .status(400)
      .json({ success: false, message: "Nama panduan wajib diisi!" });
  try {
    await db.query(
      "UPDATE size_guides SET name = ?, content = ?, image_url = ? WHERE id = ?",
      [name, content || null, image_url || null, req.params.id],
    );
    return res
      .status(200)
      .json({ success: true, message: "Panduan ukuran berhasil diperbarui!" });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Gagal memperbarui data." });
  }
});

app.delete("/api/size-guides/:id", async (req, res) => {
  try {
    await db.query("DELETE FROM size_guides WHERE id = ?", [req.params.id]);
    return res
      .status(200)
      .json({ success: true, message: "Panduan ukuran berhasil dihapus!" });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server saat menghapus.",
    });
  }
});

// =======================================================================
// ENDPOINT: KATEGORI PRODUK (CATEGORIES)
// =======================================================================
app.get("/api/categories", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM product_categories ORDER BY created_at DESC",
    );
    return res.status(200).json({ success: true, data: rows });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Terjadi kesalahan server." });
  }
});

app.post("/api/categories", async (req, res) => {
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
      "INSERT INTO product_categories (name, slug, description) VALUES (?, ?, ?)",
      [name, slug, description || null],
    );
    return res
      .status(201)
      .json({ success: true, message: "Kategori berhasil ditambahkan!" });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Gagal menyimpan ke database." });
  }
});

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
    return res
      .status(500)
      .json({ success: false, message: "Gagal memperbarui data." });
  }
});

app.delete("/api/categories/:id", async (req, res) => {
  try {
    await db.query("DELETE FROM product_categories WHERE id = ?", [
      req.params.id,
    ]);
    return res
      .status(200)
      .json({ success: true, message: "Kategori berhasil dihapus!" });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Terjadi kesalahan server." });
  }
});

// =======================================================================
// ENDPOINT: LABELS / TAG PRODUK (TAGS)
// =======================================================================
app.get("/api/tags", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM product_tags ORDER BY created_at DESC",
    );
    return res.status(200).json({ success: true, data: rows });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Terjadi kesalahan server." });
  }
});

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
    if (error.code === "ER_DUP_ENTRY")
      return res
        .status(400)
        .json({ success: false, message: "Tag ini sudah ada!" });
    return res
      .status(500)
      .json({ success: false, message: "Gagal menyimpan ke database." });
  }
});

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
    return res
      .status(500)
      .json({ success: false, message: "Gagal memperbarui data." });
  }
});

app.delete("/api/tags/:id", async (req, res) => {
  try {
    await db.query("DELETE FROM product_tags WHERE id = ?", [req.params.id]);
    return res
      .status(200)
      .json({ success: true, message: "Tag berhasil dihapus!" });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Terjadi kesalahan server." });
  }
});

// =======================================================================
// ENDPOINT: MANAJEMEN PELANGGAN (CUSTOMERS)
// =======================================================================
app.get("/api/customers", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;
    const search = req.query.search || "";
    const offset = (page - 1) * limit;

    let queryCount = "SELECT COUNT(*) as total FROM users";
    let queryData =
      "SELECT id, fullname, email, phone, status, created_at FROM users";
    const queryParams = [];

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
    queryParams.push(limit, offset);
    const [rows] = await db.query(queryData, queryParams);

    return res.status(200).json({
      success: true,
      data: rows,
      pagination: {
        totalItems: countResult[0].total,
        totalPages: Math.ceil(countResult[0].total / limit),
        currentPage: page,
        limit,
      },
    });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Terjadi kesalahan server." });
  }
});

// Konsolidasi Rincian Pelanggan (Profil, Alamat Akurat, & Riwayat Pesanan)
app.get("/api/customers/:id", async (req, res) => {
  try {
    const customerId = req.params.id;
    const [users] = await db.query(
      "SELECT id, fullname, email, phone, status, created_at FROM users WHERE id = ?",
      [customerId],
    );
    if (users.length === 0)
      return res
        .status(404)
        .json({ success: false, message: "Pelanggan tidak ditemukan." });

    const [addresses] = await db.query(
      "SELECT * FROM addresses WHERE user_id = ? ORDER BY is_primary DESC",
      [customerId],
    );
    const [orders] = await db.query(
      "SELECT id, invoice_number, total_amount, status, created_at FROM orders WHERE user_id = ? ORDER BY created_at DESC",
      [customerId],
    );

    const totalSpent = orders
      .filter((o) => ["completed", "shipping", "paid"].includes(o.status))
      .reduce((sum, o) => sum + parseFloat(o.total_amount), 0);

    return res.status(200).json({
      success: true,
      data: {
        ...users[0],
        addresses: addresses,
        total_orders: orders.length,
        total_spent: totalSpent,
        order_history: orders,
      },
    });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Terjadi kesalahan server." });
  }
});

app.put("/api/customers/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    if (!["active", "suspended"].includes(status))
      return res
        .status(400)
        .json({ success: false, message: "Status tidak valid." });
    await db.query("UPDATE users SET status = ? WHERE id = ?", [
      status,
      req.params.id,
    ]);
    return res.status(200).json({
      success: true,
      message: `Akun pelanggan berhasil ${status === "active" ? "diaktifkan" : "diblokir"}.`,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Gagal memproses permintaan." });
  }
});

// =======================================================================
// ENDPOINT: MANAJEMEN PESANAN (ORDERS)
// =======================================================================
app.get("/api/orders", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";
    const statusFilter = req.query.status || "";
    const offset = (page - 1) * limit;

    let queryCount =
      "SELECT COUNT(*) as total FROM orders o JOIN users u ON o.user_id = u.id";
    let queryData =
      "SELECT o.id, o.invoice_number, o.total_amount, o.status, o.courier_name, o.airway_bill, o.created_at, u.fullname FROM orders o JOIN users u ON o.user_id = u.id";

    const queryParams = [];
    let whereClauses = [];

    if (search) {
      whereClauses.push("(o.invoice_number LIKE ? OR u.fullname LIKE ?)");
      queryParams.push(`%${search}%`, `%${search}%`);
    }
    if (statusFilter) {
      whereClauses.push("o.status = ?");
      queryParams.push(statusFilter);
    }
    if (whereClauses.length > 0) {
      const whereSQL = " WHERE " + whereClauses.join(" AND ");
      queryCount += whereSQL;
      queryData += whereSQL;
    }

    queryData += " ORDER BY o.created_at DESC LIMIT ? OFFSET ?";
    const [countResult] = await db.query(
      queryCount,
      queryParams.slice(0, queryParams.length),
    );
    queryParams.push(limit, offset);
    const [rows] = await db.query(queryData, queryParams);

    return res.status(200).json({
      success: true,
      data: rows,
      pagination: {
        totalItems: countResult[0].total,
        totalPages: Math.ceil(countResult[0].total / limit),
        currentPage: page,
        limit,
      },
    });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Terjadi kesalahan server." });
  }
});

app.get("/api/orders/:id", async (req, res) => {
  try {
    const [orders] = await db.query(
      "SELECT o.*, u.fullname as customer_name, u.email as customer_email FROM orders o JOIN users u ON o.user_id = u.id WHERE o.id = ?",
      [req.params.id],
    );
    if (orders.length === 0)
      return res
        .status(404)
        .json({ success: false, message: "Pesanan tidak ditemukan." });
    const [items] = await db.query(
      "SELECT oi.*, p.sku as product_sku FROM order_items oi LEFT JOIN products p ON oi.product_id = p.id WHERE oi.order_id = ?",
      [req.params.id],
    );
    return res
      .status(200)
      .json({ success: true, data: { ...orders[0], items } });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Terjadi kesalahan server." });
  }
});

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
    if (!allowedStatus.includes(status))
      return res
        .status(400)
        .json({ success: false, message: "Status pesanan tidak valid." });

    let queryUpdate = "UPDATE orders SET status = ?";
    const params = [status];
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
    return res
      .status(500)
      .json({ success: false, message: "Gagal memproses permintaan." });
  }
});

// =======================================================================
// ENDPOINT: MEMBUAT PESANAN (CHECKOUT) - HANYA SIMPAN KE DATABASE
// =======================================================================
app.post("/api/orders", async (req, res) => {
  const connection = await db.getConnection();
  try {
    const {
      user_id,
      address,
      shipping_option,
      cart_items,
      subtotal,
      shipping_cost,
      discount_amount,
      grand_total,
    } = req.body;

    // Ambil data user (email) dari database, karena diperlukan oleh Notifier
    const [userRows] = await connection.query("SELECT email FROM users WHERE id = ?", [user_id]);
    const userEmail = userRows.length > 0 ? userRows[0].email : "email_tidak_diketahui@domain.com";

    const date = new Date();
    const invoiceNumber = `INV-${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, "0")}${date.getDate().toString().padStart(2, "0")}-${Math.floor(1000 + Math.random() * 9000)}`;

    await connection.beginTransaction();

    const [orderResult] = await connection.query(
      `INSERT INTO orders (
        invoice_number, user_id, biteship_order_id, airway_bill, waybill_url,
        recipient_name, phone, full_address, city_id, city_name, province_name, postal_code,
        province_id, subdistrict_id,
        courier_name, courier_service, shipping_cost, 
        subtotal_products, total_amount, discount_amount, status
      ) VALUES (?, ?, NULL, NULL, NULL, ?, ?, ?, ?, ?, ?, ?, '0', '0', ?, ?, ?, ?, ?, ?, 'pending')`,
      [
        invoiceNumber,
        user_id,
        address.recipient_name,
        address.phone,
        address.full_address,
        address.city_id,
        address.city_name,
        address.province_name,
        address.postal_code,
        shipping_option.courierName, 
        shipping_option.serviceName,
        shipping_cost,
        subtotal,
        grand_total,
        discount_amount,
      ]
    );

    const orderId = orderResult.insertId;

    for (const item of cart_items) {
      await connection.query(
        `INSERT INTO order_items (order_id, product_id, product_name, variant_key, price, quantity, weight) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [orderId, item.product_id, item.name, item.variant, item.price, item.qty, item.weight || 200]
      );

      const quantityToDeduct = parseInt(item.qty, 10);
      if (!item.variant || item.variant === "Standar") {
        await connection.query(`UPDATE products SET stock = GREATEST(stock - ?, 0) WHERE id = ?`, [quantityToDeduct, item.product_id]);
      } else {
        await connection.query(`UPDATE product_variants SET stock = GREATEST(stock - ?, 0) WHERE product_id = ? AND variant_key = ?`, [quantityToDeduct, item.product_id, item.variant]);
        await connection.query(`UPDATE products p SET p.stock = (SELECT COALESCE(SUM(v.stock), 0) FROM product_variants v WHERE v.product_id = p.id) WHERE p.id = ?`, [item.product_id]);
      }
    }

    await connection.query("DELETE FROM carts WHERE user_id = ?", [user_id]);
    await connection.commit(); 

    // Notifikasi Dashboard Admin
    await createAdminNotification(
      "new_order",
      orderId,
      `Ada pesanan baru masuk! (Invoice: ${invoiceNumber})`
    );

    // ---> PERBAIKAN UTAMA: PANGGIL NOTIFIER UNTUK MENGIRIM WA & EMAIL <---
    // Kita jalankan di background (.catch) agar tidak membuat pelanggan menunggu loading checkout terlalu lama
    const orderData = { id: orderId, invoice_number: invoiceNumber, total_amount: grand_total };
    const customerData = { fullname: address.recipient_name, phone: address.phone, email: userEmail };
    
    Notifier.sendNewOrderNotification(db, orderData, customerData, cart_items)
      .catch(err => console.error("Gagal mengirim WA/Email dari background:", err));

    return res.status(201).json({
      success: true,
      orderId: orderId,
      message: "Pesanan berhasil dibuat, menunggu pembayaran pelanggan."
    });

  } catch (error) {
    await connection.rollback();
    console.error("Error Checkout API:", error);
    return res.status(500).json({ success: false, message: "Terjadi kesalahan internal server." });
  } finally {
    connection.release();
  }
});

// =======================================================================
// HELPER 2: STANDARDISASI LAYANAN SEMUA KURIR UNTUK BITESHIP (REVISI FINAL)
// =======================================================================
const mapCourierService = (courierCode, serviceName) => {
  if (!serviceName) return "";
  const s = serviceName.toLowerCase();
  
  switch (courierCode) {
    case "jne":
      if (s.includes("reg")) return "reg";
      if (s.includes("oke")) return "oke";
      if (s.includes("yes")) return "yes";
      if (s.includes("jtr") || s.includes("trucking") || s.includes("cargo")) return "jtr";
      return "reg";

    case "jnt":
    case "j&t":
    case "j&texpress":
      if (s.includes("ez") || s.includes("reguler") || s.includes("reg")) return "ez";
      if (s.includes("eco")) return "eco";
      if (s.includes("super")) return "super";
      return "ez";

    case "sicepat":
      if (s.includes("halu")) return "halu";
      if (s.includes("gokil") || s.includes("cargo")) return "gokil";
      if (s.includes("best")) return "best";
      if (s.includes("reg") || s.includes("sicepat")) return "reg";
      return "reg";

    case "pos":
    case "posindonesia":
      if (s.includes("q9")) return "q9_same_day";
      if (s.includes("same")) return "same_day";
      if (s.includes("next")) return "next_day";
      if (s.includes("jumbo")) return "jumbo_ekonomi";
      return "kilat_khusus";

    case "tiki":
      if (s.includes("reg")) return "reg";
      if (s.includes("ons")) return "ons";
      if (s.includes("eco")) return "eco";
      return "reg";

    case "ninja":
    case "ninjaxpress":
      if (s.includes("standard") || s.includes("reg")) return "standard";
      if (s.includes("fast")) return "fast";
      return "standard";

    case "anteraja":
      // PERBAIKAN: Menggunakan underscore sesuai doc Biteship
      if (s.includes("reg")) return "reg";
      if (s.includes("next") || s.includes("ndc")) return "next_day"; 
      if (s.includes("same") || s.includes("hari ini")) return "same_day"; 
      if (s.includes("eco")) return "eco";
      return "reg";

    case "lion":
    case "lionparcel":
      if (s.includes("regpack") || s.includes("reg")) return "regpack";
      if (s.includes("onepack") || s.includes("besok")) return "onepack";
      if (s.includes("jpack") || s.includes("jago")) return "jpack";
      if (s.includes("bosspack")) return "bosspack";
      return "regpack";

    case "wahana":
    case "wahanaprestasilogistik":
      if (s.includes("normal") || s.includes("reg")) return "normal";
      if (s.includes("next")) return "nextday";
      return "normal";

    case "sap":
    case "sapexpress":
      if (s.includes("reg")) return "reg";
      if (s.includes("sameday") || s.includes("hari ini")) return "uds";
      return "reg";

    case "paxel":
      // PERBAIKAN: Paxel di Biteship menuntut ukuran, bukan kecepatan
      if (s.includes("small")) return "small";
      if (s.includes("large")) return "large";
      if (s.includes("custom")) return "custom";
      return "medium"; // Fallback mutlak jika frontend hanya mengirim teks "sameday"

    case "ide":
    case "idexpress":
      if (s.includes("lite") || s.includes("setengah")) return "lite";
      if (s.includes("reg") || s.includes("standard")) return "standard";
      if (s.includes("sameday")) return "sameday"; 
      return "standard";
  }

  return s.trim().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_');
};

// =======================================================================
// ENDPOINT: REQUEST PICKUP (ORDER CREATION) KE BITESHIP - MODE INSTAN
// =======================================================================
app.post("/api/orders/:id/book-shipping", async (req, res) => {
  try {
    const orderId = req.params.id;
    
    // PENJELASAN DOKUMENTASI: 
    // Variabel delivery_date dan delivery_time beserta blok validasinya 
    // telah dihapus sepenuhnya karena sistem sekarang menggunakan metode 
    // pemanggilan kurir instan (sekarang).

    const [orders] = await db.query(
      "SELECT o.*, u.fullname as customer_name, u.email as customer_email FROM orders o JOIN users u ON o.user_id = u.id WHERE o.id = ?",
      [orderId],
    );
    if (orders.length === 0) {
      return res.status(404).json({ success: false, message: "Pesanan tidak ditemui." });
    }

    const order = orders[0];

    // Pencegah Booking Ganda
    if (order.biteship_order_id) {
      return res.status(400).json({
        success: false,
        message: "Pesanan ini sudah pernah di-booking sebelumnya. Resi sudah terbit.",
      });
    }

    const [items] = await db.query(
      "SELECT * FROM order_items WHERE order_id = ?",
      [orderId],
    );

    const [settings] = await db.query(
      "SELECT setting_key, setting_value FROM settings WHERE setting_key IN ('biteship_api_key', 'shop_name', 'shop_phone', 'shop_address', 'store_area_id')"
    );

    let shopConfig = {};
    settings.forEach((s) => (shopConfig[s.setting_key] = s.setting_value));

    // Analisa dan Mapping Kurir
    let safeCourierCode = order.courier_name.toLowerCase().replace(/\s+/g, '');
    if (safeCourierCode.includes("j&t") || safeCourierCode.includes("jnt")) safeCourierCode = "jnt";
    if (safeCourierCode.includes("pos")) safeCourierCode = "pos";
    if (safeCourierCode.includes("ninja")) safeCourierCode = "ninja";

    const formattedService = mapCourierService(safeCourierCode, order.courier_service);

    const payload = {
      shipper_contact_name: shopConfig.shop_name || "Admin",
      shipper_contact_phone: shopConfig.shop_phone || "08000000000",
      origin_contact_name: shopConfig.shop_name || "Admin",
      origin_contact_phone: shopConfig.shop_phone || "08000000000",
      origin_address: shopConfig.shop_address || "Alamat Toko",
      origin_area_id: shopConfig.store_area_id,

      destination_contact_name: order.recipient_name,
      destination_contact_phone: order.phone,
      destination_address: `${order.full_address}, ${order.city_name}, ${order.province_name}`,
      destination_postal_code: parseInt(order.postal_code, 10) || undefined,
      destination_area_id: order.city_id || undefined,

      courier_company: safeCourierCode,
      courier_type: formattedService,   

      // Memaksa parameter waktu menjadi sekarang (instan)
      delivery_type: "now",
      origin_collection_method: "pickup",

      items: items.map((item) => ({
        name: item.product_name,
        value: Number(item.price),
        quantity: Number(item.quantity),
        weight: Number(item.weight || 200),
      })),
    };

    const biteshipHeaders = {
      Authorization: `Bearer ${shopConfig.biteship_api_key}`,
      "Content-Type": "application/json",
    };

    const biteshipUrl = process.env.BITESHIP_BASE_URL;
    let response;

    try {
      response = await axios.post(`${biteshipUrl}/v1/orders`, payload, {
        headers: biteshipHeaders,
      });
    } catch (error) {
      const errorData = error.response?.data || error.message || "Unknown Error";
      
      if (errorData.code === 40002031) {
        try {
          payload.origin_collection_method = "drop_off";
          await new Promise((resolve) => setTimeout(resolve, 1000));
          response = await axios.post(`${biteshipUrl}/v1/orders`, payload, {
            headers: biteshipHeaders,
          });
        } catch (fallbackError) {
           return res.status(500).json({
            success: false,
            message: "Kurir tidak support pickup, dan gagal mencoba metode Drop-off.",
            raw_error: fallbackError.response?.data || fallbackError.message
          });
        }
      } else {
        return res.status(500).json({
          success: false,
          message: "API Biteship menolak payload data. Cek Inspect Element > Network.",
          raw_error: errorData,
          payload_sent: payload
        });
      }
    }

    const biteshipData = response.data;
    const awbNumber = biteshipData.courier.waybill_id;
    const biteshipOrderId = biteshipData.id;
    const waybillUrl = biteshipData.courier.waybill_url;

    try {
      await db.query(
        "UPDATE orders SET airway_bill = ?, biteship_order_id = ?, waybill_url = ?, status = 'shipping' WHERE id = ?",
        [awbNumber, biteshipOrderId, waybillUrl, orderId],
      );
    } catch (dbError) {
      return res.status(500).json({
        success: false,
        message: "Biteship sukses, tapi gagal simpan status ke Database internal.",
        raw_error: dbError.message
      });
    }

    const waMessage = `Halo *${order.customer_name}*,\n\nKabar gembira! Pesananmu dengan Invoice *${order.invoice_number}* sudah kami proses dan sedang dalam tahap pengiriman menggunakan kurir *${payload.courier_company.toUpperCase()}*.\n\nNomor Resi: *${awbNumber}*\n\nTerima kasih telah berbelanja di toko kami!`;
    
    // PERBAIKAN: Mencegah error jika fungsi sendFonnteWA sudah dihapus
    try {
      if (typeof sendFonnteWA === 'function') {
        sendFonnteWA(order.phone, waMessage).catch(() => {});
      } else {
        console.log("Notifikasi WA dilewati karena skrip lama sudah dihapus.");
      }
    } catch (waError) {
      console.error("Error pada notifikasi WA:", waError.message);
    }

    const statusMessage =
      payload.origin_collection_method === "drop_off"
        ? "Booking sukses (Mode Drop-off). Resi terbit, harap cetak resi dan antarkan paket ke gerai terdekat."
        : "Booking sukses. Resi otomatis terbit, kurir akan segera menjemput paket.";

    return res.status(200).json({
      success: true,
      message: statusMessage,
      data: { airway_bill: awbNumber, waybill_url: waybillUrl },
    });
  } catch (error) {
    const errorMessage = error.response?.data?.error || error.message || "Gagal mendapatkan resi otomatis dari Biteship.";
    return res.status(500).json({
      success: false,
      message: errorMessage,
    });
  }
});

// =======================================================================
// ENDPOINT: PENCARIAN AREA BITESIHP
// =======================================================================
app.get("/api/logistic/search-area", async (req, res) => {
  try {
    const { keyword } = req.query;
    if (!keyword || keyword.length < 3) {
      return res
        .status(400)
        .json({ success: false, message: "Ketik minimal 3 huruf." });
    }

    const [settings] = await db.query(
      "SELECT setting_value FROM settings WHERE setting_key = 'biteship_api_key'",
    );
    const apiKey = settings[0]?.setting_value;

    if (!apiKey) {
      return res
        .status(400)
        .json({ success: false, message: "API Key tidak ada." });
    }

    const biteshipUrl = process.env.BITESHIP_BASE_URL;

    const response = await axios.get(
      `${biteshipUrl}/v1/maps/areas?countries=ID&input=${keyword}&type=single`,
      { headers: { Authorization: apiKey } },
    );

    res.status(200).json({ success: true, data: response.data.areas });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal memuat area." });
  }
});

// =======================================================================
// ENDPOINT: PENGATURAN TOKO MASSAL (SETTINGS)
// =======================================================================
app.get("/api/settings", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT setting_key, setting_value FROM settings",
    );
    const settingsObject = {};
    rows.forEach((row) => {
      settingsObject[row.setting_key] = row.setting_value;
    });
    return res.status(200).json({ success: true, data: settingsObject });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Terjadi kesalahan server." });
  }
});

app.put("/api/settings", async (req, res) => {
  try {
    const settingsData = req.body;
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
    return res
      .status(500)
      .json({ success: false, message: "Gagal menyimpan pengaturan." });
  }
});

// =======================================================================
// ENDPOINT: STAF & TIM PANEL (ADMINS)
// =======================================================================
app.get("/api/admins", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id, fullname, email, role, created_at FROM admins ORDER BY id DESC",
    );
    return res.status(200).json({ success: true, data: rows });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Terjadi kesalahan server." });
  }
});

app.post("/api/admins", async (req, res) => {
  try {
    const { fullname, email, password, role } = req.body;
    if (!fullname || !email || !password)
      return res
        .status(400)
        .json({ success: false, message: "Semua kolom wajib diisi." });

    const [existing] = await db.query("SELECT id FROM admins WHERE email = ?", [
      email,
    ]);
    if (existing.length > 0)
      return res.status(400).json({
        success: false,
        message: "Email sudah terdaftar sebagai admin.",
      });

    const hashedPassword = await bcrypt.hash(password, 10);
    await db.query(
      "INSERT INTO admins (fullname, email, password, role) VALUES (?, ?, ?, ?)",
      [fullname, email, hashedPassword, role || "Editor"],
    );
    return res
      .status(201)
      .json({ success: true, message: "Akun admin baru berhasil dibuat!" });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Gagal menyimpan data staf baru." });
  }
});

app.delete("/api/admins/:id", async (req, res) => {
  try {
    if (parseInt(req.params.id) === 1)
      return res.status(400).json({
        success: false,
        message: "Admin Utama (Superadmin) tidak boleh dihapus!",
      });
    await db.query("DELETE FROM admins WHERE id = ?", [req.params.id]);
    return res.status(200).json({
      success: true,
      message: "Akun staf berhasil dihapus dari sistem.",
    });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Gagal menghapus staf." });
  }
});

app.put("/api/admins/profile", async (req, res) => {
  try {
    const { id, fullname, currentPassword, newPassword } = req.body;
    if (!id || !fullname)
      return res
        .status(400)
        .json({ success: false, message: "Data ID dan Nama wajib diisi." });

    const [admin] = await db.query("SELECT password FROM admins WHERE id = ?", [
      id,
    ]);
    if (admin.length === 0)
      return res
        .status(404)
        .json({ success: false, message: "Akun tidak ditemukan." });

    let queryUpdate = "UPDATE admins SET fullname = ?";
    const params = [fullname];

    if (currentPassword && newPassword) {
      const isMatch = await bcrypt.compare(currentPassword, admin[0].password);
      if (!isMatch)
        return res.status(400).json({
          success: false,
          message: "Kata sandi lama yang Anda masukkan salah!",
        });
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
    return res
      .status(500)
      .json({ success: false, message: "Terjadi kesalahan server." });
  }
});

app.post("/api/admin/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const [rows] = await db.query("SELECT * FROM admins WHERE email = ?", [
      email,
    ]);
    if (rows.length === 0)
      return res
        .status(401)
        .json({ success: false, message: "Email tidak terdaftar!" });
    const isMatch = await bcrypt.compare(password, rows[0].password);
    if (!isMatch)
      return res
        .status(401)
        .json({ success: false, message: "Kata sandi salah!" });
    const token = jwt.sign(
      { id: rows[0].id, role: rows[0].role },
      process.env.JWT_SECRET || "chester_secret_key_123",
      { expiresIn: "1d" },
    );
    res.json({
      success: true,
      message: "Login Berhasil!",
      token,
      admin: {
        id: rows[0].id,
        fullname: rows[0].fullname,
        email: rows[0].email,
        role: rows[0].role,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

// =======================================================================
// ENDPOINT: MANAJEMEN VOUCHER (VOUCHERS)
// =======================================================================
app.get("/api/vouchers", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM vouchers ORDER BY created_at DESC",
    );
    return res.status(200).json({ success: true, data: rows });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Terjadi kesalahan server." });
  }
});

app.post("/api/vouchers", async (req, res) => {
  try {
    const {
      code,
      name,
      discount_type,
      discount_value,
      max_discount,
      min_purchase,
      target_buyer,
      is_claimable,
      is_auto_apply,
      is_active,
      quota,
      start_date,
      end_date,
    } = req.body;
    const [existing] = await db.query(
      "SELECT id FROM vouchers WHERE code = ?",
      [code],
    );
    if (existing.length > 0)
      return res
        .status(400)
        .json({ success: false, message: "Kode voucher ini sudah digunakan." });

    await db.query(
      `INSERT INTO vouchers (code, name, discount_type, discount_value, max_discount, min_purchase, target_buyer, is_claimable, is_auto_apply, is_active, quota, start_date, end_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        code.toUpperCase(),
        name,
        discount_type,
        discount_value,
        max_discount || 0,
        min_purchase || 0,
        target_buyer || "all",
        is_claimable || false,
        is_auto_apply || false,
        is_active !== undefined ? is_active : true,
        quota || 0,
        start_date,
        end_date,
      ],
    );
    return res
      .status(201)
      .json({ success: true, message: "Voucher baru berhasil ditambahkan!" });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Gagal menyimpan data voucher." });
  }
});

app.put("/api/vouchers/:id/status", async (req, res) => {
  try {
    await db.query("UPDATE vouchers SET is_active = ? WHERE id = ?", [
      req.body.is_active,
      req.params.id,
    ]);
    return res
      .status(200)
      .json({ success: true, message: "Status voucher berhasil diperbarui." });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Gagal memproses permintaan." });
  }
});

app.put("/api/vouchers/:id", async (req, res) => {
  try {
    const {
      name,
      discount_type,
      discount_value,
      max_discount,
      min_purchase,
      target_buyer,
      is_claimable,
      is_auto_apply,
      quota,
      start_date,
      end_date,
    } = req.body;
    await db.query(
      `UPDATE vouchers SET name = ?, discount_type = ?, discount_value = ?, max_discount = ?, min_purchase = ?, target_buyer = ?, is_claimable = ?, is_auto_apply = ?, quota = ?, start_date = ?, end_date = ? WHERE id = ?`,
      [
        name,
        discount_type,
        discount_value,
        max_discount || 0,
        min_purchase || 0,
        target_buyer || "all",
        is_claimable || false,
        is_auto_apply || false,
        quota || 0,
        start_date,
        end_date,
        req.params.id,
      ],
    );
    return res
      .status(200)
      .json({ success: true, message: "Voucher berhasil diperbarui!" });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Gagal memperbarui voucher." });
  }
});

app.delete("/api/vouchers/:id", async (req, res) => {
  try {
    await db.query("DELETE FROM vouchers WHERE id = ?", [req.params.id]);
    return res
      .status(200)
      .json({ success: true, message: "Voucher berhasil dihapus." });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Gagal menghapus voucher." });
  }
});

// =======================================================================
// ENDPOINT: VOUCHER UNTUK STOREFRONT (PELANGGAN)
// =======================================================================

// 1. Ambil Data Voucher Spesifik untuk User (Digunakan di Halaman Promo & Produk)
app.get("/api/vouchers/storefront/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;

    // A. Ambil semua voucher aktif dan masa berlakunya masih ada
    const [allVouchers] = await db.query(
      "SELECT * FROM vouchers WHERE is_active = 1 AND end_date >= NOW()",
    );

    // B. Ambil ID voucher yang sudah diklaim oleh user ini (dan belum dipakai)
    const [claimed] = await db.query(
      "SELECT voucher_id FROM user_vouchers WHERE user_id = ? AND is_used = FALSE",
      [userId],
    );
    const claimedIds = claimed.map((c) => c.voucher_id);

    // C. Cek apakah user adalah "Pelanggan Baru" (Belum pernah belanja sukses)
    const [orders] = await db.query(
      "SELECT COUNT(id) as total_orders FROM orders WHERE user_id = ? AND status IN ('paid', 'shipping', 'completed')",
      [userId],
    );
    const isNewCustomer = orders[0].total_orders === 0;

    const availablePromos = [];
    const myVouchers = [];

    // Pisahkan voucher ke dalam 2 kategori
    for (const v of allVouchers) {
      // Lewati (skip) voucher jika targetnya pelanggan baru tapi user ini pelanggan lama
      if (v.target_buyer === "new_customer" && !isNewCustomer) continue;

      const hasClaimed = claimedIds.includes(v.id);

      // Kategori 1: Voucher Auto-Apply (Otomatis masuk ke "Voucher Saya")
      if (v.is_auto_apply) {
        myVouchers.push(v);
      }
      // Kategori 2: Voucher yang harus diklaim
      else if (v.is_claimable) {
        if (hasClaimed) {
          myVouchers.push(v); // Sudah diklaim, pindah ke "Voucher Saya"
        } else {
          // Belum diklaim, hitung sisa kuota sebelum masuk ke "Promo Tersedia"
          const [usage] = await db.query(
            "SELECT COUNT(*) as total_claimed FROM user_vouchers WHERE voucher_id = ?",
            [v.id],
          );
          const totalClaimed = usage[0].total_claimed;

          if (v.quota === 0 || totalClaimed < v.quota) {
            // Kita sisipkan info sisa kuota untuk bikin pembeli FOMO (Cepat-cepat klaim)
            availablePromos.push({
              ...v,
              sisa_kuota: v.quota === 0 ? "Banyak" : v.quota - totalClaimed,
            });
          }
        }
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        available_promos: availablePromos, // Untuk Tab 1 (Buru Klaim) & Halaman Produk
        my_vouchers: myVouchers, // Untuk Tab 2 (Siap Pakai) & Checkout
      },
    });
  } catch (error) {
    console.error("Gagal memuat voucher storefront:", error);
    return res
      .status(500)
      .json({ success: false, message: "Terjadi kesalahan server." });
  }
});

// 2. Eksekusi Klaim Voucher oleh Pengguna
app.post("/api/vouchers/claim", async (req, res) => {
  try {
    const { user_id, voucher_id } = req.body;

    if (!user_id || !voucher_id) {
      return res
        .status(400)
        .json({ success: false, message: "Data tidak valid." });
    }

    // A. Cek apakah sudah pernah klaim
    const [existing] = await db.query(
      "SELECT id FROM user_vouchers WHERE user_id = ? AND voucher_id = ?",
      [user_id, voucher_id],
    );

    if (existing.length > 0) {
      return res
        .status(400)
        .json({ success: false, message: "Anda sudah mengklaim voucher ini." });
    }

    // B. Cek kuota akhir sebelum klaim dieksekusi (mencegah bentrok berebut kuota)
    const [voucher] = await db.query(
      "SELECT quota FROM vouchers WHERE id = ?",
      [voucher_id],
    );

    if (voucher[0].quota > 0) {
      const [usage] = await db.query(
        "SELECT COUNT(*) as total_claimed FROM user_vouchers WHERE voucher_id = ?",
        [voucher_id],
      );
      if (usage[0].total_claimed >= voucher[0].quota) {
        return res.status(400).json({
          success: false,
          message: "Maaf, kuota voucher ini sudah habis.",
        });
      }
    }

    // C. Simpan data klaim
    await db.query(
      "INSERT INTO user_vouchers (user_id, voucher_id) VALUES (?, ?)",
      [user_id, voucher_id],
    );

    return res.status(201).json({
      success: true,
      message: "Voucher berhasil diklaim dan siap digunakan!",
    });
  } catch (error) {
    console.error("Gagal klaim voucher:", error);
    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server saat mengklaim.",
    });
  }
});

// =======================================================================
// ENDPOINT: LAYANAN AUTHENTICATION PELANGGAN & PROFIL STOREFRONT
// =======================================================================
app.put("/api/users/:id", upload.single("avatar"), async (req, res) => {
  try {
    const { fullname, phone } = req.body;
    let avatarUrl = req.file ? `/uploads/profiles/${req.file.filename}` : null;
    let query = "UPDATE users SET fullname = ?, phone = ?";
    let values = [fullname, phone || null];
    if (avatarUrl) {
      query += ", avatar = ?";
      values.push(avatarUrl);
    }
    query += " WHERE id = ?";
    values.push(req.params.id);
    await db.query(query, values);
    return res.status(200).json({
      success: true,
      message: "Profil berhasil diperbarui!",
      avatar: avatarUrl,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Gagal memperbarui data profil." });
  }
});

app.post("/api/auth/register", async (req, res) => {
  try {
    const { fullname, email, phone, password } = req.body;
    if (!fullname || !email || !password)
      return res.status(400).json({
        success: false,
        message: "Nama, Email, dan Password wajib diisi!",
      });
    const [existing] = await db.query("SELECT id FROM users WHERE email = ?", [
      email,
    ]);
    if (existing.length > 0)
      return res.status(400).json({
        success: false,
        message: "Email ini sudah terdaftar. Silakan login.",
      });
    const hashedPassword = await bcrypt.hash(password, 10);
    await db.query(
      "INSERT INTO users (fullname, email, phone, password, status) VALUES (?, ?, ?, ?, 'active')",
      [fullname, email, phone || null, hashedPassword],
    );
    return res.status(201).json({
      success: true,
      message: "Pendaftaran akun berhasil! Silakan login.",
    });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Gagal mendaftarkan akun." });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res
        .status(400)
        .json({ success: false, message: "Email dan Password wajib diisi!" });
    const [users] = await db.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);
    if (users.length === 0)
      return res
        .status(401)
        .json({ success: false, message: "Email atau kata sandi salah!" });
    if (users[0].status !== "active")
      return res.status(403).json({
        success: false,
        message: "Akun Anda ditangguhkan. Silakan hubungi Customer Service.",
      });
    const isMatch = await bcrypt.compare(password, users[0].password);
    if (!isMatch)
      return res
        .status(401)
        .json({ success: false, message: "Email atau kata sandi salah!" });
    const token = jwt.sign(
      { id: users[0].id, email: users[0].email, role: "customer" },
      process.env.JWT_SECRET || "chester_secret_key_123",
      { expiresIn: "7d" },
    );
    return res.status(200).json({
      success: true,
      message: "Login berhasil!",
      token,
      user: {
        id: users[0].id,
        fullname: users[0].fullname,
        email: users[0].email,
        phone: users[0].phone,
      },
    });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Terjadi kesalahan pada server." });
  }
});

app.post("/api/auth/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email)
      return res
        .status(400)
        .json({ success: false, message: "Email wajib diisi!" });
    const [users] = await db.query(
      "SELECT id, fullname FROM users WHERE email = ?",
      [email],
    );
    if (users.length === 0)
      return res.status(200).json({
        success: true,
        message: "Jika email terdaftar, instruksi telah dikirim.",
      });

    const resetToken = crypto.randomBytes(32).toString("hex");
    const expireTime = new Date(Date.now() + 3600000);
    await db.query(
      "UPDATE users SET reset_password_token = ?, reset_password_expires = ? WHERE id = ?",
      [resetToken, expireTime, users[0].id],
    );
    const resetUrl = `http://localhost:5173/reset-password/${resetToken}`;

    console.log(
      `\n=== SIMULASI EMAIL LUPA PASSWORD ===\nKepada: ${email}\nLink Reset: ${resetUrl}\n====================================\n`,
    );
    return res.status(200).json({
      success: true,
      message:
        "Jika email terdaftar, instruksi pemulihan kata sandi telah dikirim.",
    });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Terjadi kesalahan server." });
  }
});

// =======================================================================
// ENDPOINT: INTEGRASI BITESHIP & BUKU ALAMAT PINTAR (FIXED)
// =======================================================================

app.get("/api/users/:id/addresses", async (req, res) => {
  try {
    const [addresses] = await db.query(
      "SELECT * FROM addresses WHERE user_id = ? ORDER BY is_primary DESC, id DESC",
      [req.params.id],
    );
    res.status(200).json({ success: true, data: addresses });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal memuat alamat." });
  }
});

app.post("/api/users/:id/addresses", async (req, res) => {
  try {
    const userId = req.params.id;
    const {
      label,
      recipient_name,
      phone,
      province_id,
      province_name,
      city_id,
      city_name,
      postal_code,
      full_address,
    } = req.body;
    const [existing] = await db.query(
      "SELECT id FROM addresses WHERE user_id = ?",
      [userId],
    );
    const isPrimary = existing.length === 0 ? 1 : 0;

    await db.query(
      `INSERT INTO addresses (user_id, label, recipient_name, phone, province_id, province_name, city_id, city_name, postal_code, full_address, is_primary) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        label,
        recipient_name,
        phone,
        province_id,
        province_name,
        city_id,
        city_name,
        postal_code,
        full_address,
        isPrimary,
      ],
    );
    res
      .status(201)
      .json({ success: true, message: "Alamat berhasil disimpan!" });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Gagal menyimpan alamat." });
  }
});

app.put("/api/users/:id/addresses/:addressId/primary", async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    await connection.query(
      "UPDATE addresses SET is_primary = 0 WHERE user_id = ?",
      [req.params.id],
    );
    await connection.query(
      "UPDATE addresses SET is_primary = 1 WHERE id = ? AND user_id = ?",
      [req.params.addressId, req.params.id],
    );
    await connection.commit();
    res
      .status(200)
      .json({ success: true, message: "Alamat utama berhasil diubah!" });
  } catch (error) {
    await connection.rollback();
    res
      .status(500)
      .json({ success: false, message: "Gagal mengubah alamat utama." });
  } finally {
    connection.release();
  }
});

app.delete("/api/users/:id/addresses/:addressId", async (req, res) => {
  try {
    await db.query("DELETE FROM addresses WHERE id = ? AND user_id = ?", [
      req.params.addressId,
      req.params.id,
    ]);
    res.status(200).json({ success: true, message: "Alamat dihapus." });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Gagal menghapus alamat." });
  }
});

// =======================================================================
// 1. ENDPOINT: BUAT ULASAN BARU (PELANGGAN)
// =======================================================================
app.post("/api/reviews", async (req, res) => {
  try {
    const { order_id, product_id, user_id, rating, comment, variant_name } = req.body;

    if (!order_id || !product_id || !user_id || !rating) {
      return res.status(400).json({ success: false, message: "Data ulasan tidak lengkap!" });
    }

    const [orderCheck] = await db.query(
      "SELECT status FROM orders WHERE id = ?",
      [order_id],
    );
    if (orderCheck.length === 0 || orderCheck[0].status !== "completed") {
      return res.status(400).json({
        success: false,
        message: "Ulasan hanya dapat diberikan untuk pesanan yang sudah selesai.",
      });
    }

    const [existing] = await db.query(
      "SELECT id FROM product_reviews WHERE order_id = ? AND product_id = ? AND user_id = ?",
      [order_id, product_id, user_id],
    );
    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Anda sudah memberikan ulasan untuk produk ini. Silakan gunakan fitur Edit.",
      });
    }

    const [settings] = await db.query(
      "SELECT setting_value FROM settings WHERE setting_key = 'profanity_filter_words'",
    );
    const badWords = settings.length > 0 ? settings[0].setting_value : "";
    
    // Asumsi fungsi filterProfanity sudah didefinisikan sebelumnya di kodemu
    const filteredComment = filterProfanity(comment, badWords);

    // ---> PERBAIKAN: Tangkap insertId dari eksekusi simpan ulasan
    const [reviewResult] = await db.query(
      "INSERT INTO product_reviews (order_id, product_id, user_id, rating, comment, variant_name) VALUES (?, ?, ?, ?, ?, ?)",
      [
        order_id,
        product_id,
        user_id,
        rating,
        filteredComment || null,
        variant_name || null,
      ],
    );
    
    const newReviewId = reviewResult.insertId;

    const [ratingResult] = await db.query(
      "SELECT AVG(rating) as average_rating, COUNT(id) as total_reviews FROM product_reviews WHERE product_id = ?",
      [product_id],
    );

    const avgRating = ratingResult[0].average_rating || 0;
    const totalReviews = ratingResult[0].total_reviews || 0;

    await db.query(
      "UPDATE products SET rating = ?, review_count = ? WHERE id = ?",
      [Number(avgRating).toFixed(1), totalReviews, product_id],
    );

    // ---> PERBAIKAN: Gunakan Helper Notifikasi untuk SEMUA ulasan
    let notifMessage = `Pesanan #${order_id} mendapat ulasan baru (${rating} Bintang).`;
    
    // Pesan khusus jika rating buruk
    if (rating <= 2) {
      notifMessage = `Peringatan: Pesanan #${order_id} mendapat ulasan buruk (${rating} Bintang). Segera cek keluhan pelanggan!`;
    }

    await createAdminNotification(
      "new_review",
      newReviewId, 
      notifMessage
    );

    return res.status(201).json({
      success: true,
      message: "Terima kasih! Ulasan Anda berhasil disimpan.",
    });
  } catch (error) {
    console.error("Gagal menyimpan ulasan:", error);
    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server saat menyimpan ulasan.",
    });
  }
});

// =======================================================================
// 2. ENDPOINT: EDIT ULASAN (PELANGGAN)
// =======================================================================
app.put("/api/reviews/:id", async (req, res) => {
  try {
    const reviewId = req.params.id;
    const { rating, comment } = req.body;

    // Terapkan kembali filter kata kotor saat diedit
    const [settings] = await db.query(
      "SELECT setting_value FROM settings WHERE setting_key = 'profanity_filter_words'",
    );
    const badWords = settings.length > 0 ? settings[0].setting_value : "";
    const filteredComment = filterProfanity(comment, badWords);

    await db.query(
      "UPDATE product_reviews SET rating = ?, comment = ? WHERE id = ?",
      [rating, filteredComment || null, reviewId],
    );

    return res
      .status(200)
      .json({ success: true, message: "Ulasan berhasil diperbarui!" });
  } catch (error) {
    console.error("Gagal update ulasan:", error);
    return res
      .status(500)
      .json({ success: false, message: "Terjadi kesalahan server." });
  }
});

// =======================================================================
// 3. ENDPOINT: AMBIL SEMUA ULASAN DENGAN PAGINATION (ADMIN)
// =======================================================================
app.get("/api/admin/reviews", async (req, res) => {
  try {
    // Logika Pagination Server-Side
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Hitung total keseluruhan data
    const [totalRows] = await db.query(
      "SELECT COUNT(*) as count FROM product_reviews",
    );
    const totalRecords = totalRows[0].count;
    const totalPages = Math.ceil(totalRecords / limit);

    // Ambil data ulasan (Digabung dengan nama produk, nama pelanggan, dan nomor invoice)
    const [reviews] = await db.query(
      `SELECT r.*, p.name as product_name, u.fullname as customer_name, o.invoice_number 
       FROM product_reviews r
       JOIN products p ON r.product_id = p.id
       JOIN users u ON r.user_id = u.id
       JOIN orders o ON r.order_id = o.id
       ORDER BY r.created_at DESC
       LIMIT ? OFFSET ?`,
      [limit, offset],
    );

    return res.status(200).json({
      success: true,
      data: reviews,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalRecords: totalRecords,
      },
    });
  } catch (error) {
    console.error("Gagal mengambil ulasan untuk admin:", error);
    return res
      .status(500)
      .json({ success: false, message: "Terjadi kesalahan server." });
  }
});

// =======================================================================
// 4. ENDPOINT: ADMIN MEMBALAS ULASAN
// =======================================================================
app.put("/api/admin/reviews/:id/reply", async (req, res) => {
  try {
    const reviewId = req.params.id;
    const { admin_reply } = req.body;

    await db.query("UPDATE product_reviews SET admin_reply = ? WHERE id = ?", [
      admin_reply || null,
      reviewId,
    ]);

    return res.status(200).json({
      success: true,
      message: "Balasan Anda berhasil dikirim ke pelanggan!",
    });
  } catch (error) {
    console.error("Gagal membalas ulasan:", error);
    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server saat membalas.",
    });
  }
});

// =======================================================================
// ENDPOINT: WISHLIST (DAFTAR KESUKAAN)
// =======================================================================

// 1. Tambah Produk ke Wishlist
app.post("/api/wishlists", async (req, res) => {
  try {
    const { user_id, product_id } = req.body;
    if (!user_id || !product_id) {
      return res
        .status(400)
        .json({ success: false, message: "Data tidak lengkap." });
    }

    // Evaluasi: Cek apakah produk sudah ada di wishlist (Mencegah data ganda/duplikat)
    const [existing] = await db.query(
      "SELECT id FROM wishlists WHERE user_id = ? AND product_id = ?",
      [user_id, product_id],
    );

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Produk ini sudah ada di daftar Wishlist Anda.",
      });
    }

    // Jika belum ada, masukkan ke database
    await db.query(
      "INSERT INTO wishlists (user_id, product_id) VALUES (?, ?)",
      [user_id, product_id],
    );

    return res.status(201).json({
      success: true,
      message: "Produk berhasil ditambahkan ke Wishlist!",
    });
  } catch (error) {
    console.error("Gagal menambah wishlist:", error);
    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server saat menyimpan wishlist.",
    });
  }
});

// 2. Ambil Daftar Wishlist Milik Pelanggan Spesifik
app.get("/api/users/:id/wishlists", async (req, res) => {
  try {
    const userId = req.params.id;

    // DIPERBARUI: Menambahkan p.slug, LEFT JOIN ke product_variants, dan MIN(pv.price)
    const [rows] = await db.query(
      `
      SELECT 
        w.id as wishlist_id, 
        p.id as product_id, 
        p.name, 
        p.slug, 
        p.price, 
        p.status, 
        p.has_variant,
        (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as primary_image,
        MIN(pv.price) as min_v_price
      FROM wishlists w
      JOIN products p ON w.product_id = p.id
      LEFT JOIN product_variants pv ON p.id = pv.product_id
      WHERE w.user_id = ?
      GROUP BY w.id, p.id
      ORDER BY w.created_at DESC
    `,
      [userId],
    );

    return res.status(200).json({ success: true, data: rows });
  } catch (error) {
    console.error("Gagal mengambil wishlist:", error);
    return res
      .status(500)
      .json({ success: false, message: "Terjadi kesalahan server." });
  }
});

// 3. Hapus Produk dari Wishlist
app.delete("/api/wishlists/:id", async (req, res) => {
  try {
    const wishlistId = req.params.id;
    await db.query("DELETE FROM wishlists WHERE id = ?", [wishlistId]);
    return res.status(200).json({
      success: true,
      message: "Produk berhasil dihapus dari Wishlist.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server saat menghapus.",
    });
  }
});

// =======================================================================
// ENDPOINT: KERANJANG BELANJA (CART)
// =======================================================================

// 1. Ambil Semua Item Keranjang User (Telah Diperbarui untuk Harga Coret)
app.get("/api/carts/:userId", async (req, res) => {
  try {
    const [rows] = await db.query(
      `
      SELECT c.*, p.name, 
      p.price as base_price, p.original_price as base_original_price,
      (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as image,
      v.variant_key, 
      v.price as variant_price, v.original_price as variant_original_price
      FROM carts c
      JOIN products p ON c.product_id = p.id
      LEFT JOIN product_variants v ON c.variant_id = v.id
      WHERE c.user_id = ?
    `,
      [req.params.userId],
    );

    res.json({ success: true, data: rows });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Gagal mengambil keranjang." });
  }
});

// 2. Tambah Item ke Keranjang
app.post("/api/carts", async (req, res) => {
  try {
    const { user_id, product_id, variant_id, quantity } = req.body;
    await db.query(
      "INSERT INTO carts (user_id, product_id, variant_id, quantity) VALUES (?, ?, ?, ?)",
      [user_id, product_id, variant_id, quantity],
    );
    res.json({ success: true, message: "Berhasil ditambah ke keranjang." });
  } catch (err) {
    res.status(500).json({ success: false, message: "Gagal menambah item." });
  }
});

// 3. Hapus Item Keranjang
app.delete("/api/carts/:id", async (req, res) => {
  try {
    await db.query("DELETE FROM carts WHERE id = ?", [req.params.id]);
    res.json({ success: true, message: "Item dihapus." });
  } catch (err) {
    res.status(500).json({ success: false, message: "Gagal menghapus." });
  }
});

// =======================================================================
// ENDPOINT: HITUNG ONGKIR BITESHIP (DINAMIS & BEBAS HARDCODE)
// =======================================================================
app.post("/api/shipping-cost", async (req, res) => {
  try {
    const { city_id, total_weight, courier, cart_items, cart_value } = req.body;

    if (!city_id) {
      return res.status(400).json({
        success: false,
        message: "Area tujuan (city_id) wajib diisi.",
      });
    }

    const [settings] = await db.query(
      "SELECT setting_key, setting_value FROM settings WHERE setting_key IN ('biteship_api_key', 'store_area_id', 'active_couriers')",
    );

    let biteshipKey = "";
    // PERBAIKAN: Gunakan BITESHIP_BASE_URL dan gabungkan dengan endpoint-nya
    let biteshipUrl = `${process.env.BITESHIP_BASE_URL}/v1/rates/couriers`;
    let originAreaId = "";
    let activeCouriers = "";

    settings.forEach((setting) => {
      if (setting.setting_key === "biteship_api_key") biteshipKey = setting.setting_value;
      if (setting.setting_key === "store_area_id") originAreaId = setting.setting_value;
      if (setting.setting_key === "active_couriers") activeCouriers = setting.setting_value;
    });

    if (!biteshipKey) {
      return res.status(500).json({
        success: false,
        message: "API Key Biteship belum dikonfigurasi di ENV / Admin.",
      });
    }

    if (!activeCouriers) {
      return res.status(400).json({
        success: false,
        message: "Belum ada ekspedisi yang diaktifkan di panel Admin.",
      });
    }

    const finalCouriers = (courier || activeCouriers).toLowerCase();

    if (!originAreaId) {
      return res.status(500).json({
        success: false,
        message: "Area ID Toko (Origin) belum dikonfigurasi di Pengaturan Admin.",
      });
    }

    const payloadItems =
      cart_items && cart_items.length > 0
        ? cart_items.map((item) => ({
            name: item.name,
            description: `Varian: ${item.variant || "Standar"}`,
            value: Number(item.price),
            length: 20,
            width: 15,
            height: 5,
            weight: Number(item.weight || 200),
            quantity: Number(item.qty),
          }))
        : [
            {
              name: "Paket Pesanan",
              description: "Barang pesanan customer",
              value: Number(cart_value || 10000),
              length: 20,
              width: 15,
              height: 5,
              weight: Number(total_weight > 0 ? total_weight : 200),
              quantity: 1,
            },
          ];

    const payload = {
      origin_area_id: originAreaId,
      destination_area_id: city_id,
      couriers: finalCouriers,
      items: payloadItems,
    };

    console.log("PAYLOAD KE BITESHIP:", JSON.stringify(payload, null, 2));

    const response = await axios.post(biteshipUrl, payload, {
      headers: {
        Authorization: `Bearer ${biteshipKey}`,
        "Content-Type": "application/json",
      },
    });

    if (response.data && response.data.pricing) {
      const options = response.data.pricing.map((rate) => ({
        service: `${rate.courier_name} ${rate.courier_service_name}`,
        cost: rate.price,
        etd: rate.duration,
      }));
      return res.json({ success: true, data: options });
    } else {
      return res.status(400).json({ success: false, message: "Gagal memproses tarif kurir." });
    }
  } catch (err) {
    console.error("Biteship Error Response:", err.response?.data || err.message);
    return res.status(err.response?.status || 500).json({
      success: false,
      message: err.response?.data?.error || "Kesalahan server saat hitung ongkir.",
    });
  }
});

// =======================================================================
// ENDPOINT: PENCARIAN AREA BITESHIP (UNTUK SETTINGS & CHECKOUT)
// =======================================================================
app.get("/api/shipping/areas", async (req, res) => {
  try {
    const { search } = req.query;

    if (!search || search.length < 3) {
      return res.json({ success: true, data: [] });
    }

    const [settings] = await db.query(
      "SELECT setting_value FROM settings WHERE setting_key = 'biteship_api_key'",
    );
    // PERBAIKAN: Validasi jika settings kosong
    const apiKey = settings.length > 0 ? settings[0].setting_value : null;

    if (!apiKey) {
      return res.status(400).json({
        success: false,
        message: "API Key Biteship belum dikonfigurasi.",
      });
    }

    // PERBAIKAN: Cek apakah variabel .env terbaca
    if (!process.env.BITESHIP_BASE_URL) {
       console.warn("⚠️ BITESHIP_BASE_URL tidak ditemukan di file .env. Menggunakan default.");
    }
    const biteshipUrl = process.env.BITESHIP_BASE_URL || "https://api.biteship.com";

    const response = await axios.get(
      `${biteshipUrl}/v1/maps/areas?countries=ID&input=${search}&type=single`,
      { headers: { Authorization: `Bearer ${apiKey}` } },
    );

    const areas = response.data.areas.map((area) => {
      const areaName = [
        area.name,
        area.administrative_division_level_3_name,
        area.administrative_division_level_2_name,
        area.administrative_division_level_1_name,
      ]
        .filter(Boolean)
        .join(", ");

      return {
        id: area.id,
        name: areaName,
        postal_code: area.postal_code || "",
        province_name: area.administrative_division_level_1_name || "",
        city_name: area.administrative_division_level_2_name || "",
      };
    });

    res.json({ success: true, data: areas });
  } catch (error) {
    console.error("Error dari Biteship API:", error.response?.data || error.message);
    res.status(500).json({ success: false, message: "Gagal mencari area ke Biteship." });
  }
});

// =======================================================================
// ENDPOINT: AMBIL DAFTAR KURIR RESMI DARI BITESHIP
// =======================================================================
app.get("/api/shipping/couriers", async (req, res) => {
  try {
    const [settings] = await db.query(
      "SELECT setting_value FROM settings WHERE setting_key = 'biteship_api_key'",
    );
    // PERBAIKAN: Validasi jika settings kosong
    const apiKey = settings.length > 0 ? settings[0].setting_value : null;

    if (!apiKey) {
      return res.status(400).json({
        success: false,
        message: "API Key Biteship belum dikonfigurasi di Admin.",
      });
    }

    // PERBAIKAN: Cek apakah variabel .env terbaca
    if (!process.env.BITESHIP_BASE_URL) {
       console.warn("⚠️ BITESHIP_BASE_URL tidak ditemukan di file .env. Menggunakan default.");
    }
    const biteshipUrl = process.env.BITESHIP_BASE_URL || "https://api.biteship.com";

    const response = await axios.get(`${biteshipUrl}/v1/couriers`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    return res.status(200).json({
      success: true,
      data: response.data.couriers,
    });
  } catch (error) {
    console.error("Gagal menarik data kurir:", error.response?.data || error.message);
    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server saat menghubungi API Biteship.",
    });
  }
});

// =======================================================================
// ENDPOINT: WEBHOOK DARI BITESHIP (Menerima Update Status & Resi)
// =======================================================================
app.post("/api/webhook/biteship", async (req, res) => {
  try {
    // ---> TAMBAHAN KEAMANAN: Validasi Signature dari Biteship
    // Menangkap kunci rahasia yang dikirim oleh Biteship di header
    const biteshipSignature = req.headers["x-biteship-signature"];
    // Mengambil kunci rahasia asli dari file .env kita
    const mySecret = process.env.BITESHIP_SECRET;

    // Jika kata sandi tidak cocok atau kosong, langsung tolak aksesnya!
    if (biteshipSignature !== mySecret) {
      console.warn("⚠️ Akses Webhook Ditolak: Signature tidak valid!");
      return res
        .status(401)
        .json({ success: false, message: "Akses ditolak (Unauthorized)" });
    }
    // <--- AKHIR TAMBAHAN KEAMANAN

    const webhookData = req.body || {};

    // 1. PENANGANAN PING INSTALASI DARI BITESHIP
    if (!webhookData.event) {
      console.log("Menerima Ping Validasi Webhook dari Biteship");
      return res
        .status(200)
        .json({ success: true, message: "Webhook URL valid" });
    }

    console.log(
      `MENDAPATKAN WEBHOOK (Event: ${webhookData.event}, Status: ${webhookData.status})`,
    );

    // 2. PROSES UPDATE STATUS & RESI
    if (webhookData.event === "order.status") {
      const biteshipOrderId = webhookData.order_id;
      const newStatus = webhookData.status;

      // Menangkap resi dan URL resi jika sudah diterbitkan oleh kurir
      const resiBaru = webhookData.courier
        ? webhookData.courier.waybill_id
        : null;
      const urlResiBaru = webhookData.courier
        ? webhookData.courier.waybill_url
        : null;

      // Mapping status dari Biteship ke status lokal kita
      let localStatus = "shipping";
      if (newStatus === "delivered") {
        localStatus = "completed";
      } else if (newStatus === "cancelled" || newStatus === "rejected") {
        localStatus = "cancelled";
      }

      // 3. SIMPAN KE DATABASE & PICU NOTIFIKASI PENGIRIMAN
      if (resiBaru) {
        // A. Perbarui data resi di database lokal Anda terlebih dahulu
        await db.query(
          "UPDATE orders SET status = ?, airway_bill = ?, waybill_url = ? WHERE biteship_order_id = ?",
          [localStatus, resiBaru, urlResiBaru, biteshipOrderId],
        );
        console.log(
          `✅ Resi pesanan ${biteshipOrderId} berhasil turun: ${resiBaru}`,
        );

        // =======================================================================
        // 🚀 TIMING EMAS: TEMBAK NOTIFIKASI PENGIRIMAN KE KONSUMEN (EMAIL & WA)
        // =======================================================================
        try {
          // Tarik profile pembeli dan nomor invoice internal berdasarkan biteshipOrderId
          const [orderRows] = await db.query(
            `SELECT o.invoice_number, o.courier_name, o.recipient_name, o.phone, u.email 
             FROM orders o 
             JOIN users u ON o.user_id = u.id 
             WHERE o.biteship_order_id = ?`,
            [biteshipOrderId],
          );

          if (orderRows.length > 0) {
            const orderInfo = orderRows[0];

            // Susun profil pembeli untuk parameter Notifier
            const customerProfile = {
              fullname: orderInfo.recipient_name,
              phone: orderInfo.phone,
              email: orderInfo.email,
            };

            // Jalankan tugas pengiriman WA & Email di latar belakang (tanpa await agar respons webhook instant)
            Notifier.sendShippingNotification(
              db,
              orderInfo.invoice_number,
              customerProfile,
              orderInfo.courier_name,
              resiBaru,
            ).catch((err) =>
              console.error(
                "Gagal mengirim notifikasi resi via background:",
                err,
              ),
            );
          }
        } catch (notifError) {
          console.error(
            "Gagal memproses kueri data notifikasi pengiriman:",
            notifError,
          );
        }
        // =======================================================================
      } else {
        // Jika belum ada resi (hanya update status proses), update statusnya saja
        await db.query(
          "UPDATE orders SET status = ? WHERE biteship_order_id = ?",
          [localStatus, biteshipOrderId],
        );
        console.log(
          `✅ Status pesanan ${biteshipOrderId} diperbarui menjadi ${localStatus}`,
        );
      }
    }

    return res.status(200).send("Webhook processed successfully");
  } catch (error) {
    console.error("Gagal memproses webhook:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
});

// =======================================================================
// ENDPOINT: REQUEST PICKUP (Membuat Pesanan di Dashboard Biteship)
// =======================================================================
app.post("/api/orders/:id/request-pickup", async (req, res) => {
  try {
    const localOrderId = req.params.id;

    // 1. AMBIL PENGATURAN TOKO DARI DATABASE SECARA DINAMIS
    const [settings] = await db.query(
      "SELECT setting_key, setting_value FROM settings",
    );

    // Mengubah array hasil query menjadi object agar mudah dipanggil (misal: config.shop_name)
    const config = {};
    settings.forEach((row) => {
      config[row.setting_key] = row.setting_value;
    });

    // Pengecekan keamanan: Pastikan API Key sudah dimasukkan di halaman admin
    if (!config.biteship_api_key) {
      return res.status(400).json({
        success: false,
        message: "API Key Biteship belum diatur di menu Pengaturan!",
      });
    }

    // 2. AMBIL DATA PESANAN DARI DATABASE LOKAL
    const [orderRows] = await db.query(`SELECT * FROM orders WHERE id = ?`, [
      localOrderId,
    ]);

    if (orderRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Pesanan tidak ditemukan di database",
      });
    }
    const orderData = orderRows[0];

    // 3. AMBIL DATA ITEM PESANAN (Rincian barang)
    const [itemRows] = await db.query(
      `SELECT product_name, price, quantity, weight FROM order_items WHERE order_id = ?`,
      [localOrderId],
    );

    // 4. SUSUN PAYLOAD (DATA) SESUAI FORMAT BITESHIP
    const biteshipPayload = {
      // Data Pengirim (Ditarik dari tabel settings, default: Chester Collection)
      shipper_contact_name: config.shop_name || "Chester Collection",
      shipper_contact_phone: config.shop_phone || "0000000000",
      shipper_contact_email: config.smtp_user || "admin@chestercollection.id",
      shipper_organization: config.shop_name || "Chester Collection",

      // Data Lokasi Penjemputan (Origin)
      origin_contact_name: config.shop_name || "Chester Collection",
      origin_contact_phone: config.shop_phone || "0000000000",
      origin_address: config.shop_address || "Alamat toko belum diatur",
      origin_area_id: config.store_area_id,

      // Data Tujuan (Destination - Pembeli)
      destination_contact_name: orderData.recipient_name,
      destination_contact_phone: orderData.phone,
      destination_contact_email: orderData.email || "",
      destination_address: orderData.full_address,
      destination_area_id: orderData.destination_area_id,

      // Data Kurir
      courier_company: orderData.courier_name.toLowerCase(),
      courier_type: orderData.courier_type || "reg",
      delivery_type: "now",

      // Rincian Barang (Di-mapping dari tabel order_items)
      items: itemRows.map((item) => ({
        name: item.product_name,
        description: "Pakaian/Fashion",
        value: item.price,
        quantity: item.quantity,
        // Jika berat kosong di database, gunakan default 200 gram
        weight: item.weight || 200,
      })),
    };

    console.log(
      `Mengirim permintaan pickup ke Biteship untuk pesanan lokal ID: ${localOrderId}`,
    );

    // 5. TEMBAK DATA KE API BITESHIP (CREATE ORDER)
    const response = await axios.post(
      "https://api.biteship.com/v1/orders",
      biteshipPayload,
      {
        headers: {
          Authorization: `Bearer ${config.biteship_api_key}`,
          "Content-Type": "application/json",
        },
      },
    );

    // 6. SIMPAN ID DARI BITESHIP KE DATABASE LOKAL
    const biteshipGeneratedId = response.data.id;

    await db.query(
      "UPDATE orders SET biteship_order_id = ?, status = 'shipping' WHERE id = ?",
      [biteshipGeneratedId, localOrderId],
    );

    // 7. KEMBALIKAN RESPON SUKSES KE FRONTEND (REACT)
    return res.status(200).json({
      success: true,
      message:
        "Berhasil Request Pickup Kurir! Pesanan sudah masuk ke dasbor Biteship.",
      biteship_id: biteshipGeneratedId,
    });
  } catch (error) {
    console.error(
      "Gagal Request Pickup Biteship:",
      error.response?.data || error.message,
    );
    return res.status(500).json({
      success: false,
      message: "Gagal memanggil kurir dari Biteship.",
      error: error.response?.data?.error || error.message,
    });
  }
});

// =======================================================================
// ENDPOINT: AMBIL DETAIL PESANAN LANGSUNG DARI BITESHIP (DEBUGGING)
// =======================================================================
app.get("/api/orders/biteship/:biteshipOrderId", async (req, res) => {
  try {
    const { biteshipOrderId } = req.params;

    // Ambil API Key dari database settings
    const [settings] = await db.query(
      "SELECT setting_value FROM settings WHERE setting_key = 'biteship_api_key'",
    );

    if (settings.length === 0 || !settings[0].setting_value) {
      return res.status(500).json({
        success: false,
        message: "API Key Biteship tidak ditemukan di pengaturan.",
      });
    }

    const apiKey = settings[0].setting_value;

    // Tembak GET Request ke Biteship menggunakan API Key tersebut
    const response = await axios.get(
      `https://api.biteship.com/v1/orders/${biteshipOrderId}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      },
    );

    // Kembalikan data murni dari Biteship ke browser kita
    return res.status(200).json({
      success: true,
      message: "Data berhasil ditarik dari Biteship",
      biteship_data: response.data,
    });
  } catch (error) {
    console.error(
      "Gagal menarik data dari Biteship:",
      error.response?.data || error.message,
    );
    return res.status(500).json({
      success: false,
      message: "Gagal menarik data dari Biteship",
      error_detail: error.response?.data || error.message,
    });
  }
});

// ENDPOINT SEMENTARA UNTUK MEMBATALKAN PESANAN (Mendapatkan ID Cancelled)
app.delete("/api/orders/biteship/:biteshipOrderId/cancel", async (req, res) => {
  try {
    const { biteshipOrderId } = req.params;

    // Asumsi: Ambil API Key Testing Anda seperti cara sebelumnya
    const [settings] = await db.query(
      "SELECT setting_value FROM settings WHERE setting_key = 'biteship_api_key'",
    );
    const apiKey = settings[0].setting_value;

    const response = await axios.delete(
      `https://api.biteship.com/v1/orders/${biteshipOrderId}`,
      {
        headers: { Authorization: `Bearer ${apiKey}` },
      },
    );

    return res.status(200).json({
      success: true,
      message: "Pesanan berhasil dibatalkan di Biteship!",
      data: response.data,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ error: error.response?.data || error.message });
  }
});

// =======================================================================
// ENDPOINT: STATISTIK DASHBOARD ADMIN - DINAMIS BERDASARKAN FILTER
// =======================================================================
// 1. ENDPOINT BARU: MENERIMA SINYAL TRACKING DARI WEBSITE PEMBELI
app.post("/api/analytics/track", async (req, res) => {
  try {
    const { page_url, product_id } = req.body;

    // Ambil IP Address pembeli untuk validasi Unique Visitor
    const ip_address =
      req.headers["x-forwarded-for"] || req.socket.remoteAddress;

    await db.query(
      "INSERT INTO site_analytics (page_url, product_id, ip_address) VALUES (?, ?, ?)",
      [page_url, product_id || null, ip_address],
    );

    return res
      .status(200)
      .json({ success: true, message: "Aktivitas berhasil dicatat" });
  } catch (error) {
    console.error("Gagal mencatat tracking:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
});

// 2. REVISI TOTAL ENDPOINT STATS DASHBOARD AGAR MENGGUNAKAN DATA TRACKING RIIL
app.get("/api/dashboard/stats", async (req, res) => {
  try {
    const { filter, month, year } = req.query;

    let orderDateCond = "1=1";
    let analyticsDateCond = "1=1";

    if (filter === "hariIni") {
      orderDateCond = "DATE(o.created_at) = CURDATE()";
      analyticsDateCond = "DATE(viewed_at) = CURDATE()";
    } else if (filter === "kemarin") {
      orderDateCond = "DATE(o.created_at) = CURDATE() - INTERVAL 1 DAY";
      analyticsDateCond = "DATE(viewed_at) = CURDATE() - INTERVAL 1 DAY";
    } else if (filter === "7hari") {
      orderDateCond =
        "DATE(o.created_at) BETWEEN CURDATE() - INTERVAL 7 DAY AND CURDATE()";
      analyticsDateCond =
        "DATE(viewed_at) BETWEEN CURDATE() - INTERVAL 7 DAY AND CURDATE()";
    } else if (filter === "bulan") {
      const targetMonth = month ? parseInt(month) : new Date().getMonth() + 1;
      const targetYear = year ? parseInt(year) : new Date().getFullYear();
      orderDateCond = `MONTH(o.created_at) = ${targetMonth} AND YEAR(o.created_at) = ${targetYear}`;
      analyticsDateCond = `MONTH(viewed_at) = ${targetMonth} AND YEAR(viewed_at) = ${targetYear}`;
    } else if (filter === "tahun") {
      const targetYear = year ? parseInt(year) : new Date().getFullYear();
      orderDateCond = `YEAR(o.created_at) = ${targetYear}`;
      analyticsDateCond = `YEAR(viewed_at) = ${targetYear}`;
    }

    // A. Kueri Ambil 5 Pesanan Terbaru
    const [recentOrders] = await db.query(
      `SELECT o.invoice_number, o.created_at, o.total_amount, o.status, u.fullname 
       FROM orders o 
       JOIN users u ON o.user_id = u.id 
       ORDER BY o.created_at DESC 
       LIMIT 5`,
    );

    // B. Kueri Hitung Finansial (Pendapatan & Total Order)
    const [revenueStats] = await db.query(
      `SELECT SUM(o.total_amount) as total_rev, COUNT(o.id) as total_orders 
       FROM orders o
       WHERE o.status IN ('paid', 'shipping', 'completed') AND ${orderDateCond}`,
    );

    // C. Kueri Hitung Analytics (Pengunjung & Produk Dilihat)
    const [analyticsStats] = await db.query(
      `SELECT 
         COUNT(DISTINCT ip_address) as unique_visitors,
         COUNT(CASE WHEN product_id IS NOT NULL THEN 1 END) as product_views
       FROM site_analytics
       WHERE ${analyticsDateCond}`,
    );

    // D. KUERI BARU: DATA GRAFIK PENJUALAN
    let chartQuery = "";
    if (filter === "hariIni" || filter === "kemarin") {
      chartQuery = `SELECT HOUR(o.created_at) as label_key, SUM(o.total_amount) as total_val FROM orders o WHERE o.status IN ('paid', 'shipping', 'completed') AND ${orderDateCond} GROUP BY HOUR(o.created_at) ORDER BY HOUR(o.created_at)`;
    } else if (filter === "7hari") {
      chartQuery = `SELECT DATE(o.created_at) as label_key, SUM(o.total_amount) as total_val FROM orders o WHERE o.status IN ('paid', 'shipping', 'completed') AND ${orderDateCond} GROUP BY DATE(o.created_at) ORDER BY DATE(o.created_at)`;
    } else if (filter === "bulan") {
      chartQuery = `SELECT DAY(o.created_at) as label_key, SUM(o.total_amount) as total_val FROM orders o WHERE o.status IN ('paid', 'shipping', 'completed') AND ${orderDateCond} GROUP BY DAY(o.created_at) ORDER BY DAY(o.created_at)`;
    } else if (filter === "tahun") {
      chartQuery = `SELECT MONTH(o.created_at) as label_key, SUM(o.total_amount) as total_val FROM orders o WHERE o.status IN ('paid', 'shipping', 'completed') AND ${orderDateCond} GROUP BY MONTH(o.created_at) ORDER BY MONTH(o.created_at)`;
    }

    const [rawChartData] = await db.query(chartQuery);

    const dataDashboard = {
      revenue: Number(revenueStats[0].total_rev || 0),
      ordersCount: Number(revenueStats[0].total_orders || 0),
      webVisitors: analyticsStats[0].unique_visitors || 0,
      productViews: analyticsStats[0].product_views || 0,
      rawChartData: rawChartData, // Kita kirim data mentah grafik ke frontend
      recentOrders: recentOrders.map((order) => {
        let uiStatus = "Menunggu Pembayaran";
        if (order.status === "paid") uiStatus = "Diproses";
        if (order.status === "shipping") uiStatus = "Dikirim";
        if (order.status === "completed") uiStatus = "Selesai";
        if (order.status === "cancelled") uiStatus = "Dibatalkan";

        return {
          id: order.invoice_number,
          customer: order.fullname,
          date: new Date(order.created_at).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
          }),
          total: Number(order.total_amount),
          status: uiStatus,
        };
      }),
    };

    return res.status(200).json({ success: true, data: dataDashboard });
  } catch (error) {
    console.error("Gagal memuat statistik dashboard:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
});

// =======================================================================
// ENDPOINT ADMIN: GENERATE STATIC SITEMAP, ROBOTS & INJEKSI GSC
// =======================================================================
app.get("/api/admin/generate-seo", async (req, res) => {
  try {
    const domain = process.env.FRONTEND_URL;
    const publicPath = process.env.FRONTEND_PUBLIC_PATH || path.resolve(__dirname, "../public_html"); 

    // 1. BUAT FILE FISIK ROBOTS.TXT
    const robotsText = `User-agent: *\nAllow: /\nDisallow: /admin-login\nDisallow: /admin/\n\nSitemap: ${domain}/sitemap.xml`;
    fs.writeFileSync(path.join(publicPath, "robots.txt"), robotsText);

    // 2. BUAT FILE FISIK SITEMAP.XML
    const [products] = await db.query("SELECT slug, updated_at FROM products WHERE status = 'available'");
    const [categories] = await db.query("SELECT slug FROM product_categories");

    let urls = `
      <url><loc>${domain}/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>
      <url><loc>${domain}/products</loc><changefreq>daily</changefreq><priority>0.8</priority></url>
    `;

    categories.forEach((category) => {
      urls += `<url><loc>${domain}/products?category=${category.slug}</loc><changefreq>weekly</changefreq><priority>0.7</priority></url>`;
    });

    products.forEach((product) => {
      const lastMod = product.updated_at ? new Date(product.updated_at).toISOString().split("T")[0] : new Date().toISOString().split("T")[0];
      urls += `<url><loc>${domain}/product/${product.slug}</loc><lastmod>${lastMod}</lastmod><changefreq>weekly</changefreq><priority>0.9</priority></url>`;
    });

    const sitemapXML = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;
    fs.writeFileSync(path.join(publicPath, "sitemap.xml"), sitemapXML);

    // ===================================================================
    // 3. FITUR BARU: INJEKSI OTOMATIS TAG GOOGLE KE INDEX.HTML (DIPERKUAT)
    // ===================================================================
    const [settings] = await db.query("SELECT setting_value FROM settings WHERE setting_key = 'gsc_verification_tag'");
    const gscTag = settings.length > 0 ? settings[0].setting_value : null;

    if (gscTag) {
      const indexPath = path.join(publicPath, "index.html");
      
      // Evaluasi Kritis: Jika file tidak ada, lemparkan error agar developer tahu path-nya salah
      if (!fs.existsSync(indexPath)) {
        throw new Error(`File index.html tidak ditemukan di target direktori: ${indexPath}. Cek FRONTEND_PUBLIC_PATH di .env.`);
      }

      let htmlContent = fs.readFileSync(indexPath, "utf8");
      const metaString = `<meta name="google-site-verification" content="${gscTag}" />`;

      // Cek apakah kode verifikasi sudah pernah ditanam agar tidak ganda
      if (!htmlContent.includes("google-site-verification")) {
        // PERBAIKAN: Gunakan Regex /<\/head>/i agar tahan terhadap perubahan kapitalisasi (<HEAD> atau </head>)
        htmlContent = htmlContent.replace(/<\/head>/i, `  ${metaString}\n</head>`);
        fs.writeFileSync(indexPath, htmlContent);
      } else if (!htmlContent.includes(gscTag)) {
        // Jika sudah ada tag GSC lama, perbarui dengan kode yang baru
        htmlContent = htmlContent.replace(/<meta name="google-site-verification" content=".*?"\s*\/>/i, metaString);
        fs.writeFileSync(indexPath, htmlContent);
      }
    }

    return res.status(200).json({ 
      success: true, 
      message: "Sitemap, Robots.txt, dan injeksi verifikasi Google berhasil diterapkan ke frontend." 
    });
  } catch (error) {
    console.error("Gagal mencetak file SEO:", error);
    return res.status(500).json({ 
      success: false, 
      // PERBAIKAN: Mengirim pesan error spesifik ke layar frontend agar bisa dievaluasi
      message: error.message || "Terjadi kesalahan internal saat mencetak SEO." 
    });
  }
});

// =======================================================================
// HELPER: FUNGSI UNTUK MEMBUAT NOTIFIKASI ADMIN BARU
// =======================================================================
const createAdminNotification = async (type, reference_id, message) => {
  try {
    // Kita gunakan db.query langsung agar tidak mengganggu transaksi lain
    await db.query(
      "INSERT INTO admin_notifications (type, reference_id, message, is_read) VALUES (?, ?, ?, 0)",
      [type, reference_id, message]
    );
    console.log(`[Notifikasi Dibuat] ${type}: ${message}`);
  } catch (error) {
    console.error("Gagal menyimpan notifikasi ke database:", error.message);
  }
};

// =======================================================================
// ENDPOINT: MENGAMBIL DAFTAR NOTIFIKASI ADMIN
// =======================================================================
app.get("/api/admin/notifications", async (req, res) => {
  try {
    // Mengambil 10 notifikasi terbaru
    const [notifications] = await db.query(
      "SELECT * FROM admin_notifications ORDER BY created_at DESC LIMIT 10",
    );

    // Menghitung jumlah notifikasi yang belum dibaca (is_read = 0)
    const [unread] = await db.query(
      "SELECT COUNT(id) as unread_count FROM admin_notifications WHERE is_read = 0",
    );

    return res.status(200).json({
      success: true,
      data: notifications,
      unread_count: unread[0].unread_count,
    });
  } catch (error) {
    console.error("Gagal mengambil notifikasi:", error);
    return res
      .status(500)
      .json({ success: false, message: "Kesalahan server" });
  }
});

// =======================================================================
// ENDPOINT: TANDAI NOTIFIKASI SUDAH DIBACA
// =======================================================================
app.put("/api/admin/notifications/:id/read", async (req, res) => {
  try {
    const notifId = req.params.id;
    await db.query("UPDATE admin_notifications SET is_read = 1 WHERE id = ?", [
      notifId,
    ]);
    return res
      .status(200)
      .json({ success: true, message: "Notifikasi dibaca" });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Kesalahan server" });
  }
});

// =======================================================================
// ENDPOINT: MENGAMBIL ULASAN PRODUK DENGAN SERVER-SIDE PAGINATION
// =======================================================================
app.get("/api/products/:product_id/reviews", async (req, res) => {
  try {
    const { product_id } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const offset = (page - 1) * limit;

    // ---> PERBAIKAN: Menghitung COUNT (Total) dan AVG (Rata-rata) dari database
    const [summaryResult] = await db.query(
      "SELECT COUNT(id) as total, IFNULL(AVG(rating), 0) as averageRating FROM product_reviews WHERE product_id = ?",
      [product_id],
    );
    const totalReviews = summaryResult[0].total;
    // Format rata-rata menjadi 1 angka di belakang koma (contoh: 4.5)
    const averageRating = parseFloat(summaryResult[0].averageRating).toFixed(1);
    const totalPages = Math.ceil(totalReviews / limit);

    const [reviews] = await db.query(
      `SELECT pr.*, u.fullname, u.avatar
       FROM product_reviews pr
       LEFT JOIN users u ON pr.user_id = u.id
       WHERE pr.product_id = ?
       ORDER BY pr.created_at DESC
       LIMIT ? OFFSET ?`,
      [product_id, limit, offset],
    );

    // ---> PERBAIKAN: Menambahkan objek "summary" ke data yang dikirim ke Frontend
    return res.status(200).json({
      success: true,
      data: reviews,
      pagination: {
        current_page: page,
        total_pages: totalPages,
        total_reviews: totalReviews,
        limit_per_page: limit,
      },
      summary: {
        averageRating: averageRating,
        totalReviews: totalReviews,
      },
    });
  } catch (error) {
    console.error("Gagal mengambil ulasan:", error);
    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server saat mengambil ulasan.",
    });
  }
});

// =======================================================================
// ENDPOINT: [ADMIN] MENGAMBIL SELURUH ULASAN
// =======================================================================
app.get("/api/admin/reviews", async (req, res) => {
  try {
    const [reviews] = await db.query(
      `SELECT pr.*, 
              p.name as product_name, 
              u.fullname as customer_name
       FROM product_reviews pr
       LEFT JOIN products p ON pr.product_id = p.id
       LEFT JOIN users u ON pr.user_id = u.id
       ORDER BY pr.created_at DESC`,
    );

    return res.status(200).json({
      success: true,
      data: reviews,
    });
  } catch (error) {
    console.error("Gagal mengambil ulasan admin:", error);
    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server saat mengambil ulasan admin.",
    });
  }
});

// =======================================================================
// ENDPOINT: [ADMIN] MEMBALAS ULASAN PELANGGAN
// =======================================================================
app.put("/api/admin/reviews/:id/reply", async (req, res) => {
  try {
    const { id } = req.params;
    const { admin_reply } = req.body;

    if (!admin_reply || admin_reply.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Teks balasan tidak boleh kosong.",
      });
    }

    const [result] = await db.query(
      "UPDATE product_reviews SET admin_reply = ? WHERE id = ?",
      [admin_reply, id],
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Ulasan tidak ditemukan." });
    }

    return res.status(200).json({
      success: true,
      message: "Balasan ulasan berhasil disimpan.",
    });
  } catch (error) {
    console.error("Gagal menyimpan balasan ulasan:", error);
    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server saat menyimpan balasan.",
    });
  }
});

// =======================================================================
// ENDPOINT: [ADMIN] TOGGLE SEMBUNYIKAN/TAMPILKAN ULASAN
// =======================================================================
app.patch("/api/admin/reviews/:id/visibility", async (req, res) => {
  try {
    const { id } = req.params;

    // Kita gunakan NOT is_hidden agar jika 0 jadi 1, jika 1 jadi 0
    const [result] = await db.query(
      "UPDATE product_reviews SET is_hidden = NOT is_hidden WHERE id = ?",
      [id],
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Ulasan tidak ditemukan." });
    }

    return res.status(200).json({
      success: true,
      message: "Status visibilitas ulasan berhasil diubah.",
    });
  } catch (error) {
    console.error("Gagal mengubah visibilitas ulasan:", error);
    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server saat memproses data.",
    });
  }
});

// =======================================================================
// ENDPOINT: [PELANGGAN] EDIT ULASAN
// =======================================================================
app.put("/api/reviews/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment, user_id } = req.body; // user_id didapat dari token atau sesi pelanggan di React

    // Validasi input
    if (!rating || rating < 1 || rating > 5) {
      return res
        .status(400)
        .json({ success: false, message: "Rating harus antara 1 dan 5." });
    }
    if (!user_id) {
      return res.status(401).json({
        success: false,
        message: "Akses ditolak. ID Pengguna diperlukan.",
      });
    }

    // Update database: Hanya jika id ulasan DAN user_id cocok
    const [result] = await db.query(
      "UPDATE product_reviews SET rating = ?, comment = ? WHERE id = ? AND user_id = ?",
      [rating, comment, id, user_id],
    );

    if (result.affectedRows === 0) {
      return res.status(403).json({
        success: false,
        message:
          "Ulasan tidak ditemukan atau Anda tidak memiliki izin untuk mengedit ulasan ini.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Ulasan berhasil diperbarui.",
    });
  } catch (error) {
    console.error("Gagal mengedit ulasan:", error);
    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server saat menyimpan ulasan.",
    });
  }
});

// =======================================================================
// ENDPOINT: PING KEEP-ALIVE (Mencegah Server Tertidur di cPanel)
// =======================================================================
app.get("/api/ping", (req, res) => {
  // Endpoint ini sangat ringan, tidak memanggil database sama sekali
  res.status(200).json({
    success: true,
    message: "Server Node.js aktif dan terjaga!",
    timestamp: new Date().toISOString()
  });
});

// =======================================================================
// MENYALAKAN MESIN SERVER (WAJIB DI PALING BAWAH FILE)
// =======================================================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server Backend berjalan di http://localhost:\${PORT}`);
});
