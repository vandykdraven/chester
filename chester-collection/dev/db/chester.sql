-- phpMyAdmin SQL Dump
-- version 5.2.0
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3306
-- Waktu pembuatan: 18 Jul 2026 pada 22.58
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
  `city_id` varchar(100) DEFAULT NULL,
  `city_name` varchar(255) DEFAULT NULL,
  `postal_code` varchar(20) DEFAULT NULL,
  `subdistrict_id` varchar(10) DEFAULT NULL,
  `is_primary` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`)
) ENGINE=MyISAM AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data untuk tabel `addresses`
--

INSERT INTO `addresses` (`id`, `user_id`, `label`, `recipient_name`, `phone`, `full_address`, `province_id`, `province_name`, `city_id`, `city_name`, `postal_code`, `subdistrict_id`, `is_primary`) VALUES
(2, 101, 'Rumah', 'Anya G', '081234567890', 'Jl. Dago Asri No. 15, Kost Putri Kamar 2B, Coblong, Bandung, Jawa Barat 40132', 'BITESHIP', 'Jawa Barat', 'IDNP9IDNC22IDND2043', 'Coblong, Bandung, Jawa Barat. 40132, Bandung', '40132', NULL, 0),
(3, 101, 'Kantor', 'Anya', '081234567890', 'Temuwuh Rt 03', 'BITESHIP', 'DI Yogyakarta', 'IDNP5IDNC38IDND4524', 'Dlingo, Bantul, DI Yogyakarta. 55783, Bantul', '', NULL, 0),
(4, 101, 'Rumah Ke2', 'Anya', '081234567890', 'Serengan RT1', 'BITESHIP', 'Jawa Tengah', 'IDNP10IDNC435IDND5455', 'Serengan, Surakarta, Jawa Tengah. 57156, Surakarta', '', NULL, 1),
(13, 102, 'Rumah', 'Fandy', '083865886646', 'Jalan Dr. Rajiman 443', 'BITESHIP', 'Jawa Tengah', 'IDNP10IDNC435IDND5453IDZ57148', 'Laweyan, Surakarta, Jawa Tengah. 57148, Surakarta', '57148', NULL, 1);

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
-- Struktur dari tabel `carts`
--

DROP TABLE IF EXISTS `carts`;
CREATE TABLE IF NOT EXISTS `carts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `product_id` int NOT NULL,
  `variant_id` int DEFAULT NULL,
  `quantity` int DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `product_id` (`product_id`)
) ENGINE=MyISAM AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data untuk tabel `carts`
--

INSERT INTO `carts` (`id`, `user_id`, `product_id`, `variant_id`, `quantity`, `created_at`) VALUES
(1, 101, 2, 21, 2, '2026-06-22 16:50:47'),
(4, 101, 5, 27, 1, '2026-06-22 18:04:29');

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
  `province_id` varchar(100) DEFAULT '0',
  `province_name` varchar(100) DEFAULT NULL,
  `city_id` varchar(100) DEFAULT NULL,
  `city_name` varchar(100) DEFAULT NULL,
  `subdistrict_id` varchar(100) DEFAULT '0',
  `subdistrict_name` varchar(100) DEFAULT NULL,
  `postal_code` varchar(10) DEFAULT NULL,
  `full_address` text NOT NULL,
  `courier_name` varchar(50) NOT NULL,
  `courier_service` varchar(50) NOT NULL,
  `shipping_cost` decimal(12,2) NOT NULL,
  `discount_amount` decimal(12,2) DEFAULT '0.00',
  `airway_bill` varchar(100) DEFAULT NULL,
  `biteship_order_id` varchar(100) DEFAULT NULL,
  `waybill_url` text,
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
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data untuk tabel `orders`
--

INSERT INTO `orders` (`id`, `invoice_number`, `user_id`, `recipient_name`, `phone`, `province_id`, `province_name`, `city_id`, `city_name`, `subdistrict_id`, `subdistrict_name`, `postal_code`, `full_address`, `courier_name`, `courier_service`, `shipping_cost`, `discount_amount`, `airway_bill`, `biteship_order_id`, `waybill_url`, `kiriminaja_order_id`, `voucher_id`, `subtotal_products`, `total_amount`, `status`, `created_at`, `updated_at`) VALUES
(1, 'INV-20260614-001', 101, 'Anya Geraldine', '081234567890', '9', 'Jawa Barat', '23', 'Bandung', '500', 'Coblong', '40132', 'Jl. Dago Asri No. 15, Kost Putri Kamar 2B', 'jnt', 'EZ', '15000.00', '0.00', NULL, NULL, NULL, NULL, NULL, '658000.00', '673000.00', 'completed', '2026-06-14 02:00:00', '2026-07-01 14:55:30'),
(10, 'INV-20260630-5566', 102, 'B', '01888', '0', 'Jawa Tengah', 'IDNP10IDNC435IDND5453IDZ57148', 'Laweyan, Surakarta, Jawa Tengah. 57148, Surakarta', '0', NULL, '57148', '2', 'J&T', 'EZ', '11000.00', '0.00', NULL, '6a42cddd2669c836827d0e31', NULL, NULL, NULL, '229510.00', '240510.00', 'completed', '2026-06-29 19:45:52', '2026-07-01 14:56:12'),
(11, 'INV-20260630-1891', 102, 'B', '01888', '0', 'Jawa Tengah', 'IDNP10IDNC435IDND5453IDZ57148', 'Laweyan, Surakarta, Jawa Tengah. 57148, Surakarta', '0', NULL, '57148', '2', 'J&T', 'EZ', '11000.00', '0.00', NULL, '6a42d6882669c81c587d44b8', NULL, NULL, NULL, '299672.00', '311672.00', 'completed', '2026-06-29 20:30:40', '2026-07-01 14:56:21'),
(12, 'INV-20260701-5046', 102, 'B', '01888', '0', 'Jawa Tengah', 'IDNP10IDNC435IDND5453IDZ57148', 'Laweyan, Surakarta, Jawa Tengah. 57148, Surakarta', '0', NULL, '57148', '2', 'J&T', 'EZ', '11000.00', '0.00', NULL, NULL, NULL, NULL, NULL, '299672.00', '310672.00', 'completed', '2026-07-01 14:57:00', '2026-07-03 17:39:06'),
(13, 'INV-20260703-6980', 102, 'Fandy', '083865886646', '0', 'Jawa Tengah', 'IDNP10IDNC435IDND5453IDZ57148', 'Laweyan, Surakarta, Jawa Tengah. 57148, Surakarta', '0', NULL, '57148', 'Jalan Dr. Rajiman 443', 'J&T', 'EZ', '11000.00', '3000.00', NULL, NULL, NULL, NULL, NULL, '229510.00', '237510.00', 'cancelled', '2026-07-03 00:20:54', '2026-07-03 17:40:47'),
(14, 'INV-20260703-4863', 102, 'Fandy', '083865886646', '0', 'Jawa Tengah', 'IDNP10IDNC435IDND5453IDZ57148', 'Laweyan, Surakarta, Jawa Tengah. 57148, Surakarta', '0', NULL, '57148', 'Jalan Dr. Rajiman 443', 'J&T', 'EZ', '11000.00', '0.00', NULL, NULL, NULL, NULL, NULL, '299000.00', '310000.00', 'cancelled', '2026-07-03 00:25:00', '2026-07-03 17:40:57'),
(15, 'INV-20260704-8899', 102, 'Fandy', '083865886646', '0', 'Jawa Tengah', 'IDNP10IDNC435IDND5453IDZ57148', 'Laweyan, Surakarta, Jawa Tengah. 57148, Surakarta', '0', NULL, '57148', 'Jalan Dr. Rajiman 443', 'J&T', 'EZ', '11000.00', '0.00', NULL, NULL, NULL, NULL, NULL, '299000.00', '310000.00', 'pending', '2026-07-03 17:36:58', '2026-07-03 17:36:58'),
(16, 'INV-20260704-7439', 102, 'Fandy', '083865886646', '0', 'Jawa Tengah', 'IDNP10IDNC435IDND5453IDZ57148', 'Laweyan, Surakarta, Jawa Tengah. 57148, Surakarta', '0', NULL, '57148', 'Jalan Dr. Rajiman 443', 'J&T', 'EZ', '11000.00', '3000.00', NULL, NULL, NULL, NULL, NULL, '299000.00', '307000.00', 'pending', '2026-07-03 18:09:53', '2026-07-03 18:09:53'),
(17, 'INV-20260704-6470', 102, 'Fandy', '083865886646', '0', 'Jawa Tengah', 'IDNP10IDNC435IDND5453IDZ57148', 'Laweyan, Surakarta, Jawa Tengah. 57148, Surakarta', '0', NULL, '57148', 'Jalan Dr. Rajiman 443', 'J&T', 'EZ', '11000.00', '3000.00', NULL, NULL, NULL, NULL, NULL, '299000.00', '307000.00', 'pending', '2026-07-03 18:16:01', '2026-07-03 18:16:01'),
(18, 'INV-20260704-9383', 102, 'Fandy', '083865886646', '0', 'Jawa Tengah', 'IDNP10IDNC435IDND5453IDZ57148', 'Laweyan, Surakarta, Jawa Tengah. 57148, Surakarta', '0', NULL, '57148', 'Jalan Dr. Rajiman 443', 'J&T', 'EZ', '11000.00', '3000.00', NULL, NULL, NULL, NULL, NULL, '259000.00', '267000.00', 'pending', '2026-07-04 13:37:44', '2026-07-04 13:37:44');

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
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data untuk tabel `order_items`
--

