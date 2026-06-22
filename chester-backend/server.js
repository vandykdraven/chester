const express = require("express");
const axios = require("axios");
const mysql = require("mysql2");
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

    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      const [productResult] = await connection.query(
        `INSERT INTO products (name, category_id, size_guide_id, description, video_url, status, price, original_price, stock, weight, sku, has_variant, variant_types_json, seo_title, seo_description, seo_keywords) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          name,
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

      if (imgCfg[0]) {
        if (imgCfg[0].type === "pc" && req.files["primaryImage"]) {
          await connection.query(
            `INSERT INTO product_images (product_id, image_url, is_primary) VALUES (?, ?, 1)`,
            [
              productId,
              `/uploads/products/${req.files["primaryImage"][0].filename}`,
            ],
          );
        } else if (imgCfg[0].type === "server" && imgCfg[0].path) {
          await connection.query(
            `INSERT INTO product_images (product_id, image_url, is_primary) VALUES (?, ?, 1)`,
            [productId, imgCfg[0].path],
          );
        }
      }

      let pcUploadIndex = 0;
      for (let i = 1; i <= 4; i++) {
        const slotConfig = imgCfg[i];
        if (slotConfig) {
          if (
            slotConfig.type === "pc" &&
            req.files["supportingImages"] &&
            req.files["supportingImages"][pcUploadIndex]
          ) {
            await connection.query(
              `INSERT INTO product_images (product_id, image_url, is_primary) VALUES (?, ?, 0)`,
              [
                productId,
                `/uploads/products/${req.files["supportingImages"][pcUploadIndex].filename}`,
              ],
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
    // 1. Tangkap parameter dari URL (Frontend)
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12; // Menampilkan 12 produk per halaman
    const search = req.query.search || "";
    const category = req.query.category || "";
    const maxPrice = req.query.maxPrice || 3000000;
    const availability = req.query.availability || "all";
    const sortBy = req.query.sortBy || "terbaru";

    const offset = (page - 1) * limit;

    // 2. Susun kerangka dasar Query SQL
    let baseQuery = `
      FROM products p
      LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = 1
      LEFT JOIN product_variants pv ON p.id = pv.product_id
    `;

    let whereClauses = [];
    let queryParams = [];

    // Filter Pencarian
    if (search) {
      whereClauses.push("p.name LIKE ?");
      queryParams.push(`%${search}%`);
    }

    // Filter Kategori (Menerima format "1,2,3")
    if (category) {
      const catArray = category
        .split(",")
        .map((id) => parseInt(id))
        .filter((id) => !isNaN(id));
      if (catArray.length > 0) {
        whereClauses.push(
          `p.category_id IN (${catArray.map(() => "?").join(",")})`,
        );
        queryParams.push(...catArray);
      }
    }

    let selectClause = `
      SELECT p.id, p.name, p.category_id, p.price, p.original_price, p.stock, p.status, p.has_variant, p.sku, p.created_at, 
      pi.image_url AS primary_image, 
      MIN(pv.price) AS min_v_price, MAX(pv.price) AS max_v_price, 
      MIN(pv.original_price) AS min_v_original_price, SUM(pv.stock) AS total_v_stock
    `;

    let whereString =
      whereClauses.length > 0 ? " WHERE " + whereClauses.join(" AND ") : "";
    let groupByString = " GROUP BY p.id, pi.image_url";

    // Filter Harga & Stok menggunakan HAVING (karena kita pakai data Agregat/Group)
    let havingClauses = [];
    havingClauses.push(`(IF(p.has_variant = 1, min_v_price, p.price) <= ?)`);
    queryParams.push(maxPrice);

    if (availability === "instock") {
      havingClauses.push(`(p.stock > 0 OR total_v_stock > 0)`);
    }
    let havingString =
      havingClauses.length > 0 ? " HAVING " + havingClauses.join(" AND ") : "";

    // Logika Sortir/Urutkan
    let orderString = " ORDER BY p.created_at DESC";
    if (sortBy === "termurah") {
      orderString = " ORDER BY IF(p.has_variant = 1, min_v_price, p.price) ASC";
    } else if (sortBy === "termahal") {
      orderString =
        " ORDER BY IF(p.has_variant = 1, min_v_price, p.price) DESC";
    } else if (sortBy === "abjad") {
      orderString = " ORDER BY p.name ASC";
    }

    // 3. Eksekusi Query untuk Hitung Total Halaman (Pagination)
    let countQuery = `SELECT COUNT(*) as total FROM (${selectClause} ${baseQuery} ${whereString} ${groupByString} ${havingString}) as count_table`;
    const [countResult] = await db.query(countQuery, queryParams);
    const totalItems = countResult[0].total;
    const totalPages = Math.ceil(totalItems / limit);

    // 4. Eksekusi Query Pengambilan Data sesuai Halaman
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
  try {
    const [result] = await db.query("DELETE FROM products WHERE id = ?", [
      req.params.id,
    ]);
    if (result.affectedRows === 0)
      return res
        .status(404)
        .json({ success: false, message: "Produk tidak ditemukan!" });
    return res.json({
      success: true,
      message:
        "Data produk berhasil dihapus, file gambar tetap tersimpan di Galeri Server!",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server saat menghapus produk.",
    });
  }
});

app.get("/api/products/:id", async (req, res) => {
  try {
    const [products] = await db.query("SELECT * FROM products WHERE id = ?", [
      req.params.id,
    ]);
    if (products.length === 0)
      return res
        .status(404)
        .json({ success: false, message: "Produk tidak ditemukan!" });
    const [images] = await db.query(
      "SELECT id, image_url, is_primary FROM product_images WHERE product_id = ?",
      [req.params.id],
    );
    const [variants] = await db.query(
      "SELECT * FROM product_variants WHERE product_id = ?",
      [req.params.id],
    );
    const [wholesales] = await db.query(
      "SELECT * FROM product_wholesales WHERE product_id = ?",
      [req.params.id],
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
      return res
        .status(400)
        .json({ success: false, message: "Data produk tidak ditemukan." });
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

    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      await connection.query(
        `UPDATE products SET name = ?, category_id = ?, size_guide_id = ?, description = ?, video_url = ?, status = ?, price = ?, original_price = ?, stock = ?, weight = ?, sku = ?, has_variant = ?, variant_types_json = ?, seo_title = ?, seo_description = ?, seo_keywords = ? WHERE id = ?`,
        [
          name,
          category_id || null,
          size_guide_id || null,
          description,
          video_url || null,
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

      await connection.query(
        "DELETE FROM product_wholesales WHERE product_id = ?",
        [productId],
      );
      if (wholesales && wholesales.length > 0) {
        for (const ws of wholesales) {
          if (ws.minQty && ws.price)
            await connection.query(
              "INSERT INTO product_wholesales (product_id, min_qty, wholesale_price) VALUES (?, ?, ?)",
              [productId, ws.minQty, ws.price],
            );
        }
      }

      await connection.query(
        "DELETE FROM product_variants WHERE product_id = ?",
        [productId],
      );
      if (has_variant && variantMatrix && variantMatrix.length > 0) {
        for (const row of variantMatrix) {
          await connection.query(
            `INSERT INTO product_variants (product_id, variant_key, price, original_price, stock, weight, sku) VALUES (?, ?, ?, ?, ?, ?, ?)`,
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

      await connection.query(
        "DELETE FROM product_images WHERE product_id = ?",
        [productId],
      );
      const imgCfg = imagesConfig || [];
      if (imgCfg[0]) {
        if (imgCfg[0].type === "pc" && req.files["primaryImage"]) {
          await connection.query(
            "INSERT INTO product_images (product_id, image_url, is_primary) VALUES (?, ?, 1)",
            [
              productId,
              `/uploads/products/${req.files["primaryImage"][0].filename}`,
            ],
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

      let pcUploadIndex = 0;
      for (let i = 1; i <= 4; i++) {
        const slotConfig = imgCfg[i];
        if (slotConfig) {
          if (
            slotConfig.type === "pc" &&
            req.files["supportingImages"] &&
            req.files["supportingImages"][pcUploadIndex]
          ) {
            await connection.query(
              "INSERT INTO product_images (product_id, image_url, is_primary) VALUES (?, ?, 0)",
              [
                productId,
                `/uploads/products/${req.files["supportingImages"][pcUploadIndex].filename}`,
              ],
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
const getBiteshipConfig = async () => {
  const [rows] = await db.query(
    "SELECT setting_value FROM settings WHERE setting_key = 'biteship_api_key'",
  );
  const apiKey =
    rows.length > 0 && rows[0].setting_value
      ? rows[0].setting_value.trim()
      : "";
  return {
    baseURL: "https://api.biteship.com/v1",
    headers: { Authorization: apiKey, "Content-Type": "application/json" },
  };
};

app.get("/api/logistic/search-area", async (req, res) => {
  try {
    const { keyword } = req.query;
    if (!keyword || keyword.length < 3)
      return res
        .status(400)
        .json({ success: false, message: "Ketik minimal 3 huruf." });

    const config = await getBiteshipConfig();
    if (!config.headers.Authorization)
      return res.status(400).json({
        success: false,
        message: "API Key Biteship belum diatur di Admin.",
      });

    const response = await axios.get(
      `${config.baseURL}/maps/areas?countries=ID&input=${keyword}`,
      { headers: config.headers, timeout: 30000 },
    );
    res.status(200).json({ success: true, data: response.data.areas });
  } catch (error) {
    res.status(error.response?.status || 500).json({
      success: false,
      message: error.response?.data?.error || "Gagal memuat area pengiriman.",
    });
  }
});

app.post("/api/logistic/rates", async (req, res) => {
  try {
    const { origin_area_id, destination_area_id, weight, couriers } = req.body;
    const config = await getBiteshipConfig();
    if (!config.headers.Authorization)
      return res
        .status(400)
        .json({ success: false, message: "API Key Biteship belum diatur." });

    const payload = {
      origin_area_id,
      destination_area_id,
      couriers: couriers || "jne,sicepat,jnt",
      items: [{ name: "Pesanan Baju", value: 50000, weight, quantity: 1 }],
    };

    const response = await axios.post(
      `${config.baseURL}/rates/couriers`,
      payload,
      { headers: config.headers, timeout: 30000 },
    );
    res.status(200).json({ success: true, data: response.data.pricing });
  } catch (error) {
    res.status(error.response?.status || 500).json({
      success: false,
      message: error.response?.data?.error || "Gagal menghitung tarif.",
    });
  }
});

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
// ENDPOINT: ULASAN / REVIEW PRODUK (NEW FEATURE)
// =======================================================================
app.post("/api/reviews", async (req, res) => {
  try {
    const { order_id, product_id, user_id, rating, comment } = req.body;
    if (!order_id || !product_id || !user_id || !rating) {
      return res
        .status(400)
        .json({ success: false, message: "Data ulasan tidak lengkap!" });
    }

    const [existing] = await db.query(
      "SELECT id FROM product_reviews WHERE order_id = ? AND product_id = ? AND user_id = ?",
      [order_id, product_id, user_id],
    );
    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Anda sudah memberikan ulasan untuk produk ini.",
      });
    }

    await db.query(
      "INSERT INTO product_reviews (order_id, product_id, user_id, rating, comment) VALUES (?, ?, ?, ?, ?)",
      [order_id, product_id, user_id, rating, comment || null],
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

    // Query penggabungan (JOIN) untuk mengambil data wishlist sekaligus gambar dan harga produknya
    const [rows] = await db.query(
      `
      SELECT w.id as wishlist_id, p.id as product_id, p.name, p.price, p.status, p.has_variant,
             (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as primary_image
      FROM wishlists w
      JOIN products p ON w.product_id = p.id
      WHERE w.user_id = ?
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
    const { postal_code, total_weight, courier, cart_items, cart_value } =
      req.body;

    if (!postal_code) {
      return res
        .status(400)
        .json({ success: false, message: "Kode pos tujuan wajib diisi." });
    }

    const [settings] = await db.query(
      "SELECT setting_key, setting_value FROM settings WHERE setting_key IN ('biteship_api_key', 'biteship_api_url', 'store_postal_code')",
    );

    let biteshipKey = "";
    let biteshipUrl = "https://api.biteship.com/v1/rates/couriers";
    let originPostalCode = "";

    settings.forEach((setting) => {
      if (setting.setting_key === "biteship_api_key")
        biteshipKey = setting.setting_value;
      if (setting.setting_key === "biteship_api_url" && setting.setting_value)
        biteshipUrl = setting.setting_value;
      if (setting.setting_key === "store_postal_code")
        originPostalCode = setting.setting_value;
    });

    if (!biteshipKey) {
      return res.status(500).json({
        success: false,
        message: "API Key Biteship belum diatur admin.",
      });
    }

    const finalOriginPostal = originPostalCode
      ? originPostalCode.toString()
      : "57144";

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
      origin_postal_code: finalOriginPostal,
      destination_postal_code: postal_code.toString(),
      couriers: courier || "jne,jnt,sicepat,pos",
      items: payloadItems,
    };

    console.log(
      "DEBUG: Payload ke Biteship:",
      JSON.stringify(payload, null, 2),
    );

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
      return res
        .status(400)
        .json({ success: false, message: "Gagal memproses tarif kurir." });
    }
  } catch (err) {
    console.error("Biteship Error:", err.response?.data || err.message);
    return res.status(500).json({
      success: false,
      message: "Kesalahan server saat hitung ongkir.",
    });
  }
});

// =======================================================================
// MENYALAKAN MESIN SERVER (WAJIB DI PALING BAWAH FILE)
// =======================================================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server Backend berjalan di http://localhost:\${PORT}`);
});
