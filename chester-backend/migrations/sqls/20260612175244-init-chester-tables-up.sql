-- Tabel Admin
CREATE TABLE IF NOT EXISTS `admins` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `fullname` VARCHAR(100) NOT NULL,
  `email` VARCHAR(100) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `role` ENUM('superadmin', 'admin') DEFAULT 'admin',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel Pelanggan
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `fullname` VARCHAR(100) NOT NULL,
  `email` VARCHAR(100) NOT NULL UNIQUE,
  `phone` VARCHAR(20) NULL,
  `password` VARCHAR(255) NOT NULL,
  `status` ENUM('active', 'suspended') DEFAULT 'active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel Alamat Pelanggan
CREATE TABLE IF NOT EXISTS `user_addresses` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `label` VARCHAR(50) DEFAULT 'Rumah', 
  `recipient_name` VARCHAR(100) NOT NULL,
  `phone` VARCHAR(20) NOT NULL,
  `province_id` INT NOT NULL,
  `province_name` VARCHAR(100),
  `city_id` INT NOT NULL,
  `city_name` VARCHAR(100),
  `subdistrict_id` INT,           
  `subdistrict_name` VARCHAR(100),
  `postal_code` VARCHAR(10),
  `full_address` TEXT NOT NULL,   
  `is_primary` BOOLEAN DEFAULT FALSE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);

-- Tabel Kategori Produk
CREATE TABLE IF NOT EXISTS `product_categories` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `slug` VARCHAR(100) NOT NULL UNIQUE,
  `description` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel Tag Produk
CREATE TABLE IF NOT EXISTS `product_tags` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(50) NOT NULL UNIQUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel Panduan Ukuran
CREATE TABLE IF NOT EXISTS `size_guides` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `content` TEXT,
  `image_url` VARCHAR(255),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel Galeri Media
CREATE TABLE IF NOT EXISTS `gallery_media` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `filename` VARCHAR(255) NOT NULL,
  `file_path` VARCHAR(255) NOT NULL,
  `file_size` INT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel Induk Produk
CREATE TABLE IF NOT EXISTS `products` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `category_id` INT NULL,
  `size_guide_id` INT NULL,
  `description` TEXT,
  `status` ENUM('available', 'draft', 'archived') DEFAULT 'available',
  `price` DECIMAL(10,2) DEFAULT 0,
  `original_price` DECIMAL(10,2) DEFAULT 0,
  `stock` INT DEFAULT 0,
  `weight` INT DEFAULT 0,
  `sku` VARCHAR(100) NULL,
  `has_variant` BOOLEAN DEFAULT FALSE,
  `variant_types_json` TEXT NULL,
  `seo_title` VARCHAR(255),
  `seo_description` TEXT,
  `seo_keywords` VARCHAR(255),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`category_id`) REFERENCES `product_categories`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`size_guide_id`) REFERENCES `size_guides`(`id`) ON DELETE SET NULL
);

-- Tabel Gambar Produk
CREATE TABLE IF NOT EXISTS `product_images` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `product_id` INT NOT NULL,
  `image_url` VARCHAR(255) NOT NULL,
  `is_primary` BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE
);

-- Tabel Variasi Produk
CREATE TABLE IF NOT EXISTS `product_variants` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `product_id` INT NOT NULL,
  `variant_key` VARCHAR(100) NOT NULL,
  `price` DECIMAL(10,2) DEFAULT 0,
  `original_price` DECIMAL(10,2) DEFAULT 0,
  `stock` INT DEFAULT 0,
  `weight` INT DEFAULT 0,
  `sku` VARCHAR(100) NULL,
  FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE
);

-- Tabel Grosir Produk
CREATE TABLE IF NOT EXISTS `product_wholesales` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `product_id` INT NOT NULL,
  `min_qty` INT NOT NULL,
  `wholesale_price` DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE
);