INSERT INTO `order_items` (`id`, `order_id`, `product_id`, `product_name`, `variant_key`, `price`, `quantity`, `weight`) VALUES
(1, 1, 1, 'Celia Stripe Shirt', NULL, '259000.00', 1, 200),
(2, 1, 2, 'Daisy Bloom Cardigan', 'Brown', '399000.00', 1, 200),
(15, 10, 1, 'Celia Stripe Shirt', 'Standar', '229510.00', 1, 200),
(16, 11, 5, 'Polky Barrel Pants', 'L', '299672.00', 1, 200),
(17, 12, 5, 'Polky Barrel Pants', 'L', '299672.00', 1, 200),
(18, 13, 1, 'Celia Stripe Shirt', 'Standar', '229510.00', 1, 200),
(19, 14, 5, 'Polky Barrel Pants', 'M', '299000.00', 1, 200),
(20, 15, 5, 'Polky Barrel Pants', 'M', '299000.00', 1, 200),
(21, 16, 5, 'Polky Barrel Pants', 'M', '299000.00', 1, 200),
(22, 17, 5, 'Polky Barrel Pants', 'M', '299000.00', 1, 200),
(23, 18, 2, 'Daisy Bloom Cardigan', 'Pink', '259000.00', 1, 200);

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
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data untuk tabel `products`
--

INSERT INTO `products` (`id`, `name`, `category_id`, `size_guide_id`, `description`, `video_url`, `status`, `price`, `original_price`, `stock`, `weight`, `sku`, `has_variant`, `variant_types_json`, `seo_title`, `seo_description`, `seo_keywords`, `created_at`, `updated_at`) VALUES
(1, 'Celia Stripe Shirt', '1', 1, '<p>Celia Shirt - Premium Cotton Material</p><p><br></p><p> The CELIA Shirt is made from premium cotton that is soft, lightweight, and exceptionally comfortable for everyday wear. This breathable cotton fabric absorbs moisture well, feels cool on the skin, and has a smooth, neat drape. Perfect for anyone seeking maximum comfort without sacrificing style.</p><p><br></p><p>Size Chart</p><p>Bust: 120 cm</p><p>Upper Arm: 50 cm</p><p>Length: 68 cm</p><p>Sleeve Length: 51 cm</p><p><br></p><p>Perfect For</p><p>Designed as a versatile everyday top, the CELIA Shirt is suitable for many occasions, including:</p><p><br></p><ol><li data-list=\"bullet\"><span class=\"ql-ui\" contenteditable=\"false\"></span>Comfortable and effortless daily outfits</li><li data-list=\"bullet\"><span class=\"ql-ui\" contenteditable=\"false\"></span>Work or meetings, thanks to its clean and polished look</li><li data-list=\"bullet\"><span class=\"ql-ui\" contenteditable=\"false\"></span>Hangouts, casual strolls, or brunch</li><li data-list=\"bullet\"><span class=\"ql-ui\" contenteditable=\"false\"></span>Semi-formal events such as gatherings or office occasions</li><li data-list=\"bullet\"><span class=\"ql-ui\" contenteditable=\"false\"></span>Traveling, as the material is lightweight and keeps you cool</li><li data-list=\"bullet\"><span class=\"ql-ui\" contenteditable=\"false\"></span>With its modern oversized cut and premium material, the CELIA Shirt is the perfect choice if you\'re looking for a breathable, simple, and elegant women’s top.</li></ol><p><br></p><p>[KINDLY READ THIS POINT]</p><p><br></p><ol><li data-list=\"bullet\"><span class=\"ql-ui\" contenteditable=\"false\"></span>Orders paid before 14.00 WIB will be shipped on the same day.</li><li data-list=\"bullet\"><span class=\"ql-ui\" contenteditable=\"false\"></span>Product colors may vary slightly due to lighting and device settings.</li><li data-list=\"bullet\"><span class=\"ql-ui\" contenteditable=\"false\"></span>1000% Guaranteed! Claims are valid with an unboxing video.</li><li data-list=\"bullet\"><span class=\"ql-ui\" contenteditable=\"false\"></span>Fast shipping every 12.00–15.00 WIB.</li><li data-list=\"bullet\"><span class=\"ql-ui\" contenteditable=\"false\"></span>Size exchange is available within 24 hours after the package is received.</li><li data-list=\"bullet\"><span class=\"ql-ui\" contenteditable=\"false\"></span>Size tolerance of 1–3 cm for each product.</li><li data-list=\"bullet\"><span class=\"ql-ui\" contenteditable=\"false\"></span>[CUSTOMER SERVICE]</li><li data-list=\"bullet\"><span class=\"ql-ui\" contenteditable=\"false\"></span>For any questions, concerns, or product issues, please contact our Customer Service via chat (online 09.00–16.00 WIB).</li></ol><p><br></p><p>With love,</p><p><br></p><p>Ody teams</p>', NULL, 'available', '259000.00', '229510.00', 90, 200, 'CEL-SHR-AL', 0, NULL, 'Celia Shirt - Premium Cotton Material', 'The CELIA Shirt is made from premium cotton that is soft, lightweight, and exceptionally comfortable for everyday wear. This breathable cotton fabric absorbs moisture well, feels cool on the skin, and has a smooth, neat drape. Perfect for anyone seeking m', 'chester', '2026-06-10 20:07:40', '2026-06-22 16:31:17'),
(2, 'Daisy Bloom Cardigan', '9', 1, '<p>DAISY BLOOM CARDIGAN </p><p><br></p><p>– MATERAL PREMIUM KNIT</p><p><br></p><p><br></p><p><br></p><p>SIZE CHART</p><p><br></p><p>Bust : 100 cm</p><p>Length : 52 cm</p><p>Sleeve length : 55 cm</p><p><br></p><p><br></p><p>[KINDLY READ THIS POINTS]</p><p><br></p><ol><li data-list=\"bullet\"><span class=\"ql-ui\" contenteditable=\"false\"></span>Paid before 15.00 WIB for same day shio ping</li><li data-list=\"bullet\"><span class=\"ql-ui\" contenteditable=\"false\"></span>There might be a bit different color consider the angle/ lighting/ tone of each device</li><li data-list=\"bullet\"><span class=\"ql-ui\" contenteditable=\"false\"></span>1000% GUARANTEED! Claim with unboxing video only</li><li data-list=\"bullet\"><span class=\"ql-ui\" contenteditable=\"false\"></span>Instant shipment process on 12.00-16.00 WIB</li><li data-list=\"bullet\"><span class=\"ql-ui\" contenteditable=\"false\"></span>Size changing are allowed within 1x24 hours after receiving package</li><li data-list=\"bullet\"><span class=\"ql-ui\" contenteditable=\"false\"></span>Size difference tolerance estimated in 1-3 cm for each product</li></ol><p><br></p><p><br></p><p>[CUSTOMER SERVICE]</p><p><br></p><ol><li data-list=\"bullet\"><span class=\"ql-ui\" contenteditable=\"false\"></span>If there’s any obstacle or complain about our products kindly contact us on chat [online 09.00-17.00]</li><li data-list=\"bullet\"><span class=\"ql-ui\" contenteditable=\"false\"></span>INSTANT delivery can only processed [Monday until Saturday, 09.00 - 15.00 WIB]</li></ol><p><br></p><p><br></p><p>With love,</p><p><br></p><p>Ody teams</p>', 'https://www.youtube.com/watch?v=iLwmLaqHVF0', 'available', '0.00', '0.00', 99, 0, '', 1, '[{\"name\":\"Warna\",\"options\":[\"Brown\",\"Pink\"]}]', 'DAISY BLOOM CARDIGAN', 'PREMIUM KNIT', 'cardigan, casual', '2026-06-11 16:31:33', '2026-07-04 13:37:44'),
(5, 'Polky Barrel Pants', '8', NULL, '<p>POLKY BARREL PANTS</p><p>– MATERAL COTTON GLASSE DOTS</p><p><br></p><p>SIZE CHART</p><p>*Polky M*</p><p>LING PING: 70-88</p><p>LING PAHA : 63</p><p>PJG CLN: 100</p><p><br></p><p>*Polky L*</p><p>LING PING: 74-94</p><p>LING PAHA: 68</p><p>PJG LGN: 106</p><p><br></p><p>[KINDLY READ THIS POINTS]</p><p>- Paid before 15.00 WIB for same day shiping</p><p>- There might be a bit different color consider the angle/ lighting/ tone of each device</p><p>- 1000% GUARANTEED! Claim with unboxing video only</p><p>- Instant shipment process on 12.00-16.00 WIB</p><p>- Size changing are allowed within 1x24 hours after receiving package</p><p>- Size difference tolerance estimated in 1-3 cm for each product</p><p><br></p><p>[CUSTOMER SERVICE]</p><p>If there’s any obstacle or complain about our products kindly contact us on chat [online 09.00-17.00]</p><p><br></p><p>With love,</p><p>Ody teams</p><p><br></p>', NULL, 'available', '0.00', '0.00', 0, 0, '', 1, '[{\"name\":\"Ukuran\",\"options\":[\"M\",\"L\"]}]', NULL, NULL, NULL, '2026-06-22 17:01:32', '2026-06-22 17:03:31'),
(6, 'Miyu Layer Top Jeans', '9', 1, '<p>MIYU LAYER TOP JEANS</p><p><br></p><p>– MATERAL JEANS</p><p><br></p><p><br></p><p><br></p><p>SIZE CHART</p><p><br></p><p>SIZE M</p><p><br></p><p>• Bust : 110 cm</p><p><br></p><p>• Length : 60 cm</p><p><br></p><p>• Sleeve length : 55 cm</p><p><br></p><p><br></p><p><br></p><p>SIZE L</p><p><br></p><p>• Bust : 120 cm</p><p><br></p><p>• Length : 61 cm</p><p><br></p><p>• Sleeve length : 55 cm</p><p><br></p><p><br></p><p><br></p><p>[KINDLY READ THIS POINTS]</p><p><br></p><p>- Paid before 15.00 WIB for same day shipping</p><p><br></p><p>- There might be a bit different color consider the angle/ lighting/ tone of each device</p><p><br></p><p>- 1000% GUARANTEED! Claim with unboxing video only</p><p><br></p><p>- Instant shipment process on 12.00-16.00 WIB</p><p><br></p><p>- Size changing are allowed within 1x24 hours after receiving package</p><p><br></p><p>- Size difference tolerance estimated in 1-3 cm for each product</p><p><br></p><p><br></p><p><br></p><p>[CUSTOMER SERVICE]</p><p><br></p><p>- If there’s any obstacle or complain about our products kindly contact us on chat [online 09.00-17.00]</p><p><br></p><p><br></p><p><br></p><p>With love,</p><p><br></p><p>Ody teams</p>', NULL, 'available', '0.00', '0.00', 0, 0, '', 1, '[{\"name\":\"Variasi\",\"options\":[\"Light Blue\",\"Navy\"]},{\"name\":\"Size\",\"options\":[\"M\",\"L\"]}]', 'MIYU LAYER TOP JEANS', 'MIYU LAYER TOP JEANS\n\n– MATERAL JEANS', 'Shirts', '2026-07-04 17:42:10', '2026-07-07 17:05:26');

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
) ENGINE=InnoDB AUTO_INCREMENT=96 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data untuk tabel `product_images`
--

