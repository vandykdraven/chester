-- phpMyAdmin SQL Dump
-- version 5.2.0
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3306
-- Waktu pembuatan: 21 Jun 2026 pada 18.07
-- Versi server: 8.0.31
-- Versi PHP: 8.0.26

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `chester`
--

-- --------------------------------------------------------

--
-- Struktur dari tabel `addresses`
--

DROP TABLE IF EXISTS `addresses`;
CREATE TABLE IF NOT EXISTS `addresses` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `label` varchar(50) DEFAULT NULL,
  `recipient_name` varchar(100) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `full_address` text,
  `province_id` varchar(255) DEFAULT NULL,
  `province_name` varchar(255) DEFAULT NULL,
  `city_id` varchar(255) DEFAULT NULL,
  `city_name` varchar(255) DEFAULT NULL,
  `postal_code` varchar(20) DEFAULT NULL,
  `subdistrict_id` varchar(10) DEFAULT NULL,
  `is_primary` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`)
) ENGINE=MyISAM AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data untuk tabel `addresses`
--

INSERT INTO `addresses` (`id`, `user_id`, `label`, `recipient_name`, `phone`, `full_address`, `province_id`, `province_name`, `city_id`, `city_name`, `postal_code`, `subdistrict_id`, `is_primary`) VALUES
(1, 102, 'Rumah', 'Fandy', '083865886646', 'Jalan DR. Rajiman 443', 'BITESHIP', 'Jawa Tengah', 'IDNP10IDNC435IDND5453', 'Laweyan, Surakarta, Jawa Tengah. 57148, Surakarta', '', NULL, 1);

-- --------------------------------------------------------

--
-- Struktur dari tabel `admins`
--

DROP TABLE IF EXISTS `admins`;
CREATE TABLE IF NOT EXISTS `admins` (
  `id` int NOT NULL AUTO_INCREMENT,
  `fullname` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('Superadmin','Editor') DEFAULT 'Superadmin',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data untuk tabel `admins`
--

INSERT INTO `admins` (`id`, `fullname`, `email`, `password`, `role`, `created_at`) VALUES
(1, 'Super Admin', 'admin@chester.com', '$2a$12$uewyRwnoJlIsqoAgIRVQ1.uZliqUVxs67yW32eY832MFRwmIZwZ62', 'Superadmin', '2026-06-10 17:54:27');

-- --------------------------------------------------------

--
-- Struktur dari tabel `gallery_media`
--

DROP TABLE IF EXISTS `gallery_media`;
CREATE TABLE IF NOT EXISTS `gallery_media` (
  `id` int NOT NULL AUTO_INCREMENT,
  `filename` varchar(255) NOT NULL,
  `file_path` varchar(255) NOT NULL,
  `file_size` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data untuk tabel `gallery_media`
--

INSERT INTO `gallery_media` (`id`, `filename`, `file_path`, `file_size`, `created_at`) VALUES
(1, 'primaryImage-1781195493486-57694264.webp', '/uploads/products/primaryImage-1781195493486-57694264.webp', 0, '2026-06-11 19:46:27'),
(2, 'supportingImages-1781195493501-740473428.webp', '/uploads/products/supportingImages-1781195493501-740473428.webp', 0, '2026-06-11 19:46:27'),
(3, 'supportingImages-1781195493508-312651382.webp', '/uploads/products/supportingImages-1781195493508-312651382.webp', 0, '2026-06-11 19:46:27'),
(4, 'supportingImages-1781195493534-636064209.webp', '/uploads/products/supportingImages-1781195493534-636064209.webp', 0, '2026-06-11 19:46:27'),
(5, 'primaryImage-1781122060302-747500951.webp', '/uploads/products/primaryImage-1781122060302-747500951.webp', 0, '2026-06-11 19:46:27'),
(6, 'supportingImages-1781122060307-489401236.webp', '/uploads/products/supportingImages-1781122060307-489401236.webp', 0, '2026-06-11 19:46:27'),
(7, 'supportingImages-1781122060453-886140123.webp', '/uploads/products/supportingImages-1781122060453-886140123.webp', 0, '2026-06-11 19:46:27'),
(8, 'supportingImages-1781122060477-994582937.webp', '/uploads/products/supportingImages-1781122060477-994582937.webp', 0, '2026-06-11 19:46:27'),
(11, 'Size Chart.webp', '/uploads/products/galleryFile-1781270305476-573668088.webp', 19122, '2026-06-12 13:18:25');

-- --------------------------------------------------------

--
-- Struktur dari tabel `migrations`
--

DROP TABLE IF EXISTS `migrations`;
CREATE TABLE IF NOT EXISTS `migrations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `run_on` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data untuk tabel `migrations`
--

