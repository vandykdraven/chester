-- =======================================================================
-- 1. TABEL UTAMA: INDUK PRODUK
-- =======================================================================
CREATE TABLE IF NOT EXISTS `products` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `category_id` VARCHAR(50) DEFAULT NULL,
  `description` TEXT DEFAULT NULL, -- Menampung format Rich Text HTML dari QuillJS
  `status` ENUM('available', 'draft') DEFAULT 'available',
  -- Harga & Stok Standar (Hanya terisi jika produk TIDAK punya variasi)
  `price` DECIMAL(12, 2) DEFAULT 0.00,
  `original_price` DECIMAL(12, 2) DEFAULT 0.00,
  `stock` INT DEFAULT 0,
  `weight` INT DEFAULT 0, -- Dalam satuan gram
  `sku` VARCHAR(100) DEFAULT NULL,
  -- Atribut Bendera Keamanan Variasi
  `has_variant` TINYINT(1) DEFAULT 0, -- 0 = Standar, 1 = Memiliki Variasi Dinamis
  `variant_types_json` TEXT DEFAULT NULL, -- Menyimpan metadata pilihan induk (ex: [{'name':'Ukuran', 'options':['S','M']}] )
  -- Kolom Optimasi Mesin Pencari (SEO)
  `seo_title` VARCHAR(150) DEFAULT NULL,
  `seo_description` VARCHAR(255) DEFAULT NULL,
  `seo_keywords` VARCHAR(255) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =======================================================================
-- 2. TABEL MULTI-IMAGE (FOTO PRODUK)
-- =======================================================================
CREATE TABLE IF NOT EXISTS `product_images` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `product_id` INT NOT NULL,
  `image_url` VARCHAR(255) NOT NULL,
  `is_primary` TINYINT(1) DEFAULT 0, -- 1 = Foto Utama (Pink), 0 = Foto Pendukung
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =======================================================================
-- 3. TABEL VARIANT MATRIX (SUB VARIASI DINAMIS)
-- =======================================================================
CREATE TABLE IF NOT EXISTS `product_variants` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `product_id` INT NOT NULL,
  `variant_key` VARCHAR(150) NOT NULL, -- Kombinasi string unik (ex: "Merah-S" atau "Hitam-XL")
  `price` DECIMAL(12, 2) NOT NULL,    -- Harga khusus untuk sub-variasi ini
  `original_price` DECIMAL(12, 2) DEFAULT 0.00,
  `stock` INT NOT NULL DEFAULT 0,
  `weight` INT NOT NULL DEFAULT 0,    -- Berat khusus sub-variasi (gram)
  `sku` VARCHAR(100) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =======================================================================
-- 4. TABEL HARGA GROSIR (DINAMIS)
-- =======================================================================
CREATE TABLE IF NOT EXISTS `product_wholesales` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `product_id` INT NOT NULL,
  `min_qty` INT NOT NULL,             -- Minimal jumlah pembelian grosir (ex: 12)
  `wholesale_price` DECIMAL(12, 2) NOT NULL, -- Harga satuan grosir jika menyentuh min_qty
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;