INSERT INTO `product_images` (`id`, `product_id`, `image_url`, `is_primary`, `created_at`) VALUES
(57, 2, '/uploads/products/primaryImage-1781195493486-57694264.webp', 1, '2026-06-22 16:27:43'),
(58, 2, '/uploads/products/supportingImages-1781195493501-740473428.webp', 0, '2026-06-22 16:27:43'),
(59, 2, '/uploads/products/supportingImages-1781195493508-312651382.webp', 0, '2026-06-22 16:27:43'),
(60, 2, '/uploads/products/supportingImages-1781195493534-636064209.webp', 0, '2026-06-22 16:27:43'),
(61, 1, '/uploads/products/primaryImage-1781122060302-747500951.webp', 1, '2026-06-22 16:31:17'),
(62, 1, '/uploads/products/supportingImages-1781122060307-489401236.webp', 0, '2026-06-22 16:31:17'),
(63, 1, '/uploads/products/supportingImages-1781122060453-886140123.webp', 0, '2026-06-22 16:31:17'),
(64, 1, '/uploads/products/supportingImages-1781122060477-994582937.webp', 0, '2026-06-22 16:31:17'),
(75, 5, '/uploads/products/primaryImage-1782147692512-832955493.jfif', 1, '2026-06-22 17:03:31'),
(76, 5, '/uploads/products/supportingImages-1782147692524-400167083.jfif', 0, '2026-06-22 17:03:31'),
(77, 5, '/uploads/products/supportingImages-1782147692535-110737167.jfif', 0, '2026-06-22 17:03:31'),
(78, 5, '/uploads/products/supportingImages-1782147692559-705883361.jpeg', 0, '2026-06-22 17:03:31'),
(79, 5, '/uploads/products/supportingImages-1782147692569-139073914.jpeg', 0, '2026-06-22 17:03:31'),
(92, 6, '/uploads/products/primaryImage-1783186930766-70418460.jpeg', 1, '2026-07-07 17:05:26'),
(93, 6, '/uploads/products/supportingImages-1783186930828-321390114.jpeg', 0, '2026-07-07 17:05:26'),
(94, 6, '/uploads/products/supportingImages-1783186930838-395404595.jpeg', 0, '2026-07-07 17:05:26'),
(95, 6, '/uploads/products/supportingImages-1783186930849-606997093.png', 0, '2026-07-07 17:05:26');

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
) ENGINE=InnoDB AUTO_INCREMENT=45 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data untuk tabel `product_variants`
--

INSERT INTO `product_variants` (`id`, `product_id`, `variant_key`, `price`, `original_price`, `stock`, `weight`, `sku`, `created_at`) VALUES
(21, 2, 'Brown', '399000.00', '349890.00', 50, 200, 'DSY-CDG-AL-BROWN', '2026-06-22 16:27:43'),
(22, 2, 'Pink', '399000.00', '259000.00', 49, 200, 'DSY-CDG-AL', '2026-06-22 16:27:43'),
(27, 5, 'M', '299000.00', '0.00', 2, 200, 'PLKY-PNTS-AL', '2026-06-22 17:03:31'),
(28, 5, 'L', '299672.00', '0.00', 3, 200, 'PLKY-PNTS-AL', '2026-06-22 17:03:31'),
(41, 6, 'Light Blue-M', '277500.00', '299000.00', 5, 200, '', '2026-07-07 17:05:26'),
(42, 6, 'Light Blue-L', '278900.00', '299000.00', 5, 200, '', '2026-07-07 17:05:26'),
(43, 6, 'Navy-M', '275500.00', '299000.00', 5, 200, '', '2026-07-07 17:05:26'),
(44, 6, 'Navy-L', '276000.00', '299000.00', 5, 200, '', '2026-07-07 17:05:26');

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
) ENGINE=InnoDB AUTO_INCREMENT=468 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data untuk tabel `settings`
--