INSERT INTO `migrations` (`id`, `name`, `run_on`) VALUES
(1, '/20260605003848-create-table-admins', '2026-06-11 00:40:41'),
(2, '/20260605003849-create-table-users', '2026-06-11 00:40:41'),
(3, '/20260605003902-create-table-products', '2026-06-11 00:40:41'),
(4, '/20260610172623-create-product-system', '2026-06-11 00:40:41');

-- --------------------------------------------------------

--
-- Struktur dari tabel `orders`
--

DROP TABLE IF EXISTS `orders`;
CREATE TABLE IF NOT EXISTS `orders` (
  `id` int NOT NULL AUTO_INCREMENT,
  `invoice_number` varchar(50) NOT NULL,
  `user_id` int NOT NULL,
  `recipient_name` varchar(100) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `province_id` int NOT NULL,
  `province_name` varchar(100) DEFAULT NULL,
  `city_id` int NOT NULL,
  `city_name` varchar(100) DEFAULT NULL,
  `subdistrict_id` int NOT NULL,
  `subdistrict_name` varchar(100) DEFAULT NULL,
  `postal_code` varchar(10) DEFAULT NULL,
  `full_address` text NOT NULL,
  `courier_name` varchar(50) NOT NULL,
  `courier_service` varchar(50) NOT NULL,
  `shipping_cost` decimal(12,2) NOT NULL,
  `discount_amount` decimal(12,2) DEFAULT '0.00',
  `airway_bill` varchar(100) DEFAULT NULL,
  `kiriminaja_order_id` varchar(100) DEFAULT NULL,
  `voucher_id` int DEFAULT NULL,
  `subtotal_products` decimal(12,2) NOT NULL,
  `total_amount` decimal(12,2) NOT NULL,
  `status` enum('pending','paid','shipping','completed','cancelled') DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `invoice_number` (`invoice_number`),
  KEY `user_id` (`user_id`),
  KEY `fk_order_voucher` (`voucher_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data untuk tabel `orders`
--

INSERT INTO `orders` (`id`, `invoice_number`, `user_id`, `recipient_name`, `phone`, `province_id`, `province_name`, `city_id`, `city_name`, `subdistrict_id`, `subdistrict_name`, `postal_code`, `full_address`, `courier_name`, `courier_service`, `shipping_cost`, `discount_amount`, `airway_bill`, `kiriminaja_order_id`, `voucher_id`, `subtotal_products`, `total_amount`, `status`, `created_at`, `updated_at`) VALUES
(1, 'INV-20260614-001', 101, 'Anya Geraldine', '081234567890', 9, 'Jawa Barat', 23, 'Bandung', 500, 'Coblong', '40132', 'Jl. Dago Asri No. 15, Kost Putri Kamar 2B', 'jnt', 'EZ', '15000.00', '0.00', NULL, NULL, NULL, '658000.00', '673000.00', 'paid', '2026-06-14 02:00:00', '2026-06-14 05:27:35');

-- --------------------------------------------------------

--
-- Struktur dari tabel `order_items`
--

DROP TABLE IF EXISTS `order_items`;
CREATE TABLE IF NOT EXISTS `order_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `order_id` int NOT NULL,
  `product_id` int NOT NULL,
  `product_name` varchar(255) NOT NULL,
  `variant_key` varchar(100) DEFAULT NULL,
  `price` decimal(12,2) NOT NULL,
  `quantity` int NOT NULL,
  `weight` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `order_id` (`order_id`),
  KEY `product_id` (`product_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data untuk tabel `order_items`
--

INSERT INTO `order_items` (`id`, `order_id`, `product_id`, `product_name`, `variant_key`, `price`, `quantity`, `weight`) VALUES
(1, 1, 1, 'Celia Stripe Shirt', NULL, '259000.00', 1, 200),
(2, 1, 2, 'Daisy Bloom Cardigan', 'Brown', '399000.00', 1, 200);

-- --------------------------------------------------------

--
-- Struktur dari tabel `products`
--

DROP TABLE IF EXISTS `products`;
CREATE TABLE IF NOT EXISTS `products` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category_id` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `size_guide_id` int DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `video_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('available','draft') COLLATE utf8mb4_unicode_ci DEFAULT 'available',
  `price` decimal(12,2) DEFAULT '0.00',
  `original_price` decimal(12,2) DEFAULT '0.00',
  `stock` int DEFAULT '0',
  `weight` int DEFAULT '0',
  `sku` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `has_variant` tinyint(1) DEFAULT '0',
  `variant_types_json` text COLLATE utf8mb4_unicode_ci,
  `seo_title` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `seo_description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `seo_keywords` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `size_guide_id` (`size_guide_id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data untuk tabel `products`
--

INSERT INTO `products` (`id`, `name`, `category_id`, `size_guide_id`, `description`, `video_url`, `status`, `price`, `original_price`, `stock`, `weight`, `sku`, `has_variant`, `variant_types_json`, `seo_title`, `seo_description`, `seo_keywords`, `created_at`, `updated_at`) VALUES
(1, 'Celia Stripe Shirt', '1', 1, '<p>Celia Shirt - Premium Cotton Material</p><p><br></p><p> The CELIA Shirt is made from premium cotton that is soft, lightweight, and exceptionally comfortable for everyday wear. This breathable cotton fabric absorbs moisture well, feels cool on the skin, and has a smooth, neat drape. Perfect for anyone seeking maximum comfort without sacrificing style.</p><p><br></p><p>Size Chart</p><p>Bust: 120 cm</p><p>Upper Arm: 50 cm</p><p>Length: 68 cm</p><p>Sleeve Length: 51 cm</p><p><br></p><p>Perfect For</p><p>Designed as a versatile everyday top, the CELIA Shirt is suitable for many occasions, including:</p><p><br></p><p>Comfortable and effortless daily outfits</p><p>Work or meetings, thanks to its clean and polished look</p><p>Hangouts, casual strolls, or brunch</p><p>Semi-formal events such as gatherings or office occasions</p><p>Traveling, as the material is lightweight and keeps you cool</p><p>With its modern oversized cut and premium material, the CELIA Shirt is the perfect choice if you\'re looking for a breathable, simple, and elegant women’s top.</p><p><br></p><p>[KINDLY READ THIS POINT]</p><p><br></p><p>Orders paid before 14.00 WIB will be shipped on the same day.</p><p>Product colors may vary slightly due to lighting and device settings.</p><p>1000% Guaranteed! Claims are valid with an unboxing video.</p><p>Fast shipping every 12.00–15.00 WIB.</p><p>Size exchange is available within 24 hours after the package is received.</p><p>Size tolerance of 1–3 cm for each product.</p><p>[CUSTOMER SERVICE]</p><p>For any questions, concerns, or product issues, please contact our Customer Service via chat (online 09.00–16.00 WIB).</p><p><br></p><p>With love,</p><p><br></p><p>Ody teams</p>', NULL, 'available', '259000.00', '229510.00', 90, 200, 'CEL-SHR-AL', 0, NULL, 'Celia Shirt - Premium Cotton Material', 'The CELIA Shirt is made from premium cotton that is soft, lightweight, and exceptionally comfortable for everyday wear. This breathable cotton fabric absorbs moisture well, feels cool on the skin, and has a smooth, neat drape. Perfect for anyone seeking m', 'chester', '2026-06-10 20:07:40', '2026-06-12 14:54:43'),
(2, 'Daisy Bloom Cardigan', '9', 1, '<p>DAISY BLOOM CARDIGAN </p><p><br></p><p>– MATERAL PREMIUM KNIT</p><p><br></p><p><br></p><p><br></p><p>SIZE CHART</p><p><br></p><p>Bust : 100 cm</p><p>Length : 52 cm</p><p>Sleeve length : 55 cm</p><p><br></p><p><br></p><p>[KINDLY READ THIS POINTS]</p><p><br></p><p>Paid before 15.00 WIB for same day shio ping</p><p>There might be a bit different color consider the angle/ lighting/ tone of each device</p><p>1000% GUARANTEED! Claim with unboxing video only</p><p>Instant shipment process on 12.00-16.00 WIB</p><p>Size changing are allowed within 1x24 hours after receiving package</p><p>Size difference tolerance estimated in 1-3 cm for each product</p><p><br></p><p><br></p><p>[CUSTOMER SERVICE]</p><p><br></p><p>If there’s any obstacle or complain about our products kindly contact us on chat [online 09.00-17.00]</p><p>INSTANT delivery can only processed [Monday until Saturday, 09.00 - 15.00 WIB]</p><p><br></p><p><br></p><p>With love,</p><p><br></p><p>Ody teams</p>', 'https://www.youtube.com/watch?v=iLwmLaqHVF0', 'available', '0.00', '0.00', 0, 0, '', 1, '[{\"name\":\"Warna\",\"options\":[\"Brown\",\"Pink\"]}]', 'DAISY BLOOM CARDIGAN', 'PREMIUM KNIT', 'cardigan, casual', '2026-06-11 16:31:33', '2026-06-15 18:32:33');

-- --------------------------------------------------------

--
-- Struktur dari tabel `product_categories`
--

DROP TABLE IF EXISTS `product_categories`;
CREATE TABLE IF NOT EXISTS `product_categories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `slug` varchar(100) NOT NULL,
  `description` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data untuk tabel `product_categories`
--

INSERT INTO `product_categories` (`id`, `name`, `slug`, `description`, `created_at`) VALUES
(1, 'Shirt', 'shirt', NULL, '2026-06-12 14:51:55'),
(2, 'Summer Collection', 'summer-collection', NULL, '2026-06-12 14:52:10'),
(3, 'Weekend Deals', 'weekend-deals', NULL, '2026-06-12 14:52:26'),
(4, 'Polki', 'polki', NULL, '2026-06-12 14:52:54'),
(5, 'Petal Sweater', 'petal-sweater', NULL, '2026-06-12 14:53:06'),
(6, 'Blouse', 'blouse', NULL, '2026-06-12 14:53:14'),
(7, 'Knitwear', 'knitwear', NULL, '2026-06-12 14:53:24'),
(8, 'Pants & Skirts', 'pants--skirts', NULL, '2026-06-12 14:53:39'),
(9, 'Tops', 'tops', NULL, '2026-06-12 14:53:47');

-- --------------------------------------------------------

--
-- Struktur dari tabel `product_images`
--

DROP TABLE IF EXISTS `product_images`;
CREATE TABLE IF NOT EXISTS `product_images` (
  `id` int NOT NULL AUTO_INCREMENT,
  `product_id` int NOT NULL,
  `image_url` varchar(255) NOT NULL,
  `is_primary` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `product_id` (`product_id`)
) ENGINE=InnoDB AUTO_INCREMENT=41 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data untuk tabel `product_images`
--

INSERT INTO `product_images` (`id`, `product_id`, `image_url`, `is_primary`, `created_at`) VALUES
(24, 1, '/uploads/products/primaryImage-1781122060302-747500951.webp', 1, '2026-06-12 14:54:43'),
(25, 1, '/uploads/products/supportingImages-1781122060307-489401236.webp', 0, '2026-06-12 14:54:43'),
(26, 1, '/uploads/products/supportingImages-1781122060453-886140123.webp', 0, '2026-06-12 14:54:43'),
(27, 1, '/uploads/products/supportingImages-1781122060477-994582937.webp', 0, '2026-06-12 14:54:43'),
(37, 2, '/uploads/products/primaryImage-1781195493486-57694264.webp', 1, '2026-06-15 18:32:34'),
(38, 2, '/uploads/products/supportingImages-1781195493501-740473428.webp', 0, '2026-06-15 18:32:34'),
(39, 2, '/uploads/products/supportingImages-1781195493508-312651382.webp', 0, '2026-06-15 18:32:34'),
(40, 2, '/uploads/products/supportingImages-1781195493534-636064209.webp', 0, '2026-06-15 18:32:34');

-- --------------------------------------------------------

--
-- Struktur dari tabel `product_reviews`
--

DROP TABLE IF EXISTS `product_reviews`;
CREATE TABLE IF NOT EXISTS `product_reviews` (
  `id` int NOT NULL AUTO_INCREMENT,
  `order_id` int NOT NULL,
  `product_id` int NOT NULL,
  `user_id` int NOT NULL,
  `rating` int NOT NULL,
  `comment` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `order_id` (`order_id`),
  KEY `product_id` (`product_id`),
  KEY `user_id` (`user_id`)
) ;

-- --------------------------------------------------------

--
-- Struktur dari tabel `product_tags`
--

DROP TABLE IF EXISTS `product_tags`;
CREATE TABLE IF NOT EXISTS `product_tags` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data untuk tabel `product_tags`
--

INSERT INTO `product_tags` (`id`, `name`, `created_at`) VALUES
(1, 'Shirts', '2026-06-12 15:22:25'),
(2, 'Blouse', '2026-06-12 15:22:32');

-- --------------------------------------------------------

--
-- Struktur dari tabel `product_variants`
--

DROP TABLE IF EXISTS `product_variants`;
CREATE TABLE IF NOT EXISTS `product_variants` (
  `id` int NOT NULL AUTO_INCREMENT,
  `product_id` int NOT NULL,
  `variant_key` varchar(150) NOT NULL,
  `price` decimal(12,2) NOT NULL,
  `original_price` decimal(12,2) DEFAULT '0.00',
  `stock` int NOT NULL DEFAULT '0',
  `weight` int NOT NULL DEFAULT '0',
  `sku` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `product_id` (`product_id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data untuk tabel `product_variants`
--

INSERT INTO `product_variants` (`id`, `product_id`, `variant_key`, `price`, `original_price`, `stock`, `weight`, `sku`, `created_at`) VALUES
(11, 2, 'Brown', '399000.00', '349890.00', 50, 200, NULL, '2026-06-15 18:32:34'),
(12, 2, 'Pink', '399000.00', '259000.00', 50, 200, NULL, '2026-06-15 18:32:34');

-- --------------------------------------------------------

--
-- Struktur dari tabel `product_wholesales`
--

DROP TABLE IF EXISTS `product_wholesales`;
CREATE TABLE IF NOT EXISTS `product_wholesales` (
  `id` int NOT NULL AUTO_INCREMENT,
  `product_id` int NOT NULL,
  `min_qty` int NOT NULL,
  `wholesale_price` decimal(12,2) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `product_id` (`product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Struktur dari tabel `settings`
--

DROP TABLE IF EXISTS `settings`;
CREATE TABLE IF NOT EXISTS `settings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `setting_key` varchar(100) NOT NULL,
  `setting_value` text,
  `description` varchar(255) DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `setting_key` (`setting_key`)
) ENGINE=InnoDB AUTO_INCREMENT=205 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data untuk tabel `settings`
--

INSERT INTO `settings` (`id`, `setting_key`, `setting_value`, `description`, `updated_at`) VALUES
(1, 'shop_name', 'Chester Collection', 'Nama toko yang tampil di web', '2026-06-14 02:06:54'),
(2, 'shop_phone', '08123456789011', 'Nomor WhatsApp Admin / CS', '2026-06-14 13:02:59'),
(3, 'shop_address', 'Jalan Dr. Rajiman 443, Bumi, Laweyan, Surakarta', 'Alamat toko offline / titik jemput kurir', '2026-06-19 15:34:42'),
(4, 'kiriminaja_api_key', '', 'API Key dari Dashboard KiriminAja', '2026-06-14 02:06:54'),
(5, 'kiriminaja_is_production', '0', 'Set ke 1 jika sudah live, 0 untuk Sandbox/Testing', '2026-06-14 02:06:54'),
(9, 'rajaongkir_api_key', '9e9ca6f6b12283184b73454885595ea8', NULL, '2026-06-19 23:06:49'),
(10, 'rajaongkir_type', 'starter', NULL, '2026-06-21 12:31:42'),
(188, 'biteship_api_key', 'biteship_test.eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoiQ2hlc3RlciIsInVzZXJJZCI6IjZhMmUzOTgwNTcyN2E5YWJhNmQxZTAwNyIsImlhdCI6MTc4MjA1MTQ4Nn0.ZigZfP4XagbxCGTWDjaDqd-qn9zI1kS245F3I4HNIBQ', NULL, '2026-06-21 14:18:19');

-- --------------------------------------------------------

--
-- Struktur dari tabel `size_guides`
--

DROP TABLE IF EXISTS `size_guides`;
CREATE TABLE IF NOT EXISTS `size_guides` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  `content` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data untuk tabel `size_guides`
--

INSERT INTO `size_guides` (`id`, `name`, `image_url`, `content`, `created_at`) VALUES
(1, 'Panduan Ukuran', '/uploads/products/galleryFile-1781270305476-573668088.webp', NULL, '2026-06-12 13:18:28');

-- --------------------------------------------------------

--
-- Struktur dari tabel `users`
--

DROP TABLE IF EXISTS `users`;
CREATE TABLE IF NOT EXISTS `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `fullname` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `avatar` varchar(255) DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `status` enum('active','suspended') DEFAULT 'active',
  `reset_password_token` varchar(255) DEFAULT NULL,
  `reset_password_expires` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=103 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data untuk tabel `users`
--

INSERT INTO `users` (`id`, `fullname`, `email`, `phone`, `avatar`, `password`, `status`, `reset_password_token`, `reset_password_expires`, `created_at`) VALUES
(101, 'Anya Geraldine', 'anya.g@contoh.com', '081234567890', NULL, '$2a$12$NE.PU/gNonqFiTQ3r7YzdObJl6YqhpZ5hpNVItZGDzP38JEB/pEGG', 'active', NULL, NULL, '2026-06-14 02:02:50'),
(102, 'Fandy Akhmad Riady', 'fndy.akhmad@gmail.com', '083865886646', NULL, '$2a$12$uewyRwnoJlIsqoAgIRVQ1.uZliqUVxs67yW32eY832MFRwmIZwZ62', 'active', '209e9352a22e09210947f62019eac5a151ed52be2f661905a1d0212178b3d08f', '2026-06-16 20:28:13', '2026-06-16 11:26:34');

-- --------------------------------------------------------

--
-- Struktur dari tabel `user_vouchers`
--

DROP TABLE IF EXISTS `user_vouchers`;
CREATE TABLE IF NOT EXISTS `user_vouchers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `voucher_id` int NOT NULL,
  `is_used` tinyint(1) DEFAULT '0',
  `used_at` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_voucher` (`user_id`,`voucher_id`),
  KEY `voucher_id` (`voucher_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Struktur dari tabel `vouchers`
--

DROP TABLE IF EXISTS `vouchers`;
CREATE TABLE IF NOT EXISTS `vouchers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `code` varchar(50) NOT NULL,
  `name` varchar(100) NOT NULL,
  `discount_type` enum('shipping','fixed','percent') NOT NULL,
  `discount_value` decimal(12,2) NOT NULL,
  `max_discount` decimal(12,2) DEFAULT '0.00',
  `min_purchase` decimal(12,2) DEFAULT '0.00',
  `target_buyer` enum('all','new_customer') DEFAULT 'all',
  `is_claimable` tinyint(1) DEFAULT '0',
  `is_auto_apply` tinyint(1) DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `quota` int DEFAULT '0',
  `used_count` int DEFAULT '0',
  `start_date` datetime NOT NULL,
  `end_date` datetime NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data untuk tabel `vouchers`
--

INSERT INTO `vouchers` (`id`, `code`, `name`, `discount_type`, `discount_value`, `max_discount`, `min_purchase`, `target_buyer`, `is_claimable`, `is_auto_apply`, `is_active`, `quota`, `used_count`, `start_date`, `end_date`, `created_at`, `updated_at`) VALUES
(1, 'DISCONGK', 'Discon Ongkir', 'shipping', '3000.00', '0.00', '100000.00', 'all', 1, 0, 1, 100, 0, '2026-06-16 07:00:00', '2026-06-30 00:59:00', '2026-06-15 16:57:29', '2026-06-15 16:57:29'),
(2, 'MERDEKA', 'Diskon Merdeka', 'fixed', '5000.00', '3000.00', '0.00', 'all', 0, 1, 1, 500, 0, '2026-06-16 00:00:00', '2026-06-20 00:00:00', '2026-06-15 17:00:19', '2026-06-15 17:00:19');

-- --------------------------------------------------------

--
-- Struktur dari tabel `wishlists`
--

DROP TABLE IF EXISTS `wishlists`;
CREATE TABLE IF NOT EXISTS `wishlists` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `product_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Ketidakleluasaan untuk tabel pelimpahan (Dumped Tables)
--

--
-- Ketidakleluasaan untuk tabel `orders`
--
ALTER TABLE `orders`
  ADD CONSTRAINT `fk_order_voucher` FOREIGN KEY (`voucher_id`) REFERENCES `vouchers` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT;

--
-- Ketidakleluasaan untuk tabel `order_items`
--
ALTER TABLE `order_items`
  ADD CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `order_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE RESTRICT;

--
-- Ketidakleluasaan untuk tabel `products`
--
ALTER TABLE `products`
  ADD CONSTRAINT `products_ibfk_1` FOREIGN KEY (`size_guide_id`) REFERENCES `size_guides` (`id`) ON DELETE SET NULL;

--
-- Ketidakleluasaan untuk tabel `product_images`
--
ALTER TABLE `product_images`
  ADD CONSTRAINT `product_images_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE;

--
-- Ketidakleluasaan untuk tabel `product_variants`
--
ALTER TABLE `product_variants`
  ADD CONSTRAINT `product_variants_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE;

--
-- Ketidakleluasaan untuk tabel `product_wholesales`
--
ALTER TABLE `product_wholesales`
  ADD CONSTRAINT `product_wholesales_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE;

--
-- Ketidakleluasaan untuk tabel `user_vouchers`
--
ALTER TABLE `user_vouchers`
  ADD CONSTRAINT `user_vouchers_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `user_vouchers_ibfk_2` FOREIGN KEY (`voucher_id`) REFERENCES `vouchers` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
