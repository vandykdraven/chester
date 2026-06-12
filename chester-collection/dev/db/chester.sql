-- phpMyAdmin SQL Dump
-- version 5.2.0
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3306
-- Waktu pembuatan: 12 Jun 2026 pada 06.18
-- Versi server: 8.0.31
-- Versi PHP: 8.0.26

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
(1, 'Administrator', 'admin@chester.com', '$2b$10$N/yT.A6Z43o2G8.Y78c2eONfEOMz5oQ.9XQ8Dk/9b.mXz/T8/Y67G', 'Superadmin', '2026-06-10 17:54:27');

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
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

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
(8, 'supportingImages-1781122060477-994582937.webp', '/uploads/products/supportingImages-1781122060477-994582937.webp', 0, '2026-06-11 19:46:27');

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
-- Struktur dari tabel `products`
--

DROP TABLE IF EXISTS `products`;
CREATE TABLE IF NOT EXISTS `products` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category_id` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `size_guide_id` int DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
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
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data untuk tabel `products`
--

INSERT INTO `products` (`id`, `name`, `category_id`, `size_guide_id`, `description`, `status`, `price`, `original_price`, `stock`, `weight`, `sku`, `has_variant`, `variant_types_json`, `seo_title`, `seo_description`, `seo_keywords`, `created_at`, `updated_at`) VALUES
(1, 'Celia Stripe Shirt', '', NULL, '<p>Celia Shirt - Premium Cotton Material</p><p><br></p><p> The CELIA Shirt is made from premium cotton that is soft, lightweight, and exceptionally comfortable for everyday wear. This breathable cotton fabric absorbs moisture well, feels cool on the skin, and has a smooth, neat drape. Perfect for anyone seeking maximum comfort without sacrificing style.</p><p><br></p><p>Size Chart</p><p>Bust: 120 cm</p><p>Upper Arm: 50 cm</p><p>Length: 68 cm</p><p>Sleeve Length: 51 cm</p><p><br></p><p>Perfect For</p><p>Designed as a versatile everyday top, the CELIA Shirt is suitable for many occasions, including:</p><p><br></p><p>Comfortable and effortless daily outfits</p><p>Work or meetings, thanks to its clean and polished look</p><p>Hangouts, casual strolls, or brunch</p><p>Semi-formal events such as gatherings or office occasions</p><p>Traveling, as the material is lightweight and keeps you cool</p><p>With its modern oversized cut and premium material, the CELIA Shirt is the perfect choice if you\'re looking for a breathable, simple, and elegant women’s top.</p><p><br></p><p>[KINDLY READ THIS POINT]</p><p><br></p><p>Orders paid before 14.00 WIB will be shipped on the same day.</p><p>Product colors may vary slightly due to lighting and device settings.</p><p>1000% Guaranteed! Claims are valid with an unboxing video.</p><p>Fast shipping every 12.00–15.00 WIB.</p><p>Size exchange is available within 24 hours after the package is received.</p><p>Size tolerance of 1–3 cm for each product.</p><p>[CUSTOMER SERVICE]</p><p>For any questions, concerns, or product issues, please contact our Customer Service via chat (online 09.00–16.00 WIB).</p><p><br></p><p>With love,</p><p><br></p><p>Ody teams</p>', 'available', '259000.00', '229510.00', 90, 200, 'CEL-SHR-AL', 0, NULL, 'Celia Shirt - Premium Cotton Material', 'The CELIA Shirt is made from premium cotton that is soft, lightweight, and exceptionally comfortable for everyday wear. This breathable cotton fabric absorbs moisture well, feels cool on the skin, and has a smooth, neat drape. Perfect for anyone seeking m', 'chester', '2026-06-10 20:07:40', '2026-06-11 19:41:03'),
(2, 'Daisy Bloom Cardigan', '', NULL, '<p>DAISY BLOOM CARDIGAN </p><p><br></p><p>– MATERAL PREMIUM KNIT</p><p><br></p><p><br></p><p><br></p><p>SIZE CHART</p><p><br></p><p>Bust : 100 cm</p><p>Length : 52 cm</p><p>Sleeve length : 55 cm</p><p><br></p><p><br></p><p>[KINDLY READ THIS POINTS]</p><p><br></p><p>Paid before 15.00 WIB for same day shio ping</p><p>There might be a bit different color consider the angle/ lighting/ tone of each device</p><p>1000% GUARANTEED! Claim with unboxing video only</p><p>Instant shipment process on 12.00-16.00 WIB</p><p>Size changing are allowed within 1x24 hours after receiving package</p><p>Size difference tolerance estimated in 1-3 cm for each product</p><p><br></p><p><br></p><p>[CUSTOMER SERVICE]</p><p><br></p><p>If there’s any obstacle or complain about our products kindly contact us on chat [online 09.00-17.00]</p><p>INSTANT delivery can only processed [Monday until Saturday, 09.00 - 15.00 WIB]</p><p><br></p><p><br></p><p>With love,</p><p><br></p><p>Ody teams</p>', 'available', '0.00', '0.00', 0, 0, '', 1, '[{\"name\":\"Warna\",\"options\":[\"Brown\",\"Pink\"]}]', 'DAISY BLOOM CARDIGAN', 'PREMIUM KNIT', 'cardigan, casual', '2026-06-11 16:31:33', '2026-06-11 19:34:06');

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
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data untuk tabel `product_images`
--

INSERT INTO `product_images` (`id`, `product_id`, `image_url`, `is_primary`, `created_at`) VALUES
(9, 2, '/uploads/products/primaryImage-1781195493486-57694264.webp', 1, '2026-06-11 19:34:06'),
(10, 2, '/uploads/products/supportingImages-1781195493501-740473428.webp', 0, '2026-06-11 19:34:06'),
(11, 2, '/uploads/products/supportingImages-1781195493508-312651382.webp', 0, '2026-06-11 19:34:06'),
(12, 2, '/uploads/products/supportingImages-1781195493534-636064209.webp', 0, '2026-06-11 19:34:06'),
(16, 1, '/uploads/products/primaryImage-1781122060302-747500951.webp', 1, '2026-06-11 19:41:03'),
(17, 1, '/uploads/products/supportingImages-1781122060307-489401236.webp', 0, '2026-06-11 19:41:03'),
(18, 1, '/uploads/products/supportingImages-1781122060453-886140123.webp', 0, '2026-06-11 19:41:03'),
(19, 1, '/uploads/products/supportingImages-1781122060477-994582937.webp', 0, '2026-06-11 19:41:03');

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
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data untuk tabel `product_variants`
--

INSERT INTO `product_variants` (`id`, `product_id`, `variant_key`, `price`, `original_price`, `stock`, `weight`, `sku`, `created_at`) VALUES
(3, 2, 'Brown', '399000.00', '349890.00', 50, 200, NULL, '2026-06-11 19:34:06'),
(4, 2, 'Pink', '399000.00', '259000.00', 50, 200, NULL, '2026-06-11 19:34:06');

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Struktur dari tabel `users`
--

DROP TABLE IF EXISTS `users`;
CREATE TABLE IF NOT EXISTS `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `fullname` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Ketidakleluasaan untuk tabel pelimpahan (Dumped Tables)
--

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
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