INSERT INTO `settings` (`id`, `setting_key`, `setting_value`, `description`, `updated_at`) VALUES
(1, 'shop_name', 'Chester Collection', 'Nama toko yang tampil di web', '2026-06-14 02:06:54'),
(2, 'shop_phone', '081229566267', 'Nomor WhatsApp Admin / CS', '2026-07-03 00:23:17'),
(3, 'shop_address', 'Jalan Dr. Rajiman 443, Bumi, Laweyan, Surakarta', 'Alamat toko offline / titik jemput kurir', '2026-06-19 15:34:42'),
(4, 'kiriminaja_api_key', '', 'API Key dari Dashboard KiriminAja', '2026-06-14 02:06:54'),
(5, 'kiriminaja_is_production', '0', 'Set ke 1 jika sudah live, 0 untuk Sandbox/Testing', '2026-06-14 02:06:54'),
(9, 'rajaongkir_api_key', '9e9ca6f6b12283184b73454885595ea8', NULL, '2026-06-19 23:06:49'),
(10, 'rajaongkir_type', 'starter', NULL, '2026-06-21 12:31:42'),
(188, 'biteship_api_key', 'biteship_test.eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoiQ2hlc3RlciIsInVzZXJJZCI6IjZhMmUzOTgwNTcyN2E5YWJhNmQxZTAwNyIsImlhdCI6MTc4MjA1MTQ4Nn0.ZigZfP4XagbxCGTWDjaDqd-qn9zI1kS245F3I4HNIBQ', NULL, '2026-06-29 19:53:58'),
(205, 'active_couriers', 'jne,jnt,sicepat,pos,tiki,ninja,anteraja', NULL, '2026-06-26 11:00:58'),
(210, 'store_area_id', 'IDNP5IDNC38IDND4524IDZ55783', NULL, '2026-06-26 06:10:02'),
(360, 'smtp_host', '', NULL, '2026-07-02 23:45:44'),
(361, 'smtp_port', '', NULL, '2026-07-02 23:45:44'),
(362, 'smtp_user', '', NULL, '2026-07-02 23:45:44'),
(363, 'smtp_password', '', NULL, '2026-07-02 23:45:44'),
(364, 'fonnte_api_key', 'qcQm1U9bzCkbhKLmwFXh', NULL, '2026-07-02 23:45:45'),
(400, 'payment_accounts', '[{\"bank_name\":\"BCA\",\"bank_account\":\"73123456789\",\"bank_owner\":\"Chester Collection\"},{\"bank_name\":\"MANDIRI\",\"bank_account\":\"5731234567890\",\"bank_owner\":\"Chester Collection\"}]', NULL, '2026-07-03 17:36:31'),
(417, 'hero_banners', '[\"https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=2070&auto=format&fit=crop\",\"https://images.unsplash.com/photo-1496747611176-843222e1e57c?q=80&w=2073&auto=format&fit=crop\"]', NULL, '2026-07-05 11:48:46'),
(418, 'featured_collection_1', '{\"image\":\"https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=1200\",\"title\":\"Kebutuhan Musim Panas\",\"linkText\":\"Belanja Koleksi\",\"linkUrl\":\"/products\"}', NULL, '2026-07-05 11:48:46'),
(419, 'featured_collection_2', '{\"image\":\"https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=1200\",\"title\":\"Denim Harian\",\"linkText\":\"Belanja Koleksi\",\"linkUrl\":\"/products\"}', NULL, '2026-07-05 11:48:46'),
(430, 'social_facebook', 'https://facebook.com/vandykdraven', NULL, '2026-07-10 19:15:11'),
(431, 'social_instagram', 'https://instagram.com/vandykdraven/', NULL, '2026-07-10 19:15:11'),
(432, 'social_tiktok', 'https://tiktok.com/@vandykdraven', NULL, '2026-07-10 19:15:11'),
(433, 'social_twitter', '', NULL, '2026-07-08 23:45:54'),
(443, 'frontend_active_menus', '[1,9,6]', NULL, '2026-07-08 23:45:54');

-- --------------------------------------------------------

--
-- Struktur dari tabel `site_analytics`
--

DROP TABLE IF EXISTS `site_analytics`;
CREATE TABLE IF NOT EXISTS `site_analytics` (
  `id` int NOT NULL AUTO_INCREMENT,
  `page_url` varchar(255) DEFAULT NULL,
  `product_id` int DEFAULT NULL,
  `viewed_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `ip_address` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=466 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data untuk tabel `site_analytics`
--

INSERT INTO `site_analytics` (`id`, `page_url`, `product_id`, `viewed_at`, `ip_address`) VALUES
(1, '/profile', NULL, '2026-07-01 15:57:29', '::1'),
(2, '/profile', NULL, '2026-07-01 15:57:29', '::1'),
(3, '/admin', NULL, '2026-07-01 15:57:35', '::1'),
(4, '/admin', NULL, '2026-07-01 15:57:35', '::1'),
(5, '/', NULL, '2026-07-01 15:57:41', '::1'),
(6, '/products', NULL, '2026-07-01 15:57:42', '::1'),
(7, '/product/5', 5, '2026-07-01 15:57:43', '::1'),
(8, '/products', NULL, '2026-07-01 15:57:48', '::1'),
(9, '/product/2', 2, '2026-07-01 15:57:49', '::1'),
(10, '/products', NULL, '2026-07-01 15:57:50', '::1'),
(11, '/product/1', 1, '2026-07-01 15:57:51', '::1'),
(12, '/products', NULL, '2026-07-01 15:57:54', '::1'),
(13, '/admin', NULL, '2026-07-01 15:57:59', '::1'),
(14, '/admin', NULL, '2026-07-01 15:57:59', '::1'),
(15, '/admin/products', NULL, '2026-07-01 15:58:23', '::1'),
(16, '/admin/products/edit/5', NULL, '2026-07-01 15:58:28', '::1'),
(17, '/admin/products', NULL, '2026-07-01 15:58:31', '::1'),
(18, '/admin/products/add', NULL, '2026-07-01 15:58:32', '::1'),
(19, '/admin/products', NULL, '2026-07-01 15:58:36', '::1'),
(20, '/admin/product-categories', NULL, '2026-07-01 15:58:39', '::1'),
(21, '/admin/product-tags', NULL, '2026-07-01 15:58:41', '::1'),
(22, '/admin/size-guides', NULL, '2026-07-01 15:58:42', '::1'),
(23, '/admin/product-vouchers', NULL, '2026-07-01 15:58:47', '::1'),
(24, '/admin/product-shipping', NULL, '2026-07-01 15:58:49', '::1'),
(25, '/admin/orders', NULL, '2026-07-01 15:58:51', '::1'),
(26, '/admin/customers', NULL, '2026-07-01 15:58:54', '::1'),
(27, '/admin/orders', NULL, '2026-07-01 15:58:56', '::1'),
(28, '/admin/customers', NULL, '2026-07-01 15:59:03', '::1'),
(29, '/admin/products/gallery', NULL, '2026-07-01 15:59:06', '::1'),
(30, '/admin/settings', NULL, '2026-07-01 15:59:10', '::1'),
(31, '/admin', NULL, '2026-07-01 15:59:13', '::1'),
(32, '/admin/settings', NULL, '2026-07-01 15:59:27', '::1'),
(33, '/admin', NULL, '2026-07-01 15:59:28', '::1'),
(34, '/admin', NULL, '2026-07-01 16:34:42', '::1'),
(35, '/admin', NULL, '2026-07-01 16:34:42', '::1'),
(36, '/admin', NULL, '2026-07-01 16:34:53', '::1'),
(37, '/admin', NULL, '2026-07-01 16:34:53', '::1'),
(38, '/products', NULL, '2026-07-01 16:40:12', '::1'),
(39, '/products', NULL, '2026-07-01 16:40:12', '::1'),
(40, '/admin/settings', NULL, '2026-07-01 16:43:17', '::1'),
(41, '/', NULL, '2026-07-01 16:47:22', '::1'),
(42, '/admin/settings', NULL, '2026-07-01 16:59:20', '::1'),
(43, '/admin/settings', NULL, '2026-07-01 16:59:20', '::1'),
(44, '/admin/settings', NULL, '2026-07-01 17:16:04', '::1'),
(45, '/admin/settings', NULL, '2026-07-01 17:16:04', '::1'),
(46, '/', NULL, '2026-07-02 23:22:34', '::1'),
(47, '/', NULL, '2026-07-02 23:22:34', '::1'),
(48, '/admin', NULL, '2026-07-02 23:22:41', '::1'),
(49, '/admin', NULL, '2026-07-02 23:22:41', '::1'),
(50, '/admin/product-shipping', NULL, '2026-07-02 23:22:51', '::1'),
(51, '/admin/product-vouchers', NULL, '2026-07-02 23:22:52', '::1'),
(52, '/admin/size-guides', NULL, '2026-07-02 23:22:53', '::1'),
(53, '/admin/product-tags', NULL, '2026-07-02 23:22:54', '::1'),
(54, '/admin/product-categories', NULL, '2026-07-02 23:22:54', '::1'),
(55, '/admin/products', NULL, '2026-07-02 23:22:56', '::1'),
(56, '/admin/orders', NULL, '2026-07-02 23:22:57', '::1'),
(57, '/admin/customers', NULL, '2026-07-02 23:23:00', '::1'),
(58, '/admin/products/gallery', NULL, '2026-07-02 23:23:02', '::1'),
(59, '/admin/settings', NULL, '2026-07-02 23:23:08', '::1'),
(60, '/wishlist', NULL, '2026-07-03 00:16:47', '::1'),
(61, '/wishlist', NULL, '2026-07-03 00:16:47', '::1'),
(62, '/vouchers', NULL, '2026-07-03 00:16:49', '::1'),
(63, '/orders', NULL, '2026-07-03 00:16:50', '::1'),
(64, '/addresses', NULL, '2026-07-03 00:16:52', '::1'),
(65, '/orders', NULL, '2026-07-03 00:17:02', '::1'),
(66, '/admin/orders', NULL, '2026-07-03 00:17:18', '::1'),
(67, '/admin/orders/12', NULL, '2026-07-03 00:17:20', '::1'),
(68, '/addresses', NULL, '2026-07-03 00:18:02', '::1'),
(69, '/orders', NULL, '2026-07-03 00:18:51', '::1'),
(70, '/addresses', NULL, '2026-07-03 00:18:54', '::1'),
(71, '/products', NULL, '2026-07-03 00:19:08', '::1'),
(72, '/product/1', 1, '2026-07-03 00:19:15', '::1'),
(73, '/checkout', NULL, '2026-07-03 00:19:22', '::1'),
(74, '/products', NULL, '2026-07-03 00:19:30', '::1'),
(75, '/profile', NULL, '2026-07-03 00:19:33', '::1'),
(76, '/vouchers', NULL, '2026-07-03 00:19:36', '::1'),
(77, '/admin/product-vouchers', NULL, '2026-07-03 00:19:44', '::1'),
(78, '/vouchers', NULL, '2026-07-03 00:20:28', '::1'),
(79, '/vouchers', NULL, '2026-07-03 00:20:28', '::1'),
(80, '/checkout', NULL, '2026-07-03 00:20:37', '::1'),
(81, '/payment-confirmation/13', NULL, '2026-07-03 00:20:54', '::1'),
(82, '/admin/settings', NULL, '2026-07-03 00:22:57', '::1'),
(83, '/products', NULL, '2026-07-03 00:23:50', '::1'),
(84, '/product/2', 2, '2026-07-03 00:23:52', '::1'),
(85, '/', NULL, '2026-07-03 00:24:00', '::1'),
(86, '/profile', NULL, '2026-07-03 00:24:09', '::1'),
(87, '/addresses', NULL, '2026-07-03 00:24:11', '::1'),
(88, '/orders', NULL, '2026-07-03 00:24:13', '::1'),
(89, '/checkout', NULL, '2026-07-03 00:24:35', '::1'),
(90, '/products', NULL, '2026-07-03 00:24:35', '::1'),
(91, '/checkout', NULL, '2026-07-03 00:24:39', '::1'),
(92, '/products', NULL, '2026-07-03 00:24:40', '::1'),
(93, '/products', NULL, '2026-07-03 00:24:43', '::1'),
(94, '/products', NULL, '2026-07-03 00:24:43', '::1'),
(95, '/product/5', 5, '2026-07-03 00:24:47', '::1'),
(96, '/checkout', NULL, '2026-07-03 00:24:52', '::1'),
(97, '/payment-confirmation/14', NULL, '2026-07-03 00:25:00', '::1'),
(98, '/orders', NULL, '2026-07-03 00:25:03', '::1'),
(99, '/profile', NULL, '2026-07-03 00:25:16', '::1'),
(100, '/orders', NULL, '2026-07-03 00:25:18', '::1'),
(101, '/', NULL, '2026-07-03 16:48:51', '::1'),
(102, '/', NULL, '2026-07-03 16:48:51', '::1'),
(103, '/', NULL, '2026-07-03 16:49:07', '::1'),
(104, '/', NULL, '2026-07-03 16:49:07', '::1'),
(105, '/admin', NULL, '2026-07-03 16:49:14', '::1'),
(106, '/admin', NULL, '2026-07-03 16:49:14', '::1'),
(107, '/admin/settings', NULL, '2026-07-03 16:52:38', '::1'),
(108, '/admin/settings', NULL, '2026-07-03 17:04:21', '::1'),
(109, '/admin/settings', NULL, '2026-07-03 17:04:21', '::1'),
(110, '/', NULL, '2026-07-03 17:05:15', '::1'),
(111, '/', NULL, '2026-07-03 17:05:15', '::1'),
(112, '/admin/settings', NULL, '2026-07-03 17:14:26', '::1'),
(113, '/admin/settings', NULL, '2026-07-03 17:14:26', '::1'),
(114, '/admin/products', NULL, '2026-07-03 17:14:55', '::1'),
(115, '/admin/settings', NULL, '2026-07-03 17:14:57', '::1'),
(116, '/admin/settings', NULL, '2026-07-03 17:18:19', '::1'),
(117, '/admin/settings', NULL, '2026-07-03 17:18:19', '::1'),
(118, '/admin/settings', NULL, '2026-07-03 17:18:54', '::1'),
(119, '/admin/settings', NULL, '2026-07-03 17:18:54', '::1'),
(120, '/admin/settings', NULL, '2026-07-03 17:23:06', '::1'),
(121, '/admin/settings', NULL, '2026-07-03 17:23:06', '::1'),
(122, '/admin/settings', NULL, '2026-07-03 17:35:20', '::1'),
(123, '/admin/settings', NULL, '2026-07-03 17:35:20', '::1'),
(124, '/', NULL, '2026-07-03 17:36:34', '::1'),
(125, '/', NULL, '2026-07-03 17:36:34', '::1'),
(126, '/products', NULL, '2026-07-03 17:36:36', '::1'),
(127, '/product/5', 5, '2026-07-03 17:36:38', '::1'),
(128, '/checkout', NULL, '2026-07-03 17:36:46', '::1'),
(129, '/payment-confirmation/15', NULL, '2026-07-03 17:36:58', '::1'),
(130, '/checkout', NULL, '2026-07-03 17:37:02', '::1'),
(131, '/products', NULL, '2026-07-03 17:37:02', '::1'),
(132, '/profile', NULL, '2026-07-03 17:37:53', '::1'),
(133, '/orders', NULL, '2026-07-03 17:37:56', '::1'),
(134, '/admin/products', NULL, '2026-07-03 17:38:11', '::1'),
(135, '/admin/products', NULL, '2026-07-03 17:38:16', '::1'),
(136, '/admin/products', NULL, '2026-07-03 17:38:16', '::1'),
(137, '/admin/orders', NULL, '2026-07-03 17:38:37', '::1'),
(138, '/admin/orders', NULL, '2026-07-03 17:38:37', '::1'),
(139, '/admin/orders/12', NULL, '2026-07-03 17:38:42', '::1'),
(140, '/admin/products', NULL, '2026-07-03 17:38:52', '::1'),
(141, '/admin/products', NULL, '2026-07-03 17:38:52', '::1'),
(142, '/admin/products', NULL, '2026-07-03 17:39:02', '::1'),
(143, '/admin/products', NULL, '2026-07-03 17:39:02', '::1'),
(144, '/admin/products', NULL, '2026-07-03 17:39:10', '::1'),
(145, '/admin/products', NULL, '2026-07-03 17:39:10', '::1'),
(146, '/admin/products', NULL, '2026-07-03 17:39:14', '::1'),
(147, '/admin/products', NULL, '2026-07-03 17:39:14', '::1'),
(148, '/orders', NULL, '2026-07-03 17:39:28', '::1'),
(149, '/orders', NULL, '2026-07-03 17:39:28', '::1'),
(150, '/products', NULL, '2026-07-03 17:39:46', '::1'),
(151, '/product/5', 5, '2026-07-03 17:39:47', '::1'),
(152, '/products', NULL, '2026-07-03 17:40:24', '::1'),
(153, '/admin/orders', NULL, '2026-07-03 17:40:36', '::1'),
(154, '/admin/orders/13', NULL, '2026-07-03 17:40:39', '::1'),
(155, '/admin/orders', NULL, '2026-07-03 17:40:49', '::1'),
(156, '/admin/orders/14', NULL, '2026-07-03 17:40:52', '::1'),
(157, '/admin/orders', NULL, '2026-07-03 17:40:58', '::1'),
(158, '/admin/orders/15', NULL, '2026-07-03 17:41:00', '::1'),
(159, '/products', NULL, '2026-07-03 18:04:12', '::1'),
(160, '/products', NULL, '2026-07-03 18:04:12', '::1'),
(161, '/admin/products', NULL, '2026-07-03 18:04:16', '::1'),
(162, '/admin/products', NULL, '2026-07-03 18:04:16', '::1'),
(163, '/admin/orders/15', NULL, '2026-07-03 18:04:20', '::1'),
(164, '/admin/orders/15', NULL, '2026-07-03 18:04:20', '::1'),
(165, '/product/5', 5, '2026-07-03 18:04:28', '::1'),
(166, '/checkout', NULL, '2026-07-03 18:04:38', '::1'),
(167, '/payment-confirmation/16', NULL, '2026-07-03 18:09:54', '::1'),
(168, '/checkout', NULL, '2026-07-03 18:15:39', '::1'),
(169, '/products', NULL, '2026-07-03 18:15:39', '::1'),
(170, '/product/5', 5, '2026-07-03 18:15:44', '::1'),
(171, '/checkout', NULL, '2026-07-03 18:15:49', '::1'),
(172, '/payment-confirmation/17', NULL, '2026-07-03 18:16:01', '::1'),
(173, '/admin/orders', NULL, '2026-07-03 18:16:12', '::1'),
(174, '/admin/orders', NULL, '2026-07-03 18:16:12', '::1'),
(175, '/admin/orders', NULL, '2026-07-03 18:16:16', '::1'),
(176, '/admin/orders', NULL, '2026-07-03 18:16:16', '::1'),
(177, '/admin/products', NULL, '2026-07-03 18:16:20', '::1'),
(178, '/admin/products', NULL, '2026-07-03 18:16:20', '::1'),
(179, '/orders', NULL, '2026-07-03 18:25:16', '::1'),
(180, '/admin/orders', NULL, '2026-07-03 18:52:30', '::1'),
(181, '/admin/orders', NULL, '2026-07-03 18:52:30', '::1'),
(182, '/addresses', NULL, '2026-07-03 18:53:49', '::1'),
(183, '/profile', NULL, '2026-07-03 18:53:51', '::1'),
(184, '/orders', NULL, '2026-07-03 18:55:02', '::1'),
(185, '/orders', NULL, '2026-07-03 19:01:22', '::1'),
(186, '/orders', NULL, '2026-07-03 19:01:22', '::1'),
(187, '/payment-confirmation/17', NULL, '2026-07-03 19:01:24', '::1'),
(188, '/orders', NULL, '2026-07-03 19:01:27', '::1'),
(189, '/orders', NULL, '2026-07-04 05:35:27', '::1'),
(190, '/orders', NULL, '2026-07-04 05:35:27', '::1'),
(191, '/admin/orders', NULL, '2026-07-04 05:37:35', '::1'),
(192, '/admin/orders', NULL, '2026-07-04 05:37:35', '::1'),
(193, '/', NULL, '2026-07-04 13:08:11', '::1'),
(194, '/', NULL, '2026-07-04 13:08:11', '::1'),
(195, '/admin', NULL, '2026-07-04 13:08:17', '::1'),
(196, '/admin', NULL, '2026-07-04 13:08:17', '::1'),
(197, '/products', NULL, '2026-07-04 13:08:44', '::1'),
(198, '/product/5', 5, '2026-07-04 13:08:50', '::1'),
(199, '/product/5', 5, '2026-07-04 13:26:07', '::1'),
(200, '/product/5', 5, '2026-07-04 13:26:07', '::1'),
(201, '/product/5', 5, '2026-07-04 13:26:54', '::1'),
(202, '/product/5', 5, '2026-07-04 13:26:54', '::1'),
(203, '/admin', NULL, '2026-07-04 13:26:57', '::1'),
(204, '/admin', NULL, '2026-07-04 13:26:57', '::1'),
(205, '/checkout', NULL, '2026-07-04 13:27:00', '::1'),
(206, '/product/5', 5, '2026-07-04 13:27:03', '::1'),
(207, '/checkout', NULL, '2026-07-04 13:27:10', '::1'),
(208, '/product/5', 5, '2026-07-04 13:27:11', '::1'),
(209, '/', NULL, '2026-07-04 13:27:25', '::1'),
(210, '/products', NULL, '2026-07-04 13:27:55', '::1'),
(211, '/', NULL, '2026-07-04 13:27:56', '::1'),
(212, '/products', NULL, '2026-07-04 13:27:58', '::1'),
(213, '/admin/products', NULL, '2026-07-04 13:28:13', '::1'),
(214, '/admin/product-categories', NULL, '2026-07-04 13:28:15', '::1'),
(215, '/admin/orders', NULL, '2026-07-04 13:28:19', '::1'),
(216, '/admin/customers', NULL, '2026-07-04 13:28:26', '::1'),
(217, '/admin/products', NULL, '2026-07-04 13:28:29', '::1'),
(218, '/admin/product-categories', NULL, '2026-07-04 13:28:30', '::1'),
(219, '/admin/product-tags', NULL, '2026-07-04 13:28:32', '::1'),
(220, '/admin/size-guides', NULL, '2026-07-04 13:28:32', '::1'),
(221, '/admin/product-vouchers', NULL, '2026-07-04 13:28:35', '::1'),
(222, '/admin/product-shipping', NULL, '2026-07-04 13:28:37', '::1'),
(223, '/admin/products', NULL, '2026-07-04 13:28:38', '::1'),
(224, '/admin/products', NULL, '2026-07-04 13:37:13', '::1'),
(225, '/admin/products', NULL, '2026-07-04 13:37:13', '::1'),
(226, '/product/2', 2, '2026-07-04 13:37:29', '::1'),
(227, '/checkout', NULL, '2026-07-04 13:37:35', '::1'),
(228, '/payment-confirmation/18', NULL, '2026-07-04 13:37:44', '::1'),
(229, '/profile', NULL, '2026-07-04 13:37:49', '::1'),
(230, '/orders', NULL, '2026-07-04 13:37:53', '::1'),
(231, '/admin/products', NULL, '2026-07-04 13:37:58', '::1'),
(232, '/admin/products', NULL, '2026-07-04 13:37:58', '::1'),
(233, '/admin/product-shipping', NULL, '2026-07-04 13:38:03', '::1'),
(234, '/admin/products', NULL, '2026-07-04 13:38:04', '::1'),
(235, '/', NULL, '2026-07-04 13:38:50', '::1'),
(236, '/', NULL, '2026-07-04 16:13:11', '::1'),
(237, '/', NULL, '2026-07-04 16:13:11', '::1'),
(238, '/admin/products', NULL, '2026-07-04 16:13:16', '::1'),
(239, '/admin/products', NULL, '2026-07-04 16:13:16', '::1'),
(240, '/', NULL, '2026-07-04 16:13:17', '::1'),
(241, '/', NULL, '2026-07-04 16:13:17', '::1'),
(242, '/profile', NULL, '2026-07-04 16:13:19', '::1'),
(243, '/orders', NULL, '2026-07-04 16:13:20', '::1'),
(244, '/payment-confirmation/18', NULL, '2026-07-04 16:13:22', '::1'),
(245, '/payment-confirmation', NULL, '2026-07-04 16:13:36', '::1'),
(246, '/payment-confirmation', NULL, '2026-07-04 16:13:36', '::1'),
(247, '/payment-confirmation/17', NULL, '2026-07-04 16:13:45', '::1'),
(248, '/', NULL, '2026-07-04 16:22:29', '::1'),
(249, '/', NULL, '2026-07-04 16:22:29', '::1'),
(250, '/admin', NULL, '2026-07-04 16:23:50', '::1'),
(251, '/admin', NULL, '2026-07-04 16:23:50', '::1'),
(252, '/admin/homepage-settings', NULL, '2026-07-04 16:23:56', '::1'),
(253, '/admin/products', NULL, '2026-07-04 17:16:48', '::1'),
(254, '/admin/products/add', NULL, '2026-07-04 17:27:43', '::1'),
(255, '/admin/products', NULL, '2026-07-04 17:42:13', '::1'),
(256, '/', NULL, '2026-07-04 17:42:27', '::1'),
(257, '/', NULL, '2026-07-04 17:42:27', '::1'),
(258, '/products', NULL, '2026-07-04 17:43:06', '::1'),
(259, '/admin/homepage-settings', NULL, '2026-07-04 17:44:32', '::1'),
(260, '/products', NULL, '2026-07-04 18:17:02', '::1'),
(261, '/products', NULL, '2026-07-04 18:17:02', '::1'),
(262, '/products', NULL, '2026-07-05 10:40:13', '::1'),
(263, '/products', NULL, '2026-07-05 10:40:13', '::1'),
(264, '/product/6', 6, '2026-07-05 10:40:55', '::1'),
(265, '/admin/homepage-settings', NULL, '2026-07-05 10:43:58', '::1'),
(266, '/admin/homepage-settings', NULL, '2026-07-05 10:43:58', '::1'),
(267, '/admin/products', NULL, '2026-07-05 10:44:00', '::1'),
(268, '/admin/products/edit/6', NULL, '2026-07-05 10:44:03', '::1'),
(269, '/admin/products', NULL, '2026-07-05 10:45:00', '::1'),
(270, '/admin/products/edit/5', NULL, '2026-07-05 10:45:09', '::1'),
(271, '/admin/products', NULL, '2026-07-05 10:45:39', '::1'),
(272, '/admin/products/edit/6', NULL, '2026-07-05 10:45:42', '::1'),
(273, '/', NULL, '2026-07-05 11:47:36', '::1'),
(274, '/', NULL, '2026-07-05 11:47:36', '::1'),
(275, '/', NULL, '2026-07-05 11:48:53', '::1'),
(276, '/', NULL, '2026-07-05 11:48:53', '::1'),
(277, '/', NULL, '2026-07-05 15:43:07', '::1'),
(278, '/', NULL, '2026-07-05 15:43:07', '::1'),
(279, '/admin/homepage-settings', NULL, '2026-07-05 15:43:09', '::1'),
(280, '/admin/homepage-settings', NULL, '2026-07-05 15:43:09', '::1'),
(281, '/admin/homepage-settings', NULL, '2026-07-05 15:56:16', '::1'),
(282, '/admin/homepage-settings', NULL, '2026-07-05 15:56:16', '::1'),
(283, '/admin/pages/privacy', NULL, '2026-07-05 15:58:11', '::1'),
(284, '/admin/pages/faq', NULL, '2026-07-05 15:58:13', '::1'),
(285, '/admin/pages/terms', NULL, '2026-07-05 15:58:15', '::1'),
(286, '/admin/pages/privacy', NULL, '2026-07-05 15:58:19', '::1'),
(287, '/admin/pages/faq', NULL, '2026-07-05 15:58:22', '::1'),
(288, '/admin/pages/terms', NULL, '2026-07-05 15:58:24', '::1'),
(289, '/admin/pages/privacy', NULL, '2026-07-05 15:58:25', '::1'),
(290, '/admin/pages/faq', NULL, '2026-07-05 15:58:26', '::1'),
(291, '/admin/pages/terms', NULL, '2026-07-05 15:58:26', '::1'),
(292, '/admin/pages/privacy', NULL, '2026-07-05 15:58:27', '::1'),
(293, '/admin/pages/faq', NULL, '2026-07-05 16:27:11', '::1'),
(294, '/admin/pages/privacy', NULL, '2026-07-05 16:27:14', '::1'),
(295, '/admin/pages/faq', NULL, '2026-07-05 16:27:16', '::1'),
(296, '/admin/pages/terms', NULL, '2026-07-05 16:27:16', '::1'),
(297, '/admin/pages/terms', NULL, '2026-07-05 16:27:18', '::1'),
(298, '/admin/pages/terms', NULL, '2026-07-05 16:27:18', '::1'),
(299, '/admin/pages/privacy', NULL, '2026-07-05 16:27:21', '::1'),
(300, '/admin/pages/faq', NULL, '2026-07-05 16:27:22', '::1'),
(301, '/admin/pages/terms', NULL, '2026-07-05 16:27:23', '::1'),
(302, '/admin/pages/privacy', NULL, '2026-07-05 16:27:25', '::1'),
(303, '/admin/pages/privacy', NULL, '2026-07-05 16:27:27', '::1'),
(304, '/admin/pages/privacy', NULL, '2026-07-05 16:27:27', '::1'),
(305, '/admin/pages/faq', NULL, '2026-07-05 16:27:36', '::1'),
(306, '/admin/pages/faq', NULL, '2026-07-05 16:27:38', '::1'),
(307, '/admin/pages/faq', NULL, '2026-07-05 16:27:38', '::1'),
(308, '/admin/pages/faq', NULL, '2026-07-05 16:27:54', '::1'),
(309, '/admin/pages/faq', NULL, '2026-07-05 16:27:54', '::1'),
(310, '/admin/pages/terms', NULL, '2026-07-05 16:27:56', '::1'),
(311, '/admin/pages/faq', NULL, '2026-07-05 16:27:57', '::1'),
(312, '/admin/pages/privacy', NULL, '2026-07-05 16:27:58', '::1'),
(313, '/admin/pages/faq', NULL, '2026-07-05 16:28:42', '::1'),
(314, '/admin/pages/terms', NULL, '2026-07-05 16:28:43', '::1'),
(315, '/admin/pages/privacy', NULL, '2026-07-05 16:28:45', '::1'),
(316, '/admin/pages/privacy', NULL, '2026-07-05 16:35:10', '::1'),
(317, '/admin/pages/privacy', NULL, '2026-07-05 16:35:10', '::1'),
(318, '/admin/pages/faq', NULL, '2026-07-05 16:35:15', '::1'),
(319, '/admin/pages/terms', NULL, '2026-07-05 16:35:17', '::1'),
(320, '/admin/pages/privacy', NULL, '2026-07-05 16:35:19', '::1'),
(321, '/admin/pages/faq', NULL, '2026-07-05 16:35:23', '::1'),
(322, '/admin/pages/terms', NULL, '2026-07-05 16:35:24', '::1'),
(323, '/admin/pages/terms', NULL, '2026-07-05 16:35:27', '::1'),
(324, '/admin/pages/terms', NULL, '2026-07-05 16:35:27', '::1'),
(325, '/admin/pages/faq', NULL, '2026-07-05 16:36:04', '::1'),
(326, '/admin/pages/faq', NULL, '2026-07-05 16:40:41', '::1'),
(327, '/admin/pages/faq', NULL, '2026-07-05 16:40:41', '::1'),
(328, '/admin/pages/terms', NULL, '2026-07-05 16:40:47', '::1'),
(329, '/admin/pages/privacy', NULL, '2026-07-05 16:40:49', '::1'),
(330, '/', NULL, '2026-07-05 16:42:15', '::1'),
(331, '/', NULL, '2026-07-05 16:42:15', '::1'),
(332, '/admin/settings', NULL, '2026-07-05 16:42:22', '::1'),
(333, '/admin', NULL, '2026-07-05 16:42:43', '::1'),
(334, '/admin/orders', NULL, '2026-07-05 16:42:51', '::1'),
(335, '/admin/customers', NULL, '2026-07-05 16:42:53', '::1'),
(336, '/admin/products/gallery', NULL, '2026-07-05 16:42:54', '::1'),
(337, '/admin/products', NULL, '2026-07-05 16:42:59', '::1'),
(338, '/admin/product-categories', NULL, '2026-07-05 16:43:00', '::1'),
(339, '/', NULL, '2026-07-06 14:58:04', '::1'),
(340, '/', NULL, '2026-07-06 14:58:04', '::1'),
(341, '/admin', NULL, '2026-07-06 14:58:26', '::1'),
(342, '/admin', NULL, '2026-07-06 14:58:26', '::1'),
(343, '/', NULL, '2026-07-07 16:11:18', '::1'),
(344, '/', NULL, '2026-07-07 16:11:18', '::1'),
(345, '/', NULL, '2026-07-07 16:11:18', '::1'),
(346, '/', NULL, '2026-07-07 16:11:18', '::1'),
(347, '/admin', NULL, '2026-07-07 16:11:24', '::1'),
(348, '/admin/pages/privacy', NULL, '2026-07-07 16:22:39', '::1'),
(349, '/admin/pages/faq', NULL, '2026-07-07 16:22:40', '::1'),
(350, '/admin/pages/terms', NULL, '2026-07-07 16:22:42', '::1'),
(351, '/admin/orders', NULL, '2026-07-07 16:22:45', '::1'),
(352, '/admin/products', NULL, '2026-07-07 16:22:51', '::1'),
(353, '/admin/products/edit/6', NULL, '2026-07-07 16:22:54', '::1'),
(354, '/admin/products', NULL, '2026-07-07 16:24:05', '::1'),
(355, '/admin/settings', NULL, '2026-07-07 16:27:52', '::1'),
(356, '/admin/products', NULL, '2026-07-07 16:39:25', '::1'),
(357, '/admin/products/edit/6', NULL, '2026-07-07 16:42:39', '::1'),
(358, '/admin/products', NULL, '2026-07-07 16:42:42', '::1'),
(359, '/admin/products/edit/5', NULL, '2026-07-07 16:42:44', '::1'),
(360, '/admin/products', NULL, '2026-07-07 16:43:56', '::1'),
(361, '/admin/products/edit/6', NULL, '2026-07-07 16:43:57', '::1'),
(362, '/admin/products', NULL, '2026-07-07 17:05:29', '::1'),
(363, '/', NULL, '2026-07-07 17:05:35', '::1'),
(364, '/', NULL, '2026-07-07 17:05:35', '::1'),
(365, '/products', NULL, '2026-07-07 17:05:37', '::1'),
(366, '/product/6', 6, '2026-07-07 17:05:39', '::1'),
(367, '/admin/products/edit/6', NULL, '2026-07-07 17:06:05', '::1'),
(368, '/admin/products', NULL, '2026-07-07 17:06:16', '::1'),
(369, '/admin/products/edit/6', NULL, '2026-07-07 17:06:16', '::1'),
(370, '/admin/products', NULL, '2026-07-07 17:06:17', '::1'),
(371, '/admin/products/edit/5', NULL, '2026-07-07 17:06:19', '::1'),
(372, '/admin/products', NULL, '2026-07-07 17:06:26', '::1'),
(373, '/admin/products/edit/2', NULL, '2026-07-07 17:06:30', '::1'),
(374, '/', NULL, '2026-07-07 17:15:43', '::1'),
(375, '/admin/settings', NULL, '2026-07-07 17:17:07', '::1'),
(376, '/admin/homepage-settings', NULL, '2026-07-07 17:22:29', '::1'),
(377, '/admin/settings', NULL, '2026-07-07 17:22:30', '::1'),
(378, '/admin/settings', NULL, '2026-07-07 17:25:50', '::1'),
(379, '/admin/settings', NULL, '2026-07-07 17:25:50', '::1'),
(380, '/', NULL, '2026-07-08 22:47:47', '::1'),
(381, '/', NULL, '2026-07-08 22:47:47', '::1'),
(382, '/', NULL, '2026-07-08 22:47:50', '::1'),
(383, '/', NULL, '2026-07-08 22:47:50', '::1'),
(384, '/admin', NULL, '2026-07-08 22:47:56', '::1'),
(385, '/admin', NULL, '2026-07-08 23:27:39', '::1'),
(386, '/admin', NULL, '2026-07-08 23:27:39', '::1'),
(387, '/admin/settings', NULL, '2026-07-08 23:27:40', '::1'),
(388, '/admin', NULL, '2026-07-08 23:29:09', '::1'),
(389, '/admin/products', NULL, '2026-07-08 23:29:56', '::1'),
(390, '/admin/product-categories', NULL, '2026-07-08 23:30:02', '::1'),
(391, '/admin/product-tags', NULL, '2026-07-08 23:30:03', '::1'),
(392, '/admin/size-guides', NULL, '2026-07-08 23:30:04', '::1'),
(393, '/admin/product-vouchers', NULL, '2026-07-08 23:30:05', '::1'),
(394, '/admin/product-shipping', NULL, '2026-07-08 23:30:08', '::1'),
(395, '/admin/pages/privacy', NULL, '2026-07-08 23:30:11', '::1'),
(396, '/admin/pages/faq', NULL, '2026-07-08 23:30:13', '::1'),
(397, '/admin/pages/terms', NULL, '2026-07-08 23:30:13', '::1'),
(398, '/admin/orders', NULL, '2026-07-08 23:30:15', '::1'),
(399, '/admin/customers', NULL, '2026-07-08 23:30:27', '::1'),
(400, '/admin/orders', NULL, '2026-07-08 23:30:36', '::1'),
(401, '/admin/customers', NULL, '2026-07-08 23:30:37', '::1'),
(402, '/admin/products/gallery', NULL, '2026-07-08 23:30:38', '::1'),
(403, '/admin/homepage-settings', NULL, '2026-07-08 23:30:42', '::1'),
(404, '/admin/settings', NULL, '2026-07-08 23:30:47', '::1'),
(405, '/products', NULL, '2026-07-08 23:31:28', '::1'),
(406, '/', NULL, '2026-07-08 23:34:45', '::1'),
(407, '/admin/settings', NULL, '2026-07-08 23:45:20', '::1'),
(408, '/admin/settings', NULL, '2026-07-08 23:45:20', '::1'),
(409, '/admin/settings', NULL, '2026-07-08 23:45:57', '::1'),
(410, '/admin/settings', NULL, '2026-07-08 23:45:57', '::1'),
(411, '/admin/settings', NULL, '2026-07-09 00:05:43', '::1'),
(412, '/admin/settings', NULL, '2026-07-09 00:05:43', '::1'),
(413, '/products', NULL, '2026-07-09 00:08:49', '::1'),
(414, '/page/privacy', NULL, '2026-07-09 00:08:58', '::1'),
(415, '/page/faq', NULL, '2026-07-09 00:09:01', '::1'),
(416, '/page/terms', NULL, '2026-07-09 00:09:02', '::1'),
(417, '/page/privacy', NULL, '2026-07-09 00:09:04', '::1'),
(418, '/page/terms', NULL, '2026-07-09 00:09:09', '::1'),
(419, '/page/faq', NULL, '2026-07-09 00:09:10', '::1'),
(420, '/page/privacy', NULL, '2026-07-09 00:09:10', '::1'),
(421, '/products', NULL, '2026-07-09 00:09:11', '::1'),
(422, '/profile', NULL, '2026-07-09 00:09:20', '::1'),
(423, '/vouchers', NULL, '2026-07-09 00:09:25', '::1'),
(424, '/', NULL, '2026-07-09 00:11:03', '::1'),
(425, '/', NULL, '2026-07-10 19:05:47', '::1'),
(426, '/', NULL, '2026-07-10 19:05:47', '::1'),
(427, '/', NULL, '2026-07-10 19:05:57', '::1'),
(428, '/', NULL, '2026-07-10 19:05:57', '::1'),
(429, '/admin/dashboard', NULL, '2026-07-10 19:06:07', '::1'),
(430, '/admin/dashboard', NULL, '2026-07-10 19:06:07', '::1'),
(431, '/admin', NULL, '2026-07-10 19:06:26', '::1'),
(432, '/admin/homepage-settings', NULL, '2026-07-10 19:14:05', '::1'),
(433, '/admin/settings', NULL, '2026-07-10 19:14:06', '::1'),
(434, '/', NULL, '2026-07-10 19:15:16', '::1'),
(435, '/', NULL, '2026-07-10 19:15:16', '::1'),
(436, '/vouchers', NULL, '2026-07-10 19:18:31', '::1'),
(437, '/orders', NULL, '2026-07-10 19:18:38', '::1'),
(438, '/vouchers', NULL, '2026-07-10 19:18:40', '::1'),
(439, '/admin/product-vouchers', NULL, '2026-07-10 19:19:02', '::1'),
(440, '/', NULL, '2026-07-10 19:19:20', '::1'),
(441, '/products', NULL, '2026-07-10 19:37:45', '::1'),
(442, '/', NULL, '2026-07-10 19:37:50', '::1'),
(443, '/', NULL, '2026-07-10 19:40:15', '::1'),
(444, '/', NULL, '2026-07-10 19:40:15', '::1'),
(445, '/', NULL, '2026-07-10 19:41:07', '::1'),
(446, '/', NULL, '2026-07-10 19:41:07', '::1'),
(447, '/', NULL, '2026-07-10 19:41:46', '::1'),
(448, '/', NULL, '2026-07-10 19:41:46', '::1'),
(449, '/', NULL, '2026-07-10 19:46:14', '::1'),
(450, '/', NULL, '2026-07-10 19:46:14', '::1'),
(451, '/page/privacy', NULL, '2026-07-10 19:49:07', '::1'),
(452, '/page/faq', NULL, '2026-07-10 19:49:09', '::1'),
(453, '/page/terms', NULL, '2026-07-10 19:49:10', '::1'),
(454, '/', NULL, '2026-07-10 19:49:14', '::1'),
(455, '/', NULL, '2026-07-10 19:49:22', '::1'),
(456, '/', NULL, '2026-07-10 19:49:22', '::1'),
(457, '/', NULL, '2026-07-10 19:49:31', '::1'),
(458, '/', NULL, '2026-07-10 19:49:31', '::1'),
(459, '/admin/settings', NULL, '2026-07-10 19:49:54', '::1'),
(460, '/admin/product-vouchers', NULL, '2026-07-10 19:50:33', '::1'),
(461, '/', NULL, '2026-07-10 19:50:39', '::1'),
(462, '/', NULL, '2026-07-10 19:50:39', '::1'),
(463, '/', NULL, '2026-07-18 22:51:07', '::1'),
(464, '/', NULL, '2026-07-18 22:51:07', '::1'),
(465, '/products', NULL, '2026-07-18 22:51:17', '::1');

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
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data untuk tabel `user_vouchers`
--

INSERT INTO `user_vouchers` (`id`, `user_id`, `voucher_id`, `is_used`, `used_at`, `created_at`) VALUES
(1, 101, 1, 0, NULL, '2026-06-22 18:50:39'),
(2, 102, 1, 0, NULL, '2026-07-03 00:20:29');

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
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data untuk tabel `vouchers`
--

INSERT INTO `vouchers` (`id`, `code`, `name`, `discount_type`, `discount_value`, `max_discount`, `min_purchase`, `target_buyer`, `is_claimable`, `is_auto_apply`, `is_active`, `quota`, `used_count`, `start_date`, `end_date`, `created_at`, `updated_at`) VALUES
(1, 'DISCONGK', 'Discon Ongkir', 'shipping', '3000.00', '0.00', '100000.00', 'all', 1, 0, 0, 100, 0, '2026-06-16 07:00:00', '2026-07-10 00:59:00', '2026-06-15 16:57:29', '2026-07-10 19:49:27'),
(2, 'MERDEKA', 'Diskon Merdeka', 'fixed', '5000.00', '3000.00', '0.00', 'all', 0, 1, 0, 500, 0, '2026-06-16 00:00:00', '2026-06-20 00:00:00', '2026-06-15 17:00:19', '2026-07-10 19:49:27'),
(3, 'HARI INI', 'Hari Ini', 'fixed', '2000.00', '0.00', '100000.00', 'all', 1, 0, 0, 100, 0, '2026-07-11 02:39:00', '2026-07-31 02:40:00', '2026-07-10 19:40:11', '2026-07-10 19:49:39'),
(4, 'BESOK', 'Hari Besok', 'percent', '10.00', '2999.00', '250000.00', 'all', 1, 0, 0, 1000, 0, '2026-07-11 02:40:00', '2026-07-31 02:40:00', '2026-07-10 19:41:03', '2026-07-10 19:41:40');

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
) ENGINE=MyISAM AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data untuk tabel `wishlists`
--

INSERT INTO `wishlists` (`id`, `user_id`, `product_id`, `created_at`) VALUES
(1, 101, 2, '2026-06-22 14:38:08');

